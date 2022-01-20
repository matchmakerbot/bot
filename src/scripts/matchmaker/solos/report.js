const Discord = require("discord.js");

const EloRank = require("elo-rank");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema.js");

const MatchmakerUsersCollection = require("../../../utils/schemas/matchmakerUsersSchema");

const { sendMessage } = require("../../../utils/utils.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, finishedGames, deletableChannels } = require("../utils");

const assignScoreUser = async (user, channelId) => {
  const score = user.won ? "wins" : "losses";

  await MatchmakerUsersCollection.updateOne(
    {
      userId: user.userId,
      channelId,
    },
    {
      $inc: { [score]: 1 },
      mmr: user.mmr + user.mmrDifference,
    }
  );
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

  if (secondArg !== "win" && secondArg !== "lose") {
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

  const promises = [];

  const mmrOfEachTeam = {
    team1: ongoingGame.team1.reduce((a, c) => a + c.mmr, 0) / ongoingGame.team1.length,
    team2: ongoingGame.team2.reduce((a, c) => a + c.mmr, 0) / ongoingGame.team2.length,
  };

  const team1EloDifference = Math.round(
    elo.updateRating(
      elo.getExpected(mmrOfEachTeam.team1, mmrOfEachTeam.team2),
      ongoingGame.winningTeam === 0 ? 1 : 0,
      mmrOfEachTeam.team1
    ) - mmrOfEachTeam.team1
  );

  const team2EloDifference = -team1EloDifference;

  const assignScoreData = {
    channelId: ongoingGame.channelId,
    guildId: ongoingGame.guildId,
    gameId: ongoingGame.gameId,
    mmrOfEachTeam: { team1: mmrOfEachTeam.team1, team2: mmrOfEachTeam.team2 },
    team1: ongoingGame.team1.map((e) => ({
      mmr: e.mmr,
      userId: e.userId,
      mmrDifference: team1EloDifference,
      won: ongoingGame.winningTeam === 0,
    })),
    team2: ongoingGame.team2.map((e) => ({
      mmr: e.mmr,
      userId: e.userId,
      mmrDifference: team2EloDifference,
      won: ongoingGame.winningTeam === 1,
    })),
  };

  [...assignScoreData.team1, ...assignScoreData.team2].forEach((user) => {
    promises.push(assignScoreUser(user, ongoingGame.channelId));
  });

  await Promise.all(promises);

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
