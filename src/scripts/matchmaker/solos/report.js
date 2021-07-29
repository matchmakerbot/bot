const Discord = require("discord.js");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  includesUserId,
  joinTeam1And2,
  fetchGamesSolos,
  finishedGames,
  messageEndswith,
  deletableChannels,
  assignWinLoseDb,
} = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const channelId = message.channel.id;

  const storedGames = await fetchGamesSolos(message.channel.id);

  if (
    !includesUserId(
      storedGames
        .filter((e) => e.guildId === message.guild.id)
        .map((e) => joinTeam1And2(e))
        .flat(),
      userId
    )
  ) {
    wrongEmbed.setTitle(":x: You aren't in a game!");

    message.channel.send(wrongEmbed);
    return;
  }
  const game = storedGames
    .filter((e) => e.guildId === message.guild.id)
    .find((e) => includesUserId(joinTeam1And2(e), userId));

  if (game.channelId !== channelId) {
    wrongEmbed.setTitle(":x: This is not the correct channel to report the win/lose!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (messageEndswith(message) !== "win" && messageEndswith(message) !== "lose") {
    wrongEmbed.setTitle(":x: Invalid params, please use !report (win or lose)");

    message.channel.send(wrongEmbed);
    return;
  }
  if (
    (game.team1.map((e) => e.id).includes(userId) && messageEndswith(message) === "win") ||
    (game.team2.map((e) => e.id).includes(userId) && messageEndswith(message) === "lose")
  ) {
    game.winningTeam = 0;
  } else {
    game.winningTeam = 1;
  }

  const promises = [];

  for (const user of game.team1) {
    promises.push(assignWinLoseDb(user, game, "solos"));
  }

  for (const user of game.team2) {
    promises.push(assignWinLoseDb(user, game, "solos"));
  }

  await Promise.all(promises);

  finishedGames.push(game);

  await OngoingGamesSolosCollection.deleteOne({
    gameId: game.gameId,
  });

  game.voiceChannelIds.forEach((channel) => {
    deletableChannels.push(channel);
  });

  correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "report",
  description:
    "Ends the game, giving the wining team one win and vice versa to the losing team. Usage: !report win OR !report lose",
  execute,
};
