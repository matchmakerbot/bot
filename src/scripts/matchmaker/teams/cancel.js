const Discord = require("discord.js");

const {
  fetchGamesTeams,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  fetchTeamByGuildAndUserId,
  cancelQueue,
  deletableChannels,
} = require("../utils");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema.js");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, userId);

  const ongoingGames = await fetchGamesTeams(null, message.guild.id);

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (fetchedTeam.captain !== userId) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (
    !ongoingGames
      .map((e) => [e.team1.name, e.team2.name])
      .flat()
      .includes(fetchedTeam.name)
  ) {
    wrongEmbed.setTitle(":x: Team is not in game");

    sendMessage(message, wrongEmbed);
    return;
  }

  const games = ongoingGames.find((game) => game.team1.captain === userId || game.team2.captain === userId);

  const { gameId } = games;

  if (!Object.keys(cancelQueue).includes(gameId.toString())) {
    cancelQueue[gameId] = [];
  }

  const cancelQueueArray = cancelQueue[gameId];

  if (cancelQueueArray.includes(fetchedTeam.name)) {
    wrongEmbed.setTitle(":x: You've already voted to cancel!");

    sendMessage(message, wrongEmbed);
    return;
  }

  cancelQueueArray.push(fetchedTeam.name);

  correctEmbed.setTitle(
    `:exclamation: ${fetchedTeam.name} wants to cancel game ${gameId}. (${cancelQueueArray.length}/2)`
  );

  sendMessage(message, correctEmbed);

  if (cancelQueueArray.length === 2) {
    const newCorrectEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

    deletableChannels.push(...games.voiceChannelIds);

    newCorrectEmbed.setTitle(`:white_check_mark: Game ${games.gameId} Cancelled!`);

    delete cancelQueue[gameId];

    await OngoingGamesTeamsCollection.deleteOne({
      gameId,
    });

    sendMessage(message, newCorrectEmbed);
  }
};

module.exports = {
  name: "cancel",
  description: "Cancel the game (Only use this in the case of someone not playing etc...)",
  execute,
};
