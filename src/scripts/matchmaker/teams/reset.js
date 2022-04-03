const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray, sendReply } = require("../../../utils/utils");

const OngoingGamesMatchmakerTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const TeamsScoreCollection = require("../../../utils/schemas/matchmakerTeamsScoreSchema");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (interaction, queueSize) => {
  const channelId = interaction.channel.id;

  const [, mode] = interaction.content.split(" ");

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const channelQueues = await redisInstance.getObject("channelQueues");

  const queueArray = getQueueArray(channelQueues, queueSize, interaction.channel.id, interaction.guild.id);

  if (queueArray.length === queueSize) {
    wrongEmbed.setTitle(":x: You can't reset the channel now!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (!interaction.member.permissions.has("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  switch (mode) {
    case "channel": {
      const fetchGamesByChannelId = await OngoingGamesMatchmakerTeamsCollection.find({
        channelId,
      });

      if (fetchGamesByChannelId.length !== 0) {
        wrongEmbed.setTitle(":x: There are users in game!");

        sendReply(interaction, wrongEmbed);
        return;
      }

      await TeamsScoreCollection.deleteMany({ channelId });

      const finishedGames = await redisInstance.getObject("finishedGames");

      const foundGame = finishedGames.find((e) => e.channelId === channelId);

      if (foundGame != null) {
        finishedGames.splice(finishedGames.indexOf(foundGame), 1);

        await redisInstance.setObject("finishedGames", finishedGames);
      }

      correctEmbed.setTitle(":white_check_mark: Channel leaderboard reset!");

      sendReply(interaction, correctEmbed);
      break;
    }

    case "team": {
      let teamName = interaction.content.split(" ");
      teamName.splice(0, 2);
      teamName = teamName.join(" ");

      if (teamName === "" && !teamName) {
        wrongEmbed.setTitle(":x: You need to specify a team name!");

        sendReply(interaction, wrongEmbed);
        return;
      }

      const ongoingGame = await OngoingGamesMatchmakerTeamsCollection.findOne({
        guildId: interaction.guild.id,
        $or: [
          {
            "team1.name": teamName,
          },
          {
            "team2.name": teamName,
          },
        ],
      });

      if (ongoingGame != null) {
        wrongEmbed.setTitle(":x: Team is in the middle of a game!");

        sendReply(interaction, wrongEmbed);
        return;
      }

      const teamScore = TeamsScoreCollection.findOne({ channelId, guildId: interaction.guild.id, name: teamName });

      if (!teamScore) {
        wrongEmbed.setTitle(":x: This team hasn't played any games in this channel!");

        sendReply(interaction, wrongEmbed);
        return;
      }

      await TeamsScoreCollection.deleteOne({
        name: teamScore.name,
        guildId: interaction.guild.id,
        channelId,
      });

      correctEmbed.setTitle(":white_check_mark: Team's score reset!");

      sendReply(interaction, correctEmbed);
      break;
    }
    default: {
      wrongEmbed.setTitle(":x: Invalid Parameters!");

      sendReply(interaction, wrongEmbed);
    }
  }
};

module.exports = {
  name: "reset",
  description: "Resets player or channel leaderboard",
  helpDescription:
    "Resets the score of an individual team (!reset team teamName) or the whole channel where this command is inserted (!reset channel)",
  execute,
};
