const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchGamesTeams } = require("../utils");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const ongoingGames = await fetchGamesTeams(message.channel.id);

  if (ongoingGames.length === 0) {
    wrongEmbed.setTitle(":x: No games are currently having place!");

    return sendMessage(message, wrongEmbed);
  }

  for (let i = 0; i < 6; i++) {
    const game = ongoingGames[i];

    if (game == null) {
      correctEmbed.addField("No more games to list ", "Encourage your friends to play!");
      break;
    }

    correctEmbed.addField("Game ID:", ` ${game.gameId}`);
    correctEmbed.addField(
      `:small_orange_diamond: Team ${game.team1.name}`,
      `<@${game.team1.captain}>, ${game.team1.members.reduce((acc, curr) => `${acc}<@${curr}>, `, "")}`
    );
    correctEmbed.addField(
      `:small_blue_diamond: Team ${game.team2.name}`,
      `<@${game.team2.captain}>, ${game.team2.members.reduce((acc, curr) => `${acc}<@${curr}>, `, "")}`
    );

    correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(ongoingGames.length / 10)}`);
  }
  return sendMessage(message, correctEmbed);
};

module.exports = {
  name: "ongoinggames",
  description: "Check the current games!",
  execute,
};
