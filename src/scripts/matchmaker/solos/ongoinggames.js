const Discord = require("discord.js");

const { sendMessage, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR } = require("../../../utils/utils");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema.js");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const [, skip] = message.content.split(" ");

  let skipCount = skip;

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (Number.isNaN(Number(skip)) || skip == null || skip < 1) {
    skipCount = 1;
  }

  const ongoingGames = await OngoingGamesSolosCollection.find({ channelId: message.channel.id })
    .skip(5 * (skipCount - 1))
    .limit(5);

  if (ongoingGames.length === 0) {
    wrongEmbed.setTitle(`:x: There are no ongoing games${skipCount !== 1 ? " on this page" : ""}!`);

    sendMessage(message, wrongEmbed);
    return;
  }

  const gamesCount = await OngoingGamesSolosCollection.countDocuments({ channelId: message.channel.id });

  ongoingGames.forEach((game) => {
    correctEmbed.addField("Game ID:", ` ${game.gameId}`);
    correctEmbed.addField(
      ":small_orange_diamond: Team 1",
      game.team1.reduce((acc, curr) => `${acc}<@${curr.userId}>, `, "")
    );
    correctEmbed.addField(
      ":small_blue_diamond: Team 2",
      game.team2.reduce((acc, curr) => `${acc}<@${curr.userId}>, `, "")
    );
  });

  correctEmbed.addField("No more games to list on this page", "Encourage your friends to play!");

  correctEmbed.setFooter(`Showing page ${skipCount}/${Math.ceil(gamesCount / 5)}`);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "ongoinggames",
  description: "Check the current games!",
  execute,
};
