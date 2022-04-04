const Discord = require("discord.js");
const EloRank = require("elo-rank");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema.js");

const MatchmakerTeamsScoreCollection = require("../../../utils/schemas/matchmakerTeamsScoreSchema");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  messageEndswith,
  sendReply,
  getContent,
} = require("../../../utils/utils");

const assignScoreTeams = async (game) => {
  const promises = [];

  [game.team1, game.team2].forEach((team) => {
    const won =
      (game.winningTeam === 0 && game.team1.name === team.name) ||
      (game.winningTeam === 1 && game.team2.name === team.name);

    const score = won ? "wins" : "losses";

    promises.push(
      MatchmakerTeamsScoreCollection.updateOne(
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
  await Promise.all(promises);
};

const execute = async (interaction) => {
  const [secondArg] = getContent(interaction);

  const elo = new EloRank(16);

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = interaction.member.id;

  const channelId = interaction.channel.id;

  const ongoingGame = await OngoingGamesTeamsCollection.findOne({
    channelId,
    $or: [
      {
        "team1.captain": userId,
      },
      {
        "team2.captain": userId,
      },
    ],
  });

  if (!ongoingGame) {
    wrongEmbed.setTitle(
      ":x: You aren't in a game, or the game is in a different guild/channel, or you're not the captain!"
    );

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (!["win", "lose"].includes(secondArg)) {
    wrongEmbed.setTitle(":x: Invalid parameter, please use !report win or !report lose");

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (messageEndswith(interaction) !== "win" && messageEndswith(interaction) !== "lose") {
    wrongEmbed.setTitle(":x: Invalid params, please use !report (win or lose)");

    sendReply(interaction, wrongEmbed);
    return;
  }
  if (
    (ongoingGame.team1.captain === interaction.member.id && messageEndswith(interaction) === "win") ||
    (ongoingGame.team2.captain === interaction.member.id && messageEndswith(interaction) === "lose")
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
    mmrDifference,
    team1: ongoingGame.team1,
    team2: ongoingGame.team2,
  };

  await assignScoreTeams(assignScoreData);

  const finishedGames = await redisInstance.getObject("finishedGames");

  finishedGames.push(assignScoreData);

  await redisInstance.setObject("finishedGames", finishedGames);

  await OngoingGamesTeamsCollection.deleteOne({
    gameId: ongoingGame.gameId,
  });

  const deletableChannel = { originalChannelId: interaction.channel.id, channelIds: [...ongoingGame.channelIds] };

  const deletableChannels = await redisInstance.getObject("deletableChannels");

  deletableChannels.push(deletableChannel);

  await redisInstance.setObject("deletableChannels", deletableChannels);

  correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

  sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "report",
  helpDescription:
    "Ends the game, giving the wining team one win and vice versa to the losing team. Usage: /report win OR /report lose",
  description: "Reports the winner/loser of a game",
  execute,
};
