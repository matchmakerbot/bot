const Discord = require("discord.js");

const { sendMessage } = require("../../../utils/utils");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, finishedGames } = require("../utils");

const MatchmakerUsersCollection = require("../../../utils/schemas/matchmakerUsersSchema");

const revertGame = async (user, param, channelId) => {
  await MatchmakerUsersCollection.updateOne(
    {
      channelId,
      userId: user.userId,
    },
    {
      mmr: user.mmr - (param === "revert" ? user.mmrDifference : 0),
      $inc: { [user.won ? "wins" : "losses"]: -1, [!user.won ? "wins" : "losses"]: param === "revert" ? 1 : 0 },
    }
  );
};

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg] = message.content.split(" ");

  const channelId = message.channel.id;

  if (thirdArg == null) {
    wrongEmbed.setTitle(":x: Invalid Parameters!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!finishedGames.map((e) => e.gameId).includes(Number(secondArg))) {
    wrongEmbed.setTitle(":x: No game with that Id has been played");

    sendMessage(message, wrongEmbed);
    return;
  }

  const selectedGame = finishedGames.find((e) => e.gameId === Number(secondArg));

  if (selectedGame.channelId !== channelId) {
    wrongEmbed.setTitle(":x: That game hasn't been played in this channel");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (thirdArg === "revert" || thirdArg === "cancel") {
    const promises = [];

    for (const user of [...selectedGame.team1, ...selectedGame.team2]) {
      promises.push(revertGame(user, thirdArg, selectedGame.channelId));
    }

    await Promise.all(promises);
  } else {
    wrongEmbed.setTitle(":x: Invalid Parameters!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const indexSelectedGame = finishedGames.indexOf(selectedGame);

  finishedGames.splice(indexSelectedGame, 1);

  correctEmbed.setTitle(`:white_check_mark: Game ${thirdArg === "revert" ? "reverted" : "cancelled"}!`);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "revertgame",
  description:
    "Cancels/reverts score of a finished game. Usage: !revertgame (gameid) cancel, this example will cancel the game, as it never happen. !revertgame (gameid) revert, this example will revert the scores",
  execute,
};
