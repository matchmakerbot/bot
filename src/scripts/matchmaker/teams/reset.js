const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray, sendMessage } = require("../../../utils/utils");

const OngoingGamesMatchmakerTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const TeamsScoreCollection = require("../../../utils/schemas/matchmakerTeamsScoreSchema");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (message, queueSize) => {
  const channelId = message.channel.id;

  const [, mode] = message.content.split(" ");

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const channelQueues = await redisInstance.getObject("channelQueues");

  const queueArray = getQueueArray(channelQueues, queueSize, message.channel.id, message.guild.id);

  if (queueArray.length === queueSize) {
    wrongEmbed.setTitle(":x: You can't reset the channel now!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!message.member.permissions.has("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    sendMessage(message, wrongEmbed);
    return;
  }

  switch (mode) {
    case "channel": {
      const fetchGamesByChannelId = await OngoingGamesMatchmakerTeamsCollection.find({
        channelId,
      });

      if (fetchGamesByChannelId.length !== 0) {
        wrongEmbed.setTitle(":x: There are users in game!");

        sendMessage(message, wrongEmbed);
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

      sendMessage(message, correctEmbed);
      break;
    }

    case "team": {
      let teamName = message.content.split(" ");
      teamName.splice(0, 2);
      teamName = teamName.join(" ");

      if (teamName === "" && !teamName) {
        wrongEmbed.setTitle(":x: You need to specify a team name!");

        sendMessage(message, wrongEmbed);
        return;
      }

      const ongoingGame = await OngoingGamesMatchmakerTeamsCollection.findOne({
        guildId: message.guild.id,
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

        sendMessage(message, wrongEmbed);
        return;
      }

      const teamScore = TeamsScoreCollection.findOne({ channelId, guildId: message.guild.id, name: teamName });

      if (!teamScore) {
        wrongEmbed.setTitle(":x: This team hasn't played any games in this channel!");

        sendMessage(message, wrongEmbed);
        return;
      }

      await TeamsScoreCollection.deleteOne({
        name: teamScore.name,
        guildId: message.guild.id,
        channelId,
      });

      correctEmbed.setTitle(":white_check_mark: Team's score reset!");

      sendMessage(message, correctEmbed);
      break;
    }
    default: {
      wrongEmbed.setTitle(":x: Invalid Parameters!");

      sendMessage(message, wrongEmbed);
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
