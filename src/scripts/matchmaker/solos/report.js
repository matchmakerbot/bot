const Discord = require("discord.js");
const EloRank = require("elo-rank");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema.js");
const { sendMessage } = require("../../../utils/utils.js");

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
  TEAM1,
  TEAM2,
} = require("../utils");

const execute = async (message) => {
  const elo = new EloRank(16);

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
    wrongEmbed.setTitle(":x: You aren't in a game, or the game is in a different guild!");

    sendMessage(message, wrongEmbed);
    return;
  }
  const game = storedGames
    .filter((e) => e.guildId === message.guild.id)
    .find((e) => includesUserId(joinTeam1And2(e), userId));

  if (game.channelId !== channelId) {
    wrongEmbed.setTitle(":x: This is not the correct channel to report the win/lose!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (messageEndswith(message) !== "win" && messageEndswith(message) !== "lose") {
    wrongEmbed.setTitle(":x: Invalid params, please use !report (win or lose)");

    sendMessage(message, wrongEmbed);
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

  const mmrOfEachTeam = {
    team1: game.team1.reduce((a, c) => a + c.mmr, 0) / game.team1.length,
    team2: game.team2.reduce((a, c) => a + c.mmr, 0) / game.team2.length,
  };

  const team1EloDifference =
    elo.updateRating(
      elo.getExpected(mmrOfEachTeam.team1, mmrOfEachTeam.team2),
      game.winningTeam === 0 ? 1 : 0,
      mmrOfEachTeam.team1
    ) - mmrOfEachTeam.team1;

  const team2EloDifference = -team1EloDifference;

  for (const user of game.team1) {
    user.mmrDifference = team1EloDifference;
    promises.push(assignWinLoseDb(user, game, "solos", TEAM1));
  }

  for (const user of game.team2) {
    user.mmrDifference = team2EloDifference;
    promises.push(assignWinLoseDb(user, game, "solos", TEAM2));
  }

  await Promise.all(promises);

  finishedGames.push(game);

  await OngoingGamesSolosCollection.deleteOne({
    gameId: game.gameId,
  });

  game.channelIds.forEach((channel) => {
    deletableChannels.push(channel);
  });

  correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "report",
  description:
    "Ends the game, giving the wining team one win and vice versa to the losing team. Usage: !report win OR !report lose",
  execute,
};
