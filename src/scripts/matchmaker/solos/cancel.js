const Discord = require("discord.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  joinTeam1And2,
  fetchGames,
  includesUserId,
  cancelQueue,
  deletableChannels,
} = require("../utils");

const OngoingGamesCollection = require("../../../utils/schemas/ongoingGamesSchema");

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const gameList = await fetchGames(Number(queueSize));

  const userId = message.author.id;

  if (Object.keys(gameList).length === 0) {
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

  const IDGame = games.gameID;

  if (!Object.keys(cancelQueue).includes(IDGame.toString())) {
    cancelQueue[IDGame] = [];
  }

  const cancelqueuearray = cancelQueue[IDGame];

  /* if (cancelqueuearray.includes(userId)) {
    wrongEmbed.setTitle(":x: You've already voted to cancel!");

    message.channel.send(wrongEmbed);
    return;
  } */

  cancelqueuearray.push(userId);

  correctEmbed.setTitle(
    `:exclamation: ${message.author.username} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/4)`
  );

  message.channel.send(correctEmbed);

  if (cancelqueuearray.length === 4) {
    games.voiceChannelIds.forEach((channel) => {
      deletableChannels.push(channel);
    });

    correctEmbed.setTitle(`:white_check_mark: Game ${games.gameID} Cancelled!`);

    cancelQueue[IDGame] = [];

    await OngoingGamesCollection.deleteOne({
      queueSize: Number(queueSize),
      gameID: IDGame,
    });

    message.channel.send(correctEmbed);
  }
};

module.exports = {
  name: "cancel",
  description: "6man bot",
  execute,
};
