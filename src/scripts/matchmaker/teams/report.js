const Discord = require("discord.js");
const EloRank = require("elo-rank");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsScoreSchema");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  finishedGames,
  messageEndswith,
  deletableChannels,
  sendMessage,
} = require("../../../utils/utils");

const assignScoreTeams = async (game) => {
  const promises = [];

  [game.team1, game.team2].forEach((team) => {
    const won =
      (game.winningTeam === 0 && (game.team1.members.includes(team.userId) || game.team1.captain === team.userId)) ||
      (game.winningTeam === 1 && (game.team2.members.includes(team.userId) || game.team2.captain === team.userId));

    const score = won ? "wins" : "losses";

    promises.push(
      MatchmakerTeamsCollection.updateOne(
        {
          channelId: game.channelId,
          name: team.name,
        },
        {
          $inc: { [score]: 1, mmr: won ? game.mmrDifference : -game.mmrDifference },
        }
      )
    );
  });
};

const execute = async (message) => {
  const [, secondArg] = message.content.split(" ");

  const elo = new EloRank(16);

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const channelId = message.channel.id;

  const ongoingGame = await OngoingGamesTeamsCollection.findOne({
    channelId,
    $or: [
      {
        team1: { $or: [{ $elemMatch: { userId }, captain: userId }] },
      },
      {
        team2: { $or: [{ $elemMatch: { userId }, captain: userId }] },
      },
    ],
  });

  if (ongoingGame == null) {
    wrongEmbed.setTitle(":x: You aren't in a game, or the game is in a different guild/channel!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (ongoingGame.team1.captain !== userId && ongoingGame.team2.captain !== userId) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!["win", "lose"].includes(secondArg)) {
    wrongEmbed.setTitle(":x: Invalid parameter, please use !report win or !report lose");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (messageEndswith(message) !== "win" && messageEndswith(message) !== "lose") {
    wrongEmbed.setTitle(":x: Invalid params, please use !report (win or lose)");

    sendMessage(message, wrongEmbed);
    return;
  }
  if (
    (ongoingGame.team1.captain === message.author.id && messageEndswith(message) === "win") ||
    (ongoingGame.team2.captain === message.author.id && messageEndswith(message) === "lose")
  ) {
    ongoingGame.winningTeam = 0;
  } else {
    ongoingGame.winningTeam = 1;
  }

  const mmrOfEachTeam = {
    team1: ongoingGame.team1.mmr,
    team2: ongoingGame.team2.mmr,
  };

  const winningTeamMmr = ongoingGame.winningTeam === 0 ? mmrOfEachTeam.team1 : mmrOfEachTeam.team2;

  const mmrDifference = Math.abs(
    Math.round(
      elo.updateRating(
        elo.getExpected(
          winningTeamMmr,
          winningTeamMmr === ongoingGame.team1 ? mmrOfEachTeam.team2 : mmrOfEachTeam.team1
        ),
        1,
        winningTeamMmr
      ) - winningTeamMmr
    )
  );

  const assignScoreData = {
    channelId: ongoingGame.channelId,
    guildId: ongoingGame.guildId,
    gameId: ongoingGame.gameId,
    winningTeam: ongoingGame.winningTeam,
    mmrOfEachTeam,
    eloDifference: mmrDifference,
    team1: ongoingGame.team1,
    team2: ongoingGame.team2,
  };

  await assignScoreTeams(assignScoreData);

  finishedGames.push(assignScoreData);

  await OngoingGamesTeamsCollection.deleteOne({
    gameId: ongoingGame.gameId,
  });

  ongoingGame.channelIds.forEach((channel) => {
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
