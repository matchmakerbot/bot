const Discord = require("discord.js");
const { sendMessage } = require("../../../utils/utils");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchGamesSolos } = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const games = await fetchGamesSolos(message.channel.id);
  if (games.length === 0) {
    wrongEmbed.setTitle(":x: No games are currently having place!");

    sendMessage(message, wrongEmbed);
    return;
  }
  // support more games
  for (const game of games) {
    if (game == null) {
      correctEmbed.addField("No more games to list ", "Encourage your friends to play!");
      break;
    }

    correctEmbed.addField("Game ID:", ` ${game.gameId}`);
    correctEmbed.addField(
      ":small_orange_diamond: Team 1",
      game.team1.reduce((acc, curr) => `${acc}<@${curr.id}>, `, "")
    );
    correctEmbed.addField(
      ":small_blue_diamond: Team 2",
      game.team2.reduce((acc, curr) => `${acc}<@${curr.id}>, `, "")
    );
  }
  correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(games.length / 10)}`);
  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "ongoinggames",
  description: "Check the current games!",
  execute,
};
