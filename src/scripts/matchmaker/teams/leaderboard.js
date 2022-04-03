const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const MatchmakerTeamsScoreCollection = require("../../../utils/schemas/matchmakerTeamsScoreSchema");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg, fourthArg] = interaction.content.split(" ");

  const channelId = interaction.channel.id;

  const userId = interaction.member.id;

  if (interaction.content.toLowerCase().includes("score")) {
    wrongEmbed.setTitle("This command is deprecated, please use !leaderboard instead!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  switch (secondArg) {
    case "me": {
      const team = await MatchmakerTeamsCollection.findOne({
        guildId: interaction.guild.id,
        $or: [{ captain: userId }, { memberIds: { $in: userId } }],
      });

      const teamScore = await MatchmakerTeamsScoreCollection.findOne({
        channelId,
        name: team.name,
        guildId: interaction.guild.id,
      });

      if (!teamScore) {
        wrongEmbed.setTitle(":x: You haven't played any games yet!");

        sendReply(interaction, wrongEmbed);
        return;
      }

      correctEmbed.addField("Wins:", teamScore.wins);

      correctEmbed.addField("Losses:", teamScore.losses);

      correctEmbed.addField(
        "Winrate:",
        Number.isNaN(Math.floor((teamScore.wins / (teamScore.wins + teamScore.losses)) * 100))
          ? "0%"
          : `${Math.floor((teamScore.wins / (teamScore.wins + teamScore.losses)) * 100)}%`
      );

      correctEmbed.addField("MMR:", teamScore.mmr);

      sendReply(interaction, correctEmbed);
      return;
    }
    case "channel": {
      let skipCount = thirdArg;

      if (Number.isNaN(Number(thirdArg)) || !thirdArg || thirdArg <= 1) {
        skipCount = 1;
      }

      if (
        fourthArg != null &&
        !interaction.guild.channels.cache
          .array()
          .map((e) => e.id)
          .includes(fourthArg)
      ) {
        wrongEmbed.setTitle(":x: That channel does not belong to this server!");

        sendReply(interaction, wrongEmbed);
        return;
      }

      const storedTeamsList = await MatchmakerTeamsScoreCollection.find({
        channelId: fourthArg ?? channelId,
      })
        .sort({ mmr: -1 })
        .skip(10 * (skipCount - 1))
        .limit(10);

      if (storedTeamsList.length === 0) {
        wrongEmbed.setTitle(`:x: No games have been played in ${skipCount !== 1 ? "this page" : "here"}!`);

        sendReply(interaction, wrongEmbed);
        return;
      }

      const storedTeamsCount = await MatchmakerTeamsScoreCollection.countDocuments({
        channelId: fourthArg ?? channelId,
      });

      storedTeamsList.sort((a, b) => b.mmr - a.mmr);

      storedTeamsList.forEach((team) => {
        const winrate = team.losses === 0 ? 100 : Math.floor((team.wins / (team.wins + team.losses)) * 100);

        correctEmbed.addField(
          team.name,
          `Wins: ${team.wins} | Losses: ${team.losses} | Winrate: ${winrate}% | MMR: ${team.mmr}`
        );
        correctEmbed.setFooter(`Showing page ${skipCount}/${Math.ceil(storedTeamsCount / 10)}`);
      });

      sendReply(interaction, correctEmbed);

      return;
    }
    default: {
      wrongEmbed.setTitle("Invalid Parameters, please use !leaderboard <me/channel> <page>");

      sendReply(interaction, wrongEmbed);
    }
  }
};

module.exports = {
  name: ["leaderboard", "score"],
  description: "Checks your current score",
  helpDescription:
    "Checks your current score. Usage: !leaderboard channel <page> (default is 1) to check score in the channel youre in, !leaderboard channel <page> <channelid> to check the score of another channel, or !leaderboard me to check your current score",
  execute,
};
