const Discord = require("discord.js");

const EloRank = require("elo-rank");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema.js");

const MatchmakerUsersScoreCollection = require("../../../utils/schemas/matchmakerUsersScoreSchema");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const { sendReply, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getContent } = require("../../../utils/utils.js");

const assignScoreUsers = async (game) => {
  const promises = [];

  [...game.team1, ...game.team2].forEach(async (user) => {
    const won =
      (game.winningTeam === 0 && game.team1.map((e) => e.userId).includes(user.userId)) ||
      (game.winningTeam === 1 && game.team2.map((e) => e.userId).includes(user.userId));

    const score = won ? "wins" : "losses";

    promises.push(
      MatchmakerUsersScoreCollection.updateOne(
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

const execute = async (interaction) => {
  const [secondArg] = getContent(interaction);

  const elo = new EloRank(16);

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = interaction.member.id;

  const channelId = interaction.channel.id;

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

  if (!ongoingGame) {
    wrongEmbed.setTitle(":x: You aren't in a game, or the game is in a different guild/channel!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (!["win", "lose"].includes(secondArg)) {
    wrongEmbed.setTitle(":x: Invalid parameter, please use /report win or /report lose");

    await sendReply(interaction, wrongEmbed);
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
    mmrDifference,
    team1: ongoingGame.team1,
    team2: ongoingGame.team2,
  };

  await assignScoreUsers(assignScoreData);

  const finishedGames = await redisInstance.getObject("finishedGames");

  finishedGames.push(assignScoreData);

  await redisInstance.setObject("finishedGames", finishedGames);

  await OngoingGamesSolosCollection.deleteOne({
    gameId: ongoingGame.gameId,
  });

  const deletableChannel = { originalChannelId: interaction.channel.id, channelIds: [...ongoingGame.channelIds] };

  const deletableChannels = await redisInstance.getObject("deletableChannels");

  deletableChannels.push(deletableChannel);

  await redisInstance.setObject("deletableChannels", deletableChannels);

  correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "report",
  helpDescription:
    "Ends the game, giving the wining team one win and vice versa to the losing team. Usage: /report win OR /report lose",
  description: "Reports the winner/loser of a game",
  args: [{ name: "report_type", description: "win or lose", required: true }],
  execute,
};
