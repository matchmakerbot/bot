const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchGamesTeams } = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const ongoingGames = await fetchGamesTeams(message.channel.id);

  if (ongoingGames.length === 0) {
    wrongEmbed.setTitle(":x: No games are currently having place!");

    return message.channel.send(wrongEmbed);
  }

  for (let i = 0; i < 6; i++) {
    const game = ongoingGames[i];

    if (game == null) {
      correctEmbed.addField("No more games to list ", "Encourage your friends to play!");
      break;
    }

    correctEmbed.addField("Game ID:", ` ${game.gameId}`);
    correctEmbed.addField(
      ":small_orange_diamond: -Team 1-",
      game.team1.reduce((acc, curr) => `${acc}<@${curr.id}>, `, "")
    );
    correctEmbed.addField(
      ":small_blue_diamond: -Team 2-",
      game.team2.reduce((acc, curr) => `${acc}<@${curr.id}>, `, "")
    );

    correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(ongoingGames.length / 10)}`);
  }
  return message.channel.send(wrongEmbed);
};

module.exports = {
  name: "ongoinggames",
  description: "Check the current games!",
  execute,
};
