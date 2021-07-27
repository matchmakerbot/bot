const Discord = require("discord.js");

const {
  fetchGamesTeams,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  fetchTeamByGuildAndUserId,
  cancelQueue,
  OngoingGamesCollection,
  deletableChannels,
} = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const teamData = await fetchTeamByGuildAndUserId(message.guild.id, userId);

  const gameList = await fetchGamesTeams(message.guild.id);

  if (teamData == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    message.channel.send(wrongEmbed);
    return;
  }

  if (teamData.captain !== userId) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (teamData.find((e) => e.captain === userId) == null) {
    wrongEmbed.setTitle(":x: You aren't in a game!");

    message.channel.send(wrongEmbed);
    return;
  }

  const games = gameList.find((game) => game.team1.captain === userId || game.team2.captain === userId);

  const { gameId } = games;

  if (!Object.keys(cancelQueue).includes(gameId)) {
    cancelQueue[gameId] = [];
  }

  const cancelqueuearray = cancelQueue[gameId];

  if (cancelqueuearray.includes(teamData.name)) {
    wrongEmbed.setTitle(":x: You've already voted to cancel!");

    message.channel.send(wrongEmbed);
    return;
  }

  cancelqueuearray.push(teamData.name);

  wrongEmbed.setTitle(`:exclamation: ${teamData.name} wants to cancel game ${gameId}. (1/2)`);

  message.channel.send(wrongEmbed);

  if (cancelqueuearray.length === 2) {
    deletableChannels.push(...games.voiceChannelIds);

    correctEmbed.setTitle(`:white_check_mark: Game ${games.gameId} Cancelled!`);

    delete cancelQueue[gameId];

    await OngoingGamesCollection.deleteOne({
      queueSize: 2,
      gameId,
    });

    message.channel.send(correctEmbed);
  }
};

module.exports = {
  name: "cancel",
  description: "Cancel the game (Only use this in the case of someone not playing etc...)",
  execute,
};
