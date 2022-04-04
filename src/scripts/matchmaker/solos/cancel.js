const Discord = require("discord.js");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema");

const { sendReply, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getContent } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (interaction, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = interaction.member.id;

  const [secondArg, gameIdInMessage] = getContent(interaction);

  const cancelQueue = await redisInstance.getObject("cancelQueue");

  const deletableChannels = await redisInstance.getObject("deletableChannels");

  if (secondArg === "force") {
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      wrongEmbed.setTitle(":x: You do not have Administrator permission!");

      await sendReply(interaction, wrongEmbed);
      return;
    }

    const game = await OngoingGamesSolosCollection.findOne({ gameId: gameIdInMessage });

    if (!game) {
      wrongEmbed.setTitle(":x: Game not found!");

      await sendReply(interaction, wrongEmbed);
      return;
    }

    if (game.channelId !== interaction.channel.id) {
      wrongEmbed.setTitle(":x: This is the wrong channel!");

      await sendReply(interaction, wrongEmbed);
      return;
    }
    correctEmbed.setTitle(`:white_check_mark: Game ${game.gameId} Cancelled!`);

    await OngoingGamesSolosCollection.deleteOne({
      gameId: game.gameId,
    });

    const deletableChannel = { originalChannelId: interaction.channel.id, channelIds: [...game.channelIds] };

    deletableChannels.push(deletableChannel);

    await redisInstance.setObject("deletableChannel", deletableChannel);

    if (cancelQueue[game.gameId] != null) {
      delete cancelQueue[gameIdInMessage];
    }

    await redisInstance.setObject("cancelQueue", cancelQueue);

    await sendReply(interaction, correctEmbed);
    return;
  }

  const selectedGame = await OngoingGamesSolosCollection.findOne({
    channelId: interaction.channel.id,
    $or: [
      {
        team1: { $elemMatch: { userId } },
      },
      {
        team2: { $elemMatch: { userId } },
      },
    ],
  });

  if (!selectedGame) {
    wrongEmbed.setTitle(":x: You aren't in a game!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const { gameId } = selectedGame;

  if (!Object.keys(cancelQueue).includes(gameId.toString())) {
    cancelQueue[gameId] = [];
  }

  const cancelqueuearray = cancelQueue[gameId];

  if (cancelqueuearray.includes(userId)) {
    wrongEmbed.setTitle(":x: You've already voted to cancel!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  cancelqueuearray.push(userId);

  await redisInstance.setObject("cancelQueue", cancelQueue);

  correctEmbed.setTitle(
    `:exclamation: ${interaction.member.user.username} wants to cancel game ${gameId}. (${cancelqueuearray.length}/${
      queueSize / 2 + 1
    })`
  );

  await sendReply(interaction, correctEmbed);

  if (cancelqueuearray.length === queueSize / 2 + 1) {
    const newCorrectEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

    const deletableChannel = { originalChannelId: interaction.channel.id, channelIds: [...selectedGame.channelIds] };

    deletableChannels.push(deletableChannel);

    await redisInstance.setObject("deletableChannels", deletableChannels);

    newCorrectEmbed.setTitle(`:white_check_mark: Game ${selectedGame.gameId} Cancelled!`);

    delete cancelQueue[gameId];

    await redisInstance.setObject("cancelQueue", cancelQueue);

    await OngoingGamesSolosCollection.deleteOne({
      gameId,
    });

    await sendReply(interaction, newCorrectEmbed);
  }
};

module.exports = {
  name: "cancel",
  description: "Cancel the game. Administrators can also do /cancel force gameId to force a game cancellation",
  args: [{ name: "cancel_type", description: "force", required: false }],
  execute,
};
