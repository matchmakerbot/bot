const Discord = require("discord.js");

const { sendReply, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const MatchmakerUsersScoreCollection = require("../../../utils/schemas/matchmakerUsersScoreSchema");

const changeGame = async (game, param) => {
  const promises = [];

  [...game.team1, ...game.team2].forEach(async (user) => {
    const won =
      (game.winningTeam === 0 && game.team1.map((e) => e.userId).includes(user.userId)) ||
      (game.winningTeam === 1 && game.team2.map((e) => e.userId).includes(user.userId));
    let mmrAddition;

    switch (param) {
      case "revert":
        mmrAddition = won ? -game.mmrDifference * 2 : game.mmrDifference * 2;
        break;
      case "cancel":
        mmrAddition = won ? -game.mmrDifference : game.mmrDifference;
        break;
      default:
        break;
    }

    promises.push(
      await MatchmakerUsersScoreCollection.updateOne(
        {
          channelId: game.channelId,
          userId: user.userId,
        },
        {
          $inc: {
            [won ? "wins" : "losses"]: -1,
            [!won ? "wins" : "losses"]: param === "revert" ? 1 : 0,
            mmr: mmrAddition,
          },
        }
      )
    );
  });
  await Promise.all(promises);
};

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg] = interaction.content.split(" ");

  const channelId = interaction.channel.id;

  if (interaction.content.toLowerCase().includes("revertgame")) {
    wrongEmbed.setTitle("This command is deprecated, please use !changegame instead!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (!["revert", "cancel"].includes(thirdArg)) {
    wrongEmbed.setTitle(":x: Invalid Parameters! Please use !changegame revert/cancel gameId");

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (!interaction.member.permissions.has("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  const finishedGames = await redisInstance.getObject("finishedGames");

  if (!finishedGames.map((e) => e.gameId).includes(Number(secondArg))) {
    wrongEmbed.setTitle(":x: No game with that Id has been played");

    sendReply(interaction, wrongEmbed);
    return;
  }

  const selectedGame = finishedGames.find((e) => e.gameId === Number(secondArg));

  if (selectedGame.channelId !== channelId) {
    wrongEmbed.setTitle(":x: That game hasn't been played in this channel");

    sendReply(interaction, wrongEmbed);
    return;
  }

  await changeGame(selectedGame, thirdArg);

  const indexSelectedGame = finishedGames.indexOf(selectedGame);

  finishedGames.splice(indexSelectedGame, 1);

  await redisInstance.setObject("finishedGames", finishedGames);

  correctEmbed.setTitle(`:white_check_mark: Game ${thirdArg === "revert" ? "reverted" : "cancelled"}!`);

  sendReply(interaction, correctEmbed);
};

module.exports = {
  name: ["changegame", "revertgame"],
  description: "Cancels/reverts score of a finished game",
  helpdescription:
    "Cancels/reverts score of a finished game. Usage: !changegame (gameid) cancel, this example will cancel the game, as it never happen. !changegame (gameid) revert, this example will revert the scores",
  execute,
};
