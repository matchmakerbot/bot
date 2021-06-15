const Discord = require("discord.js");

const {fetchTeamData, fetchGames, includesUserId, joinTeam1And2} = require("../utils")

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const teamData = fetchTeamData();

  const gameList = fetchGames(message.channel.id);

  if(teamData == null) {
    wrongEmbed.setTitle(":x: You're not in a team.");

    return message.channel.send(wrongEmbed);
  }
    
  if (teamData.captain !== message.author.id) {

    wrongEmbed.setTitle(":x: You are not the captain!");

    return message.channel.send(wrongEmbed);
  }

  if (!gameList.map(e=> joinTeam1And2(e)).map(e=>e.captain).includes(message.author.id) || ongoingGames.length === 0) {
    wrongEmbed.setTitle(":x: You aren't in a game!");

    return message.channel.send(wrongEmbed);
  }

  for (const games of gameList) {
    if (games.map((e) => e.name).includes(messageArgs(message)) && !games[2].guild === message.guild.id) {
      continue;
    }

    const IDGame = games[2].gameID.toString();

    if (!Object.keys(cancelQueue).includes(IDGame)) {
      cancelQueue[IDGame] = [];
    }

    const cancelqueuearray = cancelQueue[IDGame];

    if (cancelqueuearray.includes(teamsInfo().name)) {
      wrongEmbed.setTitle(":x: You've already voted to cancel!");

      return message.channel.send(wrongEmbed);
    }

    cancelqueuearray.push(teamsInfo().name);

    wrongEmbed.setTitle(
      `:exclamation: ${teamsInfo().name} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/2)`
    );

    message.channel.send(wrongEmbed);

    if (cancelqueuearray.length === 2) {
      for (const channel of message.guild.channels.cache.array()) {
        if (channel.name === `🔸Team-${games[0].name}-Game-${IDGame}`) {
          channel.delete();
        }

        if (channel.name === `🔹Team-${games[1].name}-Game-${IDGame}`) {
          channel.delete();
        }
      }

      correctEmbed.setTitle(`:white_check_mark: Game ${IDGame} Cancelled!`);

      const index = ongoingGames.indexOf(games);

      cancelQueue[IDGame] = [];

      ongoingGames.splice(index, 1);

      return message.channel.send(correctEmbed);
    }
  }
};

module.exports = {
    name: "cancel",
    description: "6man bot",
    execute,
  };