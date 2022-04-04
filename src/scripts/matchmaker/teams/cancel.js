const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getContent, sendReply } = require("../../../utils/utils");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema.js");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = interaction.member.id;

  const [secondArg, gameIdInMessage] = getContent(interaction);

  const cancelQueue = await redisInstance.getObject("cancelQueue");

  const deletableChannels = await redisInstance.getObject("deletableChannels");

  if (secondArg === "force") {
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      wrongEmbed.setTitle(":x: You do not have Administrator permission!");

      sendReply(interaction, wrongEmbed);
      return;
    }

    const fetchedGame = await OngoingGamesTeamsCollection.findOne({
      gameId: gameIdInMessage,
    });

    if (!fetchedGame) {
      wrongEmbed.setTitle(":x: Game not found!");

      sendReply(interaction, wrongEmbed);
      return;
    }

    if (fetchedGame.channelId !== interaction.channel.id) {
      wrongEmbed.setTitle(":x: This is the wrong channel!");

      sendReply(interaction, wrongEmbed);
      return;
    }

    await OngoingGamesTeamsCollection.deleteOne({
      gameId: fetchedGame.gameId,
    });

    if (cancelQueue[fetchedGame.channelId] != null) {
      delete cancelQueue[fetchedGame.channelId];

      await redisInstance.setObject("cancelQueue", cancelQueue);
    }

    const deletableChannel = { originalChannelId: interaction.channel.id, channelIds: [...fetchedGame.channelIds] };

    deletableChannels.push(deletableChannel);

    await redisInstance.setObject("deletableChannel", deletableChannel);

    correctEmbed.setTitle(`:white_check_mark: Game ${fetchedGame.gameId} Cancelled!`);

    sendReply(interaction, correctEmbed);
    return;
  }

  const fetchedGame = await OngoingGamesTeamsCollection.findOne({
    channelId: interaction.channel.id,
    $or: [
      {
        "team1.captain": userId,
      },
      {
        "team2.captain": userId,
      },
    ],
  });

  if (!fetchedGame) {
    wrongEmbed.setTitle(
      ":x: You aren't in a game, or the game is in a different guild/channel, or you're not the captain!"
    );

    sendReply(interaction, wrongEmbed);
    return;
  }

  const { gameId } = fetchedGame;

  if (!Object.keys(cancelQueue).includes(gameId.toString())) {
    cancelQueue[gameId] = [];
  }

  const teamName =
    fetchedGame.team1.captain === interaction.member.id ? fetchedGame.team1.name : fetchedGame.team2.name;

  const cancelQueueArray = cancelQueue[gameId];

  if (cancelQueueArray.includes(teamName)) {
    wrongEmbed.setTitle(":x: You've already voted to cancel!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  cancelQueueArray.push(teamName);

  await redisInstance.setObject("cancelQueue", cancelQueue);

  correctEmbed.setTitle(`:exclamation: ${teamName} wants to cancel game ${gameId}. (${cancelQueueArray.length}/2)`);

  sendReply(interaction, correctEmbed);

  if (cancelQueueArray.length === 2) {
    const newCorrectEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

    const deletableChannel = { originalChannelId: interaction.channel.id, channelIds: [...fetchedGame.channelIds] };

    deletableChannels.push(deletableChannel);

    await redisInstance.setObject("deletableChannels", deletableChannels);

    newCorrectEmbed.setTitle(`:white_check_mark: Game ${fetchedGame.gameId} Cancelled!`);

    delete cancelQueue[gameId];

    await redisInstance.setObject("cancelQueue", cancelQueue);

    await OngoingGamesTeamsCollection.deleteOne({
      gameId,
    });

    sendReply(interaction, newCorrectEmbed);
  }
};

module.exports = {
  name: "cancel",
  description: "Cancel the game. Administrators can also do /cancel force gameId to force a game cancellation",
  args: [{ name: "cancel_type", description: "force", required: false }],
  execute,
};
