const Discord = require("discord.js");
const EloRank = require("elo-rank");

const OngoingGamesTeamsCollection = require("../utils/schemas/ongoingGamesTeamsSchema.js");

const MatchmakerTeamsScoreCollection = require("../utils/schemas/matchmakerTeamsScoreSchema");

const ServerSettingsCollection = require("../utils/schemas/serverSettingsSchema");

const { redisInstance } = require("../utils/createRedisInstance.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getContent, sendReply } = require("../utils/utils");

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
  const [gameIdStr, winnerStr] = getContent(interaction);

  const elo = new EloRank(16);

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (!interaction.member.permissions.has("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (!gameIdStr || !winnerStr) {
    wrongEmbed.setTitle(":x: Invalid parameters. Usage: /adminresolve <gameId> <winner>");
    wrongEmbed.setDescription("Example: `/adminresolve 123 1` (where 1 is team number: 1 or 2)");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  const gameId = parseInt(gameIdStr, 10);
  const winnerTeamNumber = parseInt(winnerStr, 10);

  if (Number.isNaN(gameId) || Number.isNaN(winnerTeamNumber)) {
    wrongEmbed.setTitle(":x: Invalid format. Both gameId and winner must be numbers.");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (winnerTeamNumber !== 1 && winnerTeamNumber !== 2) {
    wrongEmbed.setTitle(":x: Winner must be either 1 (team 1) or 2 (team 2)");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  const ongoingGame = await OngoingGamesTeamsCollection.findOne({ gameId });

  if (!ongoingGame) {
    wrongEmbed.setTitle(`:x: Game with ID ${gameId} not found!`);
    await sendReply(interaction, wrongEmbed);
    return;
  }

  const serverSettings = await ServerSettingsCollection.findOne({ guildId: interaction.guild.id });
  const isAdminChannel = serverSettings?.adminChannelId === interaction.channel.id;
  const isGameChannel = ongoingGame.channelId === interaction.channel.id;

  if (!isGameChannel && !isAdminChannel) {
    wrongEmbed.setTitle(":x: This game is in a different channel!");
    wrongEmbed.setDescription(
      `Please run this command in:\n• <#${ongoingGame.channelId}> (game channel)\n• <#${serverSettings?.adminChannelId}> (admin channel)`
    );
    await sendReply(interaction, wrongEmbed);
    return;
  }

  const winningTeam = winnerTeamNumber === 1 ? 0 : 1;

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

  correctEmbed.setTitle(":white_check_mark: Game Resolved by Admin!");
  correctEmbed.setDescription(
    `Game **${gameId}** has been manually resolved.\n\n` +
      `**Winner:** Team **${winningTeam === 0 ? ongoingGame.team1.name : ongoingGame.team2.name}**\n` +
      `**Resolved by:** <@${interaction.member.id}>`
  );

  if (ongoingGame.dispute) {
    correctEmbed.addField("Dispute Resolved", ongoingGame.disputeReason || "Conflicting reports", false);
  }

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "adminresolve",
  helpDescription:
    "Admin command to manually resolve disputed game reports. Usage: /adminresolve <gameId> <winner> (winner: 1 or 2 for team number)",
  description: "Admin command to resolve disputed game reports",
  args: [
    { name: "game_id", description: "The game ID to resolve", required: true, type: "integer" },
    { name: "winner", description: "Winning team number (1 or 2)", required: true, type: "integer" },
  ],
  execute,
};
