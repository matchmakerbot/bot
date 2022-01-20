const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, finishedGames, getQueueArray } = require("../utils");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema");

const MatchmakerCollection = require("../../../utils/schemas/matchmakerUsersSchema");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message, queueSize) => {
  const channelId = message.channel.id;

  const [, mode, userId] = message.content.split(" ");

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id, "solos");

  if (queueArray.length === queueSize) {
    wrongEmbed.setTitle(":x: You can't reset the channel now!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    sendMessage(message, wrongEmbed);
    return;
  }

  switch (mode) {
    case "channel": {
      const fetchGamesByChannelId = await OngoingGamesSolosCollection.find({
        channelId,
      });

      if (fetchGamesByChannelId.length !== 0) {
        wrongEmbed.setTitle(":x: There are users in game!");

        sendMessage(message, wrongEmbed);
        return;
      }

      await MatchmakerCollection.deleteMany({
        channelId,
      });

      const foundGame = finishedGames.find((e) => e.channelId === channelId);

      if (foundGame != null) {
        finishedGames.splice(finishedGames.indexOf(foundGame), 1);
      }

      correctEmbed.setTitle(":white_check_mark: Channel score reset!");

      sendMessage(message, correctEmbed);
      return;
    }

    case "player": {
      if (userId == null) {
        wrongEmbed.setTitle(":x: You need to specify an user id!");

        sendMessage(message, wrongEmbed);
        return;
      }

      const ongoingGame = await OngoingGamesSolosCollection.findOne({
        channelId,
        $or: [
          {
            team1: { $elemMatch: { userId } },
          },
          {
            team2: { $elemMatch: { userId } },
          },
        ],
      });

      if (ongoingGame != null) {
        wrongEmbed.setTitle(":x: User is in the middle of a game!");

        sendMessage(message, wrongEmbed);
        return;
      }

      const player = await MatchmakerCollection.findOne({
        userId,
        channelId,
      });

      if (player == null) {
        wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!");

        sendMessage(message, wrongEmbed);
        return;
      }

      await MatchmakerCollection.deleteOne({
        userId,
        channelId,
      });

      correctEmbed.setTitle(":white_check_mark: Player's score reset!");

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
  description:
    "Resets the score of an individual player (!reset player <discordid>) or the whole channel where this command is inserted (!reset channel)",
  execute,
};
