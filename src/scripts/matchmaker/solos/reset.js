const Discord = require("discord.js");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema");

const MatchmakerUsersScoreCollection = require("../../../utils/schemas/matchmakerUsersScoreSchema");

const { sendReply, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray, getContent } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (interaction, queueSize) => {
  const channelId = interaction.channel.id;

  const [mode, userId] = getContent(interaction);

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
      const fetchGamesByChannelId = await OngoingGamesSolosCollection.find({
        channelId,
      });

      if (fetchGamesByChannelId.length !== 0) {
        wrongEmbed.setTitle(":x: There are users in game!");

        sendReply(interaction, wrongEmbed);
        return;
      }

      await MatchmakerUsersScoreCollection.deleteMany({ channelId });

      const finishedGames = await redisInstance.getObject("finishedGames");

      const foundGame = finishedGames.find((e) => e.channelId === channelId);

      if (foundGame != null) {
        finishedGames.splice(finishedGames.indexOf(foundGame), 1);

        await redisInstance.setObject("finishedGames", finishedGames);
      }

      correctEmbed.setTitle(":white_check_mark: Channel leaderboard reset!");

      sendReply(interaction, correctEmbed);
      return;
    }

    case "player": {
      if (!userId) {
        wrongEmbed.setTitle(":x: You need to specify an user id!");

        sendReply(interaction, wrongEmbed);
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

        sendReply(interaction, wrongEmbed);
        return;
      }

      const player = await MatchmakerUsersScoreCollection.findOne({
        userId,
        channelId,
      });

      if (!player) {
        wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!");

        sendReply(interaction, wrongEmbed);
        return;
      }

      await MatchmakerUsersScoreCollection.deleteOne({
        userId,
        channelId,
      });

      correctEmbed.setTitle(":white_check_mark: Player's score reset!");

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
    "Resets the score of an individual player (/reset player <discordid>) or the whole channel where this command is inserted (/reset channel)",
  args: [
    { name: "reset_type", description: "player or channel", required: true },
    { name: "playerid", description: "player id", required: false },
  ],
  execute,
};
