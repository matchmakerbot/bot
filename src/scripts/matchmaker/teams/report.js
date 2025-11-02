const Discord = require("discord.js");
const EloRank = require("elo-rank");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema.js");

const MatchmakerTeamsScoreCollection = require("../../../utils/schemas/matchmakerTeamsScoreSchema");

const ServerSettingsCollection = require("../../../utils/schemas/serverSettingsSchema");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const client = require("../../../utils/createClientInstance.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply, getContent } = require("../../../utils/utils");

const assignScoreTeams = async (game) => {
  const promises = [];

  [game.team1, game.team2].forEach((team) => {
    const won =
      (game.winningTeam === 0 && game.team1.name === team.name) ||
      (game.winningTeam === 1 && game.team2.name === team.name);

    const score = won ? "wins" : "losses";

    promises.push(
      MatchmakerTeamsScoreCollection.updateOne(
        {
          channelId: game.channelId,
          name: team.name,
        },
        {
          $inc: { [score]: 1, mmr: won ? game.mmrDifference : -game.mmrDifference },
        }
      )
    );
  });
  await Promise.all(promises);
};

const execute = async (interaction) => {
  const param = getContent(interaction)[0];

  const elo = new EloRank(16);

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const warningEmbed = new Discord.MessageEmbed().setColor("#FFA500");

  const userId = interaction.member.id;

  const channelId = interaction.channel.id;

  const ongoingGame = await OngoingGamesTeamsCollection.findOne({
    channelId,
    $or: [
      { "team1.memberIds": userId },
      { "team1.captain": userId },
      { "team2.memberIds": userId },
      { "team2.captain": userId },
    ],
  });

  if (!ongoingGame) {
    wrongEmbed.setTitle(
      ":x: You aren't in a game, or the game is in a different guild/channel, or you're not the captain!"
    );

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (!["win", "lose"].includes(param)) {
    wrongEmbed.setTitle(":x: Invalid parameter, please use /report win or /report lose");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const isTeam1 = ongoingGame.team1.captain === userId || ongoingGame.team1.memberIds.includes(userId);
  const userTeam = isTeam1 ? "team1" : "team2";
  const userTeamName = isTeam1 ? ongoingGame.team1.name : ongoingGame.team2.name;
  const otherTeamName = isTeam1 ? ongoingGame.team2.name : ongoingGame.team1.name;

  if (!ongoingGame.team1Reports) ongoingGame.team1Reports = [];
  if (!ongoingGame.team2Reports) ongoingGame.team2Reports = [];

  const userTeamReports = userTeam === "team1" ? ongoingGame.team1Reports : ongoingGame.team2Reports;
  const otherTeamReports = userTeam === "team1" ? ongoingGame.team2Reports : ongoingGame.team1Reports;

  const hasReported = userTeamReports.some((report) => report.userId === userId);
  if (hasReported) {
    wrongEmbed.setTitle(":x: You have already reported the result for this game!");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  const newReport = {
    userId,
    result: param,
    timestamp: new Date(),
  };

  userTeamReports.push(newReport);

  await OngoingGamesTeamsCollection.updateOne(
    { gameId: ongoingGame.gameId },
    {
      [`${userTeam}Reports`]: userTeamReports,
    }
  );

  if (otherTeamReports.length === 0) {
    correctEmbed.setTitle(`:white_check_mark: Report Submitted!`);
    correctEmbed.setDescription(
      `Team **${userTeamName}** reported **${param}**.\n\nWaiting for team **${otherTeamName}** to report their result.`
    );
    await sendReply(interaction, correctEmbed);
    return;
  }

  const team1Result = ongoingGame.team1Reports[0].result;
  const team2Result = ongoingGame.team2Reports[0].result;

  const conflict =
    (team1Result === "win" && team2Result === "win") || (team1Result === "lose" && team2Result === "lose");

  if (conflict) {
    const disputeReason = `Team ${ongoingGame.team1.name} reported ${team1Result}, Team ${ongoingGame.team2.name} reported ${team2Result}`;

    await OngoingGamesTeamsCollection.updateOne(
      { gameId: ongoingGame.gameId },
      {
        dispute: true,
        disputeReason,
      }
    );

    warningEmbed.setTitle("⚠️ Dispute Detected!");
    warningEmbed.setDescription(
      `**Conflicting reports:**\n` +
        `• Team **${ongoingGame.team1.name}** reported: **${team1Result}**\n` +
        `• Team **${ongoingGame.team2.name}** reported: **${team2Result}**\n\n` +
        `Administrators have been notified in the admin channel.\n\n` +
        `Game ID: **${ongoingGame.gameId}**`
    );

    await sendReply(interaction, warningEmbed);

    try {
      const serverSettings = await ServerSettingsCollection.findOne({ guildId: ongoingGame.guildId });

      if (serverSettings?.adminChannelId) {
        const adminChannel = await client.channels.fetch(serverSettings.adminChannelId);

        if (adminChannel) {
          const adminEmbed = new Discord.MessageEmbed()
            .setColor("#FFA500")
            .setTitle("⚠️ Game Dispute Requires Resolution")
            .setDescription(
              `**Game ID:** ${ongoingGame.gameId}\n` +
                `**Channel:** <#${ongoingGame.channelId}>\n\n` +
                `**Conflicting Reports:**\n` +
                `• Team **${ongoingGame.team1.name}** reported: **${team1Result}**\n` +
                `• Team **${ongoingGame.team2.name}** reported: **${team2Result}**\n\n` +
                `**Choose the winning team below:**`
            )
            .addField("Team 1", ongoingGame.team1.name, true)
            .addField("Team 2", ongoingGame.team2.name, true)
            .setFooter({ text: `Game ID: ${ongoingGame.gameId}` })
            .setTimestamp();

          const row = new Discord.MessageActionRow().addComponents(
            new Discord.MessageButton()
              .setCustomId(`dispute_resolve_${ongoingGame.gameId}_1`)
              .setLabel(`${ongoingGame.team1.name} Wins`)
              .setStyle("SUCCESS"),
            new Discord.MessageButton()
              .setCustomId(`dispute_resolve_${ongoingGame.gameId}_2`)
              .setLabel(`${ongoingGame.team2.name} Wins`)
              .setStyle("PRIMARY"),
            new Discord.MessageButton()
              .setCustomId(`dispute_cancel_${ongoingGame.gameId}`)
              .setLabel("Cancel Game")
              .setStyle("DANGER")
          );

          await adminChannel.send({ embeds: [adminEmbed], components: [row] });
        }
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}

    return;
  }

  let winningTeam;
  if (team1Result === "win" && team2Result === "lose") {
    winningTeam = 0;
  } else if (team1Result === "lose" && team2Result === "win") {
    winningTeam = 1;
  }

  const mmrOfEachTeam = {
    team1: ongoingGame.team1.mmr,
    team2: ongoingGame.team2.mmr,
  };

  const winningTeamMmr = winningTeam === 0 ? mmrOfEachTeam.team1 : mmrOfEachTeam.team2;

  const mmrDifference = Math.abs(
    Math.round(
      elo.updateRating(
        elo.getExpected(
          winningTeamMmr,
          winningTeamMmr === ongoingGame.team1.mmr ? mmrOfEachTeam.team2 : mmrOfEachTeam.team1
        ),
        1,
        winningTeamMmr
      ) - winningTeamMmr
    )
  );

  const assignScoreData = {
    channelId: ongoingGame.channelId,
    guildId: ongoingGame.guildId,
    gameId: ongoingGame.gameId,
    winningTeam,
    mmrOfEachTeam,
    mmrDifference,
    team1: ongoingGame.team1,
    team2: ongoingGame.team2,
  };

  await assignScoreTeams(assignScoreData);

  const finishedGames = await redisInstance.getObject("finishedGames");

  finishedGames.push(assignScoreData);

  await redisInstance.setObject("finishedGames", finishedGames);

  await OngoingGamesTeamsCollection.deleteOne({
    gameId: ongoingGame.gameId,
  });

  const deletableChannel = { originalChannelId: interaction.channel.id, channelIds: [...ongoingGame.channelIds] };

  const deletableChannels = await redisInstance.getObject("deletableChannels");

  deletableChannels.push(deletableChannel);

  await redisInstance.setObject("deletableChannels", deletableChannels);

  correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");
  correctEmbed.setDescription(
    `Both teams confirmed the result.\n\n**Winner:** Team **${
      winningTeam === 0 ? ongoingGame.team1.name : ongoingGame.team2.name
    }**`
  );

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "report",
  helpDescription:
    "Ends the game, giving the wining team one win and vice versa to the losing team. Usage: /report win OR /report lose",
  description: "Reports the winner/loser of a game",
  args: [{ name: "report_type", description: "win or lose", required: true, type: "string" }],
  execute,
};
