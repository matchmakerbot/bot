const Discord = require("discord.js");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema");

const {
  sendMessage,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  cancelQueue,
  deletableChannels,
} = require("../../../utils/utils");

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const [, secondArg, gameIdInMessage] = message.content.split(" ");

  if (secondArg === "force") {
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      wrongEmbed.setTitle(":x: You do not have Administrator permission!");

      sendMessage(message, wrongEmbed);
      return;
    }

    const game = await OngoingGamesSolosCollection.findOne({ gameId: gameIdInMessage });

    if (game == null) {
      wrongEmbed.setTitle(":x: Game not found!");

      sendMessage(message, wrongEmbed);
      return;
    }

    if (game.channelId !== message.channel.id) {
      wrongEmbed.setTitle(":x: This is the wrong channel!");

      sendMessage(message, wrongEmbed);
      return;
    }
    correctEmbed.setTitle(`:white_check_mark: Game ${game.gameId} Cancelled!`);

    await OngoingGamesSolosCollection.deleteOne({
      gameId: game.gameId,
    });

    const deletableChannel = { originalChannelId: message.channel.id, channelIds: [...game.channelIds] };

    deletableChannels.push(deletableChannel);

    if (cancelQueue[game.gameId] != null) {
      delete cancelQueue[gameIdInMessage];
    }

    sendMessage(message, correctEmbed);
    return;
  }

  const selectedGame = await OngoingGamesSolosCollection.findOne({
    channelId: message.channel.id,
    $or: [
      {
        team1: { $elemMatch: { userId } },
      },
      {
        team2: { $elemMatch: { userId } },
      },
    ],
  });

  if (selectedGame == null) {
    wrongEmbed.setTitle(":x: You aren't in a game!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const { gameId } = selectedGame;

  if (!Object.keys(cancelQueue).includes(gameId.toString())) {
    cancelQueue[gameId] = [];
  }

  const cancelqueuearray = cancelQueue[gameId];

  if (cancelqueuearray.includes(userId)) {
    wrongEmbed.setTitle(":x: You've already voted to cancel!");

    sendMessage(message, wrongEmbed);
    return;
  }

  cancelqueuearray.push(userId);

  correctEmbed.setTitle(
    `:exclamation: ${message.author.username} wants to cancel game ${gameId}. (${cancelqueuearray.length}/${
      queueSize / 2 + 1
    })`
  );

  sendMessage(message, correctEmbed);

  if (cancelqueuearray.length === queueSize / 2 + 1) {
    const newCorrectEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

    const deletableChannel = { originalChannelId: message.channel.id, channelIds: [...selectedGame.channelIds] };

    deletableChannels.push(deletableChannel);

    newCorrectEmbed.setTitle(`:white_check_mark: Game ${selectedGame.gameId} Cancelled!`);

    delete cancelQueue[gameId];

    await OngoingGamesSolosCollection.deleteOne({
      gameId,
    });

    sendMessage(message, newCorrectEmbed);
  }
};

module.exports = {
  name: "cancel",
  description:
    "Cancel the game (Only use this in the case of someone not playing etc...) Administrators can also do !cancel force gameId to force a game cancellation",
  execute,
};
