const Discord = require("discord.js");

const EloRank = require("elo-rank");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema.js");

const MatchmakerUsersCollection = require("../../../utils/schemas/matchmakerUsersWithScoreSchema");

const {
  sendMessage,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  finishedGames,
  deletableChannels,
} = require("../../../utils/utils.js");

const assignScoreUsers = async (game) => {
  const promises = [];

  [...game.team1, ...game.team2].forEach(async (user) => {
    const won =
      (game.winningTeam === 0 && game.team1.includes(user.userId)) ||
      (game.winningTeam === 1 && game.team2.includes(user.userId));

    const score = won ? "wins" : "losses";

    promises.push(
      MatchmakerUsersCollection.updateOne(
        {
          userId: user.userId,
          channelId: game.channelId,
        },
        {
          $inc: { [score]: 1, mmr: won ? game.mmrDifference : -game.mmrDifference },
        }
      )
    );
  });
  await Promise.all(promises);
};

const execute = async (message) => {
  const [, secondArg] = message.content.split(" ");
  const elo = new EloRank(16);

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const channelId = message.channel.id;

  const ongoingGame = await OngoingGamesSolosCollection.findOne({
    channelId,
    $or: [
      {
        team1: { $elemMatch: { userId } },
      },
      {
        team2: { $elemMatch: { userId } },
      },
    ],
  });

  if (ongoingGame == null) {
    wrongEmbed.setTitle(":x: You aren't in a game, or the game is in a different guild/channel!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!["win", "lose"].includes(secondArg)) {
    wrongEmbed.setTitle(":x: Invalid parameter, please use !report win or !report lose");

    sendMessage(message, wrongEmbed);
    return;
  }
  if (
    (ongoingGame.team1.map((e) => e.userId).includes(userId) && secondArg === "win") ||
    (ongoingGame.team2.map((e) => e.userId).includes(userId) && secondArg === "lose")
  ) {
    ongoingGame.winningTeam = 0;
  } else {
    ongoingGame.winningTeam = 1;
  }

  const mmrOfEachTeam = {
    team1: ongoingGame.team1.reduce((a, c) => a + c.mmr, 0) / ongoingGame.team1.length,
    team2: ongoingGame.team2.reduce((a, c) => a + c.mmr, 0) / ongoingGame.team2.length,
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

  await assignScoreUsers(assignScoreData);

  finishedGames.push(assignScoreData);

  await OngoingGamesSolosCollection.deleteOne({
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
