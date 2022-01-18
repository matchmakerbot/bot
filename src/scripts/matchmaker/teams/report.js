const Discord = require("discord.js");
const EloRank = require("elo-rank");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema.js");

const { sendMessage } = require("../../../utils/utils");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  fetchGamesTeams,
  finishedGames,
  messageEndswith,
  deletableChannels,
  assignWinLoseDb,
  fetchTeamByGuildAndUserId,
  TEAM1,
  TEAM2,
} = require("../utils");

const execute = async (message) => {
  const elo = new EloRank(16);
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const channelId = message.channel.id;

  const ongoingGames = await fetchGamesTeams(message.channel.id);

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (fetchedTeam.captain !== userId) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (
    !ongoingGames
      .map((e) => [e.team1.name, e.team2.name])
      .flat()
      .includes(fetchedTeam.name)
  ) {
    wrongEmbed.setTitle(":x: You aren't in a game");

    sendMessage(message, wrongEmbed);
    return;
  }

  const game = ongoingGames.find((d) => [d.team1.name, d.team2.name].includes(fetchedTeam.name));

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
    (game.team1.captain === message.author.id && messageEndswith(message) === "win") ||
    (game.team2.captain === message.author.id && messageEndswith(message) === "lose")
  ) {
    game.winningTeam = 0;
  } else {
    game.winningTeam = 1;
  }

  const promises = [];

  const team1EloDifference =
    elo.updateRating(elo.getExpected(game.team1.mmr, game.team2.mmr), game.winningTeam === 0 ? 1 : 0, game.team1.mmr) -
    game.team1.mmr;

  const team2EloDifference = -team1EloDifference;

  game.team1.mmrDifference = team1EloDifference;

  game.team2.mmrDifference = team2EloDifference;

  promises.push(assignWinLoseDb(game.team1, game, "teams", TEAM1));

  promises.push(assignWinLoseDb(game.team2, game, "teams", TEAM2));

  finishedGames.push(game);

  await Promise.all(promises);

  await OngoingGamesTeamsCollection.deleteOne({
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
