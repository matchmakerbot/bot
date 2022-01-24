const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, finishedGames, changeGame } = require("../../../utils/utils");

const { sendMessage } = require("../../../utils/utils");

const TEAM1 = "team1";

const TEAM2 = "team2";

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg] = message.content.split(" ");

  const channelId = message.channel.id;

  if (message.content.split(" ").length === 1 || message.content.split(" ").length === 2) {
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

    promises.push(changeGame(selectedGame.team1, selectedGame, thirdArg, TEAM1));

    promises.push(changeGame(selectedGame.team2, selectedGame, thirdArg, TEAM2));

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
  name: "changegame",
  description:
    "Cancels/reverts score of a finished game. Usage: !changegame (gameid) cancel, this example will cancel the game, as it never happen. !changegame (gameid) revert, this example will revert the scores (I know this name is shit plz give better options)",
  execute,
};
