const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR } = require("../../../utils/utils");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema.js");

const { redisInstance } = require("../../../utils/createRedisInstance");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const [, secondArg, gameIdInMessage] = message.content.split(" ");

  const cancelQueue = await redisInstance.getObject("cancelQueue");

  const deletableChannels = await redisInstance.getObject("deletableChannels");

  if (secondArg === "force") {
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      wrongEmbed.setTitle(":x: You do not have Administrator permission!");

      sendMessage(message, wrongEmbed);
      return;
    }

    const fetchedGame = await OngoingGamesTeamsCollection.findOne({
      gameId: gameIdInMessage,
    });

    if (fetchedGame == null) {
      wrongEmbed.setTitle(":x: Game not found!");

      sendMessage(message, wrongEmbed);
      return;
    }

    if (fetchedGame.channelId !== message.channel.id) {
      wrongEmbed.setTitle(":x: This is the wrong channel!");

      sendMessage(message, wrongEmbed);
      return;
    }

    await OngoingGamesTeamsCollection.deleteOne({
      gameId: fetchedGame.gameId,
    });

    if (cancelQueue[fetchedGame.channelId] != null) {
      delete cancelQueue[fetchedGame.channelId];

      await redisInstance.setObject("cancelQueue", cancelQueue);
    }

    const deletableChannel = { originalChannelId: message.channel.id, channelIds: [...fetchedGame.channelIds] };

    deletableChannels.push(deletableChannel);

    await redisInstance.setObject("deletableChannel", deletableChannel);

    correctEmbed.setTitle(`:white_check_mark: Game ${fetchedGame.gameId} Cancelled!`);

    sendMessage(message, correctEmbed);
    return;
  }

  const fetchedGame = await OngoingGamesTeamsCollection.findOne({
    channelId: message.channel.id,
    $or: [
      {
        "team1.captain": userId,
      },
      {
        "team2.captain": userId,
      },
    ],
  });

  if (fetchedGame == null) {
    wrongEmbed.setTitle(
      ":x: You aren't in a game, or the game is in a different guild/channel, or you're not the captain!"
    );

    sendMessage(message, wrongEmbed);
    return;
  }

  const { gameId } = fetchedGame;

  if (!Object.keys(cancelQueue).includes(gameId.toString())) {
    cancelQueue[gameId] = [];
  }

  const teamName = fetchedGame.team1.captain === message.author.id ? fetchedGame.team1.name : fetchedGame.team2.name;

  const cancelQueueArray = cancelQueue[gameId];

  if (cancelQueueArray.includes(teamName)) {
    wrongEmbed.setTitle(":x: You've already voted to cancel!");

    sendMessage(message, wrongEmbed);
    return;
  }

  cancelQueueArray.push(teamName);

  await redisInstance.setObject("cancelQueue", cancelQueue);

  correctEmbed.setTitle(`:exclamation: ${teamName} wants to cancel game ${gameId}. (${cancelQueueArray.length}/2)`);

  sendMessage(message, correctEmbed);

  if (cancelQueueArray.length === 2) {
    const newCorrectEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

    const deletableChannel = { originalChannelId: message.channel.id, channelIds: [...fetchedGame.channelIds] };

    deletableChannels.push(deletableChannel);

    await redisInstance.setObject("deletableChannels", deletableChannels);

    newCorrectEmbed.setTitle(`:white_check_mark: Game ${fetchedGame.gameId} Cancelled!`);

    delete cancelQueue[gameId];

    await redisInstance.setObject("cancelQueue", cancelQueue);

    await OngoingGamesTeamsCollection.deleteOne({
      gameId,
    });

    sendMessage(message, newCorrectEmbed);
  }
};

module.exports = {
  name: "cancel",
  description:
    "Cancel the game (Only use this in the case of someone not playing etc...) Administrators can also do !cancel force gameId to force a game cancellatio",
  execute,
};
