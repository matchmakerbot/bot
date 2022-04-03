const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply } = require("../../../utils/utils");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, skip] = interaction.content.split(" ");

  let skipCount = skip;

  if (Number.isNaN(Number(skip)) || !skip || skip < 1) {
    skipCount = 1;
  }

  const ongoingGames = await OngoingGamesTeamsCollection.find({ channelId: interaction.channel.id })
    .skip(5 * (skipCount - 1))
    .limit(5);

  if (ongoingGames.length === 0) {
    wrongEmbed.setTitle(":x: No games are currently having place!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (ongoingGames.length === 0) {
    wrongEmbed.setTitle(`:x: There are no ongoing games${skipCount !== 1 ? " on this page" : ""}!`);

    sendReply(interaction, wrongEmbed);
    return;
  }

  const gamesCount = await OngoingGamesTeamsCollection.countDocuments({ channelId: interaction.channel.id });

  ongoingGames.forEach((game) => {
    correctEmbed.addField("Game ID:", ` ${game.gameId}`);
    correctEmbed.addField(
      `:small_orange_diamond: Team ${game.team1.name}`,
      `<@${game.team1.captain}>, ${game.team1.memberIds.reduce((acc, curr) => `${acc}<@${curr}>, `, "")}`
    );
    correctEmbed.addField(
      `:small_blue_diamond: Team ${game.team2.name}`,
      `<@${game.team2.captain}>, ${game.team2.memberIds.reduce((acc, curr) => `${acc}<@${curr}>, `, "")}`
    );
  });

  correctEmbed.addField("No more games to list on this page", "Encourage your friends to play!");

  correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(gamesCount / 5)}`);

  sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "ongoinggames",
  description: "Check the current games!",
  execute,
};
