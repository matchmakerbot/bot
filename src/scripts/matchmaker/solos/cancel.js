const Discord = require("discord.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  joinTeam1And2,
  fetchGamesSolos,
  includesUserId,
  cancelQueue,
  deletableChannels,
} = require("../utils");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema");

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const gameList = await fetchGamesSolos(message.channel.id);

  const userId = message.author.id;

  if (gameList.length === 0) {
    wrongEmbed.setTitle(":x: You aren't in a game!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (!includesUserId(gameList.map((e) => joinTeam1And2(e)).flat(), userId)) {
    wrongEmbed.setTitle(":x: You aren't in a game!");

    message.channel.send(wrongEmbed);
    return;
  }

  const games = gameList.find((game) => includesUserId(joinTeam1And2(game), userId));

  const { gameId } = games;

  if (!Object.keys(cancelQueue).includes(gameId.toString())) {
    cancelQueue[gameId] = [];
  }

  const cancelqueuearray = cancelQueue[gameId];

  if (cancelqueuearray.includes(userId)) {
    wrongEmbed.setTitle(":x: You've already voted to cancel!");

    message.channel.send(wrongEmbed);
    return;
  }

  cancelqueuearray.push(userId);

  correctEmbed.setTitle(
    `:exclamation: ${message.author.username} wants to cancel game ${gameId}. (${cancelqueuearray.length}/${
      queueSize / 2 + 1
    })`
  );

  message.channel.send(correctEmbed);

  if (cancelqueuearray.length === queueSize / 2 + 1) {
    deletableChannels.push(...games.voiceChannelIds);

    correctEmbed.setTitle(`:white_check_mark: Game ${games.gameId} Cancelled!`);

    delete cancelQueue[gameId];

    await OngoingGamesSolosCollection.deleteOne({
      queueSize,
      gameId,
    });

    message.channel.send(correctEmbed);
  }
};

module.exports = {
  name: "cancel",
  description: "6man bot",
  execute,
};
