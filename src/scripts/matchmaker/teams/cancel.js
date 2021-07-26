const Discord = require("discord.js");

const {
  fetchGamesTeams,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  fetchTeamByGuildAndUserId,
  cancelQueue,
  joinTeam1And2,
  includesUserId,
  OngoingGamesCollection,
  deletableChannels,
} = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const teamData = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  const gameList = await fetchGamesTeams();

  if (teamData == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    message.channel.send(wrongEmbed);
    return;
  }

  if (teamData.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (teamData.find((e) => e.captain === message.author.id) == null) {
    wrongEmbed.setTitle(":x: You aren't in a game!");

    message.channel.send(wrongEmbed);
    return;
  }

  const games = gameList.find((game) => includesUserId(joinTeam1And2(game), message.author.id));

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
  description: "6man bot",
  execute,
};
