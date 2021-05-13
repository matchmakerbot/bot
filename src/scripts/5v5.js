/** @format */

const Discord = require("discord.js");

const client = require("../utils/createClientInstance.js");

const tempObject = {};

const rc = ["r", "c"];

const { sixmanCollection, gamesCollection, guildsCollection } = require("../utils/connectMongoDBServer");

const valorantMaps = ["Haven", "Bind", "Split"];

const R6Maps = ["Bank", "House", "Club", "Consulate", "Kafe", "Coastline"];

const CSGOMaps = ["Cache", "Dust II", "Inferno", "Mirage", "Train"];

const avaiableGames = ["valorant", "csgo", "leagueoflegends", "r6"];

const EMBED_COLOR_ERROR = "#F8534F";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#77B255";

const MAX_USER_IDLE_TIME_MS = 45 * 60 * 1000;

const MAX_GAME_LENGTH_MS = 3 * 60 * 60 * 1000;

const UPDATE_INTERVAL_MS = 60 * 1000;

const finishedGames = [];

const usedNums = [];

const deletableChannels = [];

const channelQueues = {};

const cancelQueue = {};

const storedGames = {};

let gameCount = 0;

let hasVoted = false;

const warnNonDeletableChannel = async (channel, gameID) => {
  const notifyChannel = await client.channels.fetch(channel).catch(() => {
    return console.log("Cannot find notifyChannel");
  });
  const embedRemove = new Discord.MessageEmbed()
    .setColor(EMBED_COLOR_WARNING)
    .setTitle(
      `Unable to delete voice channel ${gameID}, maybe the bot doesn't have permissions to do so? Please delete vc manually.`
    );
  await notifyChannel.send(embedRemove).catch(() => {
    console.log("Cannot send unable to delete voice channel message");
  });
};

const updateUsers = async () => {
  let deleted = false;
  const currentTimeMS = Date.now();
  for (const channelUsers of Object.values(channelQueues).filter((channel) => channel.length < 6)) {
    for (const user of channelUsers.filter((user1) => currentTimeMS - user1.date > MAX_USER_IDLE_TIME_MS)) {
      const channel = Object.keys(channelQueues).find((key) => channelQueues[key] === channelUsers);
      const notifyChannel = await client.channels.fetch(channel).catch(() => {
        delete channelQueues[channel];
        deleted = true;
      });
      if (deleted) {
        deleted = false;
        continue;
      }
      const embedRemove = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_WARNING)
        .setTitle("You were removed from the queue after no game has been made in 45 minutes!");

      await notifyChannel.send(`<@${user.id}>`, embedRemove).catch(() => {
        console.log("oof");
      });
      channelUsers.splice(channelUsers.indexOf(user), 1);
    }
  }
};

const updateOngoingGames = async () => {
  const ongoingGames = await fetchGames();
  if (ongoingGames.length == 0) {
    return;
  }

  const currentTimeMS = Date.now();

  for (const game of ongoingGames.filter((game1) => currentTimeMS - game1.time > MAX_GAME_LENGTH_MS)) {
    const channel = await client.channels.fetch(game.channelID).catch(() => {
      return gamesCollection.deleteOne({ gamemode: "5v5", gameID: game.gameID });
    });

    for (const channel of message.guild.channels.cache.array()) {
      if (channel.name === `🔸Team-1-Game-${game.gameID}`) {
        deletableChannels.push({
          gameID: `🔸Team-1-Game-${game.gameID}`,
          id: channel.id,
          channel: game.channelID,
        });
      }

      if (channel.name === `🔹Team-2-Game-${game.gameID}`) {
        deletableChannels.push({
          gameID: `🔹Team-2-Game-${game.gameID}`,
          id: channel.id,
          channel: game.channelID,
        });
      }
    }

    const embedRemove = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_WARNING)
      .setTitle(`:white_check_mark: Game ${game.gameID} Cancelled due to not being finished in 3 Hours!`);

    await channel.send(embedRemove).catch(() => {
      console.log("Unable to send message 1");
    });
    gamesCollection.deleteOne({ gamemode: "5v5", gameID: games.gameID });
  }
};

const updateVoiceChannels = async () => {
  const deleteVC = [];
  for (const deletableChannel of deletableChannels) {
    const voiceChannel = await client.channels.fetch(deletableChannel.id).catch(() => {
      deleteVC.push(deletableChannel);
      warnNonDeletableChannel(deletableChannel.channel, deletableChannel.gameID);
    });

    if (voiceChannel) {
      if (voiceChannel.members.array().length === 0) {
        deleteVC.push(deletableChannel);
        await voiceChannel.delete().catch(async () => {
          warnNonDeletableChannel(deletableChannel.channel, deletableChannel.gameID);
        });
      }
    } else {
      deleteVC.push(deletableChannel);
      warnNonDeletableChannel(deletableChannel.channel, deletableChannel.gameID);
    }
  }
  for (const item of deleteVC) {
    deletableChannels.splice(deletableChannels.indexOf(item), 1);
  }
};

const evaluateUpdates = async () => {
  if (Object.entries(channelQueues).length !== 0) {
    await updateUsers();
  }
  await updateOngoingGames();

  await updateVoiceChannels();
};

// setInterval(evaluateUpdates, UPDATE_INTERVAL_MS);

const shuffle = (array) => {
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);

    currentIndex--;

    temporaryValue = array[currentIndex];

    array[currentIndex] = array[randomIndex];

    array[randomIndex] = temporaryValue;
  }

  return array;
};

const getOccurrence = (array, value) => {
  return array.filter((v) => v === value).length;
};

const messageEndswith = (message) => {
  const split = message.content.split(" ");
  return split[split.length - 1];
};

const args = (message) => {
  const arraywords = message.content.split(" ");
  return arraywords[0].substring(1);
};

const fetchGames = async () => {
  return await gamesCollection
    .find({
      gamemode: "5v5",
    })
    .toArray();
};

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const secondArg = message.content.split(" ")[1];

  const thirdArg = message.content.split(" ")[2];

  const fourthArg = message.content.split(" ")[3];

  const channel_Id = message.channel.id;

  const userId = message.author.id;

  const includesUserId = (array) => array.map((e) => e.id).includes(userId);

  const givewinLose = async (score, i, gameList) => {
    const games = gameList.find((game) => includesUserId(game.players));

    const userid = games.players[i].id;

    await sixmanCollection
      .find({
        id: userid,
      })
      .toArray()
      .then(async (storedUsers) => {
        const channelPos = storedUsers[0].servers.map((e) => e.channelID).indexOf(channel_Id);

        const sort = `servers.${channelPos}.${score}`;

        const mmr = `servers.${channelPos}.mmr`;

        await sixmanCollection.update(
          {
            id: userid,
          },
          {
            $set: {
              [sort]: storedUsers[0].servers[channelPos][score] + 1,
              [mmr]:
                score === "wins"
                  ? storedUsers[0].servers[channelPos].mmr + 13
                  : storedUsers[0].servers[channelPos].mmr - 10,
            },
          }
        );
      });
  };

  const revertgame = async (status, i) => {
    const games = finishedGames.find((game) => game.gameID === parseInt(secondArg));

    const userid = games.players[i].id;

    await sixmanCollection
      .find({
        id: userid,
      })
      .toArray()
      .then(async (storedUsers) => {
        const channelPos = storedUsers[0].servers.map((e) => e.channelID).indexOf(channel_Id);

        const win = `servers.${channelPos}.wins`;

        const lose = `servers.${channelPos}.losses`;

        const sort = `servers.${channelPos}.${status}`;

        const mmr = `servers.${channelPos}.mmr`;

        if (thirdArg === "revert") {
          await sixmanCollection.update(
            {
              id: userid,
            },
            {
              $set: {
                [win]:
                  status === "wins"
                    ? storedUsers[0].servers[channelPos].wins + 1
                    : storedUsers[0].servers[channelPos].wins - 1,

                [lose]:
                  status === "losses"
                    ? storedUsers[0].servers[channelPos].losses + 1
                    : storedUsers[0].servers[channelPos].losses - 1,

                [mmr]:
                  status === "wins"
                    ? storedUsers[0].servers[channelPos].mmr + 23
                    : storedUsers[0].servers[channelPos].mmr - 23,
              },
            }
          );
        }

        if (thirdArg === "cancel") {
          await sixmanCollection.update(
            {
              id: userid,
            },
            {
              $set: {
                [sort]: storedUsers[0].servers[channelPos][status] - 1,

                [mmr]:
                  status === "wins"
                    ? storedUsers[0].servers[channelPos].mmr - 13
                    : storedUsers[0].servers[channelPos].mmr + 10,
              },
            }
          );
        }
      });
  };

  if (!Object.keys(channelQueues).includes(channel_Id)) {
    channelQueues[channel_Id] = [];
  }

  if (!Object.keys(storedGames).includes(message.guild.id)) {
    storedGames[message.guild.id] = "";
  }

  const fetchFromID = async (id) => {
    return await client.users.fetch(id).catch((error) => {
      wrongEmbed.setTitle("Please tag the user");
      console.log(error);
      message.channel.send(wrongEmbed);
    });
  };

  const queueArray = channelQueues[channel_Id];

  const toAdd = {
    id: userId,
    name: message.author.username,
    date: new Date(),
  };

  const index = queueArray.map((e) => e.id).indexOf(userId);

  if (storedGames[message.guild.id] === "") {
    await guildsCollection
      .find({
        id: message.guild.id,
      })
      .toArray()
      .then(async (storedGuilds) => {
        storedGames[message.guild.id] = storedGuilds[0].game;
      });
    if (storedGames[message.guild.id] === "" && args(message) !== "game") {
      wrongEmbed.setTitle(
        `:x: You haven't set your game yet! Please ask an Admin to do !game ${avaiableGames.join(", ")}`
      );

      return message.channel.send(wrongEmbed);
    }
  }

  const gameName = storedGames[message.guild.id];

  switch (args(message)) {
    case "game": {
      if (!avaiableGames.includes(secondArg.toLowerCase())) {
        wrongEmbed.setTitle(":x: Invalid argument");

        return message.channel.send(wrongEmbed);
      }

      if (message.member.hasPermission("ADMINISTRATOR") && avaiableGames.includes(secondArg.toLowerCase())) {
        await guildsCollection.update(
          {
            id: message.guild.id,
          },
          {
            $set: {
              game: secondArg.toLowerCase(),
            },
          }
        );

        storedGames[message.guild.id] = secondArg.toLowerCase();

        correctEmbed.setTitle(":white_check_mark: Game updated!");

        return message.channel.send(correctEmbed);
      }
    }

    case "leave": {
      for (const captainGames of Object.values(tempObject).flat()) {
        if (captainGames.id === userId) {
          wrongEmbed.setTitle(":x: You can't leave now!");

          return message.channel.send(wrongEmbed);
        }
      }
      if (queueArray.length === 10) {
        wrongEmbed.setTitle(":x: You can't leave now!");

        return message.channel.send(wrongEmbed);
      }

      if (index === -1) {
        wrongEmbed.setTitle(":x: You aren't in the queue!");

        return message.channel.send(wrongEmbed);
      }

      queueArray.splice(index, 1);

      correctEmbed.setTitle(`:white_check_mark: ${message.author.username} left the queue! ${queueArray.length}/10`);

      return message.channel.send(correctEmbed);
    }

    case "status": {
      correctEmbed.setTitle(`Players in queue: ${queueArray.length}`);

      correctEmbed.setDescription(queueArray.map((e) => e.name).join(", "));

      return message.channel.send(correctEmbed);
    }

    case "report": {
      const gameList = await fetchGames();

      if (!includesUserId(gameList.map((e) => e.players).flat())) {
        wrongEmbed.setTitle(":x: You aren't in a game!");

        return message.channel.send(wrongEmbed);
      }
      const games = gameList.find((game) => includesUserId(game.players));

      if (games.channelID !== channel_Id) {
        wrongEmbed.setTitle(":x: This is not the correct channel to report the win/lose!");

        return message.channel.send(wrongEmbed);
      }

      const indexplayer = games.players.map((e) => e.id).indexOf(userId);

      switch (messageEndswith(message)) {
        case "win": {
          if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2 || indexplayer === 3 || indexplayer === 4) {
            for (i = 0; i < 5; i++) {
              await givewinLose("wins", i, gameList);
            }
            for (i = 5; i < 10; i++) {
              await givewinLose("losses", i, gameList);
            }
          } else {
            for (i = 5; i < 10; i++) {
              await givewinLose("wins", i, gameList);
            }
            for (i = 0; i < 5; i++) {
              await givewinLose("losses", i, gameList);
            }
          }
          break;
        }

        case "lose": {
          if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2 || indexplayer === 3 || indexplayer === 4) {
            for (let i = 0; i < 5; i++) {
              await givewinLose("losses", i, gameList);
            }
            for (let i = 5; i < 10; i++) {
              await givewinLose("wins", i, gameList);
            }
          } else {
            for (let i = 5; i < 10; i++) {
              await givewinLose("losses", i, gameList);
            }
            for (let i = 0; i < 5; i++) {
              await givewinLose("wins", i, gameList);
            }
          }
          break;
        }
        default: {
          wrongEmbed.setTitle(":x: Invalid Parameters!");
          return message.channel.send(wrongEmbed);
        }
      }

      games.winningTeam = indexplayer === 0 || indexplayer === 1 || indexplayer === 2 ? 0 : 1;

      finishedGames.push(games);

      gamesCollection.deleteOne({ gamemode: "5v5", gameID: games.gameID });

      for (const channel of message.guild.channels.cache.array()) {
        if (channel.name === `🔸Team-1-Game-${games.gameID}`) {
          deletableChannels.push({
            gameID: `🔸Team-1-Game-${games.gameID}`,
            id: channel.id,
            channel: message.channel.id,
          });
        }

        if (channel.name === `🔹Team-2-Game-${games.gameID}`) {
          deletableChannels.push({
            gameID: `🔹Team-2-Game-${games.gameID}`,
            id: channel.id,
            channel: message.channel.id,
          });
        }
      }

      correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

      return message.channel.send(correctEmbed);
    }

    case "revertgame": {
      if (message.content.split(" ").length == 1 || message.content.split(" ").length == 2) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      if (!message.member.hasPermission("ADMINISTRATOR")) {
        wrongEmbed.setTitle(":x: You do not have Administrator permission!");

        return message.channel.send(wrongEmbed);
      }

      if (!finishedGames.map((e) => e.gameID).includes(parseInt(secondArg))) {
        wrongEmbed.setTitle(":x: No game with that ID has been played");

        return message.channel.send(wrongEmbed);
      }

      const selectedGame = finishedGames.find((e) => e.gameID === parseInt(secondArg));

      if (selectedGame.channelID !== channel_Id) {
        wrongEmbed.setTitle(":x: That game hasn't been played in this channel");

        return message.channel.send(wrongEmbed);
      }

      if (thirdArg === "revert") {
        if (selectedGame.winningTeam === 0) {
          for (i = 0; i < 5; i++) {
            revertgame("losses", i);
          }
          for (i = 5; i < 10; i++) {
            revertgame("wins", i);
          }
        } else {
          for (i = 5; i < 10; i++) {
            revertgame("losses", i);
          }
          for (i = 5; i < 10; i++) {
            revertgame("wins", i);
          }
        }
      } else if (thirdArg === "cancel") {
        if (selectedGame.winningTeam === 0) {
          for (i = 0; i < 5; i++) {
            revertgame("wins", i);
          }
          for (i = 5; i < 10; i++) {
            revertgame("losses", i);
          }
        } else {
          for (i = 5; i < 10; i++) {
            revertgame("wins", i);
          }
          for (i = 0; i < 5; i++) {
            revertgame("losses", i);
          }
        }
      } else {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      const indexSelectedGame = finishedGames.indexOf(selectedGame);

      finishedGames.splice(indexSelectedGame, 1);

      correctEmbed.setTitle(`:white_check_mark: Game ${thirdArg === "revert" ? "reverted" : "cancelled"}!`);

      return message.channel.send(correctEmbed);
    }

    case "cancel": {
      const gameList = await fetchGames();

      if (!includesUserId(gameList.map((e) => e.players).flat())) {
        wrongEmbed.setTitle(":x: You aren't in a game!");

        return message.channel.send(wrongEmbed);
      }
      const games = gameList.find((game) => includesUserId(game.players));

      const IDGame = games.gameID;

      if (!Object.keys(cancelQueue).includes(IDGame.toString())) {
        cancelQueue[IDGame] = [];
      }

      const cancelqueuearray = cancelQueue[IDGame];

      if (cancelqueuearray.includes(userId)) {
        wrongEmbed.setTitle(":x: You've already voted to cancel!");

        return message.channel.send(wrongEmbed);
      }

      cancelqueuearray.push(userId);

      correctEmbed.setTitle(
        `:exclamation: ${message.author.username} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/6)`
      );

      message.channel.send(correctEmbed);

      if (cancelqueuearray.length === 6) {
        for (const channel of message.guild.channels.cache.array()) {
          if (channel.name === `🔸Team-1-Game-${games.gameID}`) {
            channel
              .delete()
              .catch((e) =>
                message.channel.send(
                  `Unable to delete voice channel 🔸Team-1-Game-${games.gameID}, maybe the bot doesn't have permissions to do so? Please delete vc manually.`
                )
              );
          }

          if (channel.name === `🔹Team-2-Game-${games.gameID}`) {
            channel
              .delete()
              .catch((e) =>
                message.channel.send(
                  `Unable to delete voice channel 🔹Team-2-Game-${games.gameID}, maybe the bot doesn't have permissions to do so? Please delete vc manually.`
                )
              );
          }
        }

        correctEmbed.setTitle(`:white_check_mark: Game ${games.gameID} Cancelled!`);

        cancelQueue[IDGame] = [];

        gamesCollection.deleteOne({ gamemode: "5v5", gameID: IDGame });

        return message.channel.send(correctEmbed);
      }

      break;
    }

    case "score": {
      switch (secondArg) {
        case "me": {
          await sixmanCollection
            .find({
              id: userId,
              servers: {
                $elemMatch: {
                  channelID: channel_Id,
                },
              },
            })
            .toArray()
            .then((storedUsers) => {
              if (storedUsers.length === 0) {
                wrongEmbed.setTitle(":x: You haven't played any games yet!");

                return message.channel.send(wrongEmbed);
              }

              const scoreDirectory =
                storedUsers[0].servers[storedUsers[0].servers.map((e) => e.channelID).indexOf(message.channel.id)];

              correctEmbed.addField("Wins:", scoreDirectory.wins);

              correctEmbed.addField("Losses:", scoreDirectory.losses);

              correctEmbed.addField(
                "Winrate:",
                isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100))
                  ? "0%"
                  : `${Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)}%`
              );

              correctEmbed.addField("MMR:", scoreDirectory.mmr);

              return message.channel.send(correctEmbed);
            });
          break;
        }
        case "channel": {
          const getScore = async (id, arg) => {
            await sixmanCollection
              .find({
                servers: {
                  $elemMatch: {
                    channelID: id,
                  },
                },
              })
              .toArray()
              .then(async (storedUsers) => {
                storedUsers = storedUsers.filter(
                  (a) =>
                    a.servers.map((e) => e.channelID).indexOf(id) !== -1 &&
                    a.servers[a.servers.map((e) => e.channelID).indexOf(id)].wins +
                      a.servers[a.servers.map((e) => e.channelID).indexOf(id)].losses !==
                      0
                );

                if (
                  !message.guild.channels.cache
                    .array()
                    .map((e) => e.id)
                    .includes(id)
                ) {
                  wrongEmbed.setTitle(":x: This channel does not belong to this server!");

                  return message.channel.send(wrongEmbed);
                }

                if (storedUsers.length === 0) {
                  wrongEmbed.setTitle(":x: No games have been played in here!");

                  return message.channel.send(wrongEmbed);
                }

                storedUsers.sort((a, b) => {
                  const indexA = a.servers.map((e) => e.channelID).indexOf(id);

                  const indexB = b.servers.map((e) => e.channelID).indexOf(id);

                  return b.servers[indexB].mmr - a.servers[indexA].mmr;
                });

                if (!isNaN(arg) && arg > 0) {
                  let indexes = 20 * (arg - 1);
                  for (indexes; indexes < 20 * arg; indexes++) {
                    if (storedUsers[indexes] == undefined) {
                      correctEmbed.addField("No more members to list in this page!", "Encourage your friends to play!");

                      break;
                    }
                    for (const servers of storedUsers[indexes].servers) {
                      if (servers.channelID === id) {
                        correctEmbed.addField(
                          (await fetchFromID(storedUsers[indexes].id)).username,
                          `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${
                            isNaN(Math.floor((servers.wins / (servers.wins + servers.losses)) * 100))
                              ? "0"
                              : Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)
                          }% | MMR: ${servers.mmr}`
                        );

                        correctEmbed.setFooter(`Showing page ${arg}/${Math.ceil(storedUsers.length / 20)}`);
                      }
                    }
                  }
                } else {
                  for (let i = 0; i < 20; i++) {
                    if (storedUsers[i] == undefined) {
                      correctEmbed.addField("No more members to list in this page!", "Encourage your friends to play!");
                      break;
                    }
                    for (const servers of storedUsers[i].servers) {
                      if (servers.channelID === id) {
                        correctEmbed.addField(
                          (await fetchFromID(storedUsers[i].id)).username,
                          `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${
                            isNaN(Math.floor((servers.wins / (servers.wins + servers.losses)) * 100))
                              ? "0"
                              : Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)
                          }% | MMR: ${servers.mmr}`
                        );

                        correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(storedUsers.length / 20)}`);
                      }
                    }
                  }
                }
                return message.channel.send(correctEmbed);
              });
          };

          if (!isNaN(thirdArg) && parseInt(thirdArg) > 10000) {
            return getScore(thirdArg, fourthArg);
          }
          return getScore(channel_Id, thirdArg);
        }
      }
      break;
    }

    case "ongoinggames": {
      const games = await fetchGames();
      if (games.length === 0) {
        wrongEmbed.setTitle(":x: No games are currently having place!");

        return message.channel.send(wrongEmbed);
      }

      for (let i = 0; i < 6; i++) {
        // change it to allow more games
        const game = games[i];

        if (game == undefined) {
          correctEmbed.addField("No more games to list ", "Encourage your friends to play!");
          break;
        }

        if (game.channelID === channel_Id) {
          correctEmbed.addField("Game ID:", ` ${game.gameID}`);

          correctEmbed.addField(
            ":small_orange_diamond: -Team 1-",
            `<@${game.players[0].id}>, <@${game.players[1].id}>, <@${game.players[2].id}>, <@${game.players[3].id}>, <@${game.players[4].id}>`
          );
          correctEmbed.addField(
            ":small_blue_diamond: -Team 2-",
            ` <@${game.players[5].id}>, <@${game.players[6].id}>, <@${game.players[7].id}>, <@${game.players[8].id}>, <@${game.players[9].id}>`
          );

          correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(games.length / 20)}`);
        }
      }
      return message.channel.send(correctEmbed);
    }

    case "reset": {
      if (message.content.split(" ").length == 1) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      if (!message.member.hasPermission("ADMINISTRATOR")) {
        wrongEmbed.setTitle(":x: You do not have Administrator permission!");

        return message.channel.send(wrongEmbed);
      }

      switch (secondArg) {
        case "channel": {
          const fetchGamesByChannelId = await gamesCollection
            .find({ gamemode: "5v5", channelID: channel_Id })
            .toArray();
          if (fetchGamesByChannelId.length !== 0) {
            wrongEmbed.setTitle(":x: There are users in game!");

            return message.channel.send(wrongEmbed);
          }

          if (message.content.split(" ").length !== 2) {
            wrongEmbed.setTitle(":x: Invalid Parameters!");

            return message.channel.send(wrongEmbed);
          }

          await sixmanCollection
            .find({
              servers: {
                $elemMatch: {
                  channelID: channel_Id,
                },
              },
            })
            .toArray()
            .then(async (storedUsers) => {
              for (const user of storedUsers) {
                const channelPos = user.servers
                  .map((e) => e)
                  .map((e) => e.channelID)
                  .indexOf(channel_Id);

                if (channelPos !== -1) {
                  await sixmanCollection.update(
                    {
                      id: user.id,
                    },
                    {
                      $pull: {
                        servers: {
                          channelID: channel_Id,
                        },
                      },
                    }
                  );
                }
              }
            });

          for (const game of finishedGames) {
            if (game.channelID === channel_Id) {
              finishedGames.splice(finishedGames.indexOf(game), 1);
            }
          }
          correctEmbed.setTitle(":white_check_mark: Channel score reset!");

          return message.channel.send(correctEmbed);
        }

        case "player": {
          const findUserInGame = (await fetchGames())
            .map((e) => e.players)
            .flat()
            .map((e) => e.id)
            .includes(thirdArg);
          if (findUserInGame) {
            wrongEmbed.setTitle(":x: User is in the middle of a game!");

            return message.channel.send(wrongEmbed);
          }

          if (message.content.split(" ").length !== 3) {
            wrongEmbed.setTitle(":x: Invalid Parameters!");

            return message.channel.send(wrongEmbed);
          }

          await sixmanCollection
            .find({
              id: thirdArg,
            })
            .toArray()
            .then(async (storedUsers) => {
              if (storedUsers.length === 0) {
                wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!");

                return message.channel.send(wrongEmbed);
              }

              await sixmanCollection.update(
                {
                  id: thirdArg,
                },
                {
                  $pull: {
                    servers: {
                      channelID: channel_Id,
                    },
                  },
                }
              );
            });

          correctEmbed.setTitle(":white_check_mark: Player's score reset!");

          return message.channel.send(correctEmbed);
        }
        default: {
          wrongEmbed.setTitle(":x: Invalid Parameters!");

          return message.channel.send(wrongEmbed);
        }
      }
    }

    case "q": {
      for (const person of queueArray) {
        if (person.id === userId) {
          wrongEmbed.setTitle(":x: You're already in the queue!");

          return message.channel.send(wrongEmbed);
        }
      }

      if (includesUserId(Object.values(channelQueues).flat())) {
        const channelQueued = (
          await client.channels.fetch(Object.keys(channelQueues).find((e) => includesUserId(channelQueues[e])))
        ).name;
        wrongEmbed.setTitle(`:x: You're already queued in the channel ${channelQueued}!`);

        return message.channel.send(wrongEmbed);
      }

      if (includesUserId((await fetchGames()).map((e) => e.players).flat())) {
        wrongEmbed.setTitle(":x: You are in the middle of a game!");

        return message.channel.send(wrongEmbed);
      }

      if (queueArray.length > 9) {
        wrongEmbed.setTitle(":x: Please wait for the next game to be decided!");

        return message.channel.send(wrongEmbed);
      }

      queueArray.push(toAdd);

      correctEmbed.setTitle(`:white_check_mark: Added to queue! ${queueArray.length}/10`);

      message.channel.send(correctEmbed);

      if (queueArray.length === 10) {
        gameCount++;

        const gameCreatedObj = {
          gamemode: "5v5",
          gameID: gameCount,
          time: new Date(),
          channelID: channel_Id,
          players: [],
          winningTeam: null,
        };

        for (const user of queueArray) {
          await sixmanCollection
            .find({
              id: user.id,
            })
            .toArray()
            .then(async (storedUsers) => {
              const newUser = {
                id: user.id,
                name: user.name,
                servers: [],
              };

              if (storedUsers.length === 0) {
                await sixmanCollection.insert(newUser);

                await sixmanCollection.update(
                  {
                    id: user.id,
                  },
                  {
                    $push: {
                      servers: {
                        channelID: channel_Id,
                        wins: 0,
                        losses: 0,
                        mmr: 1000,
                      },
                    },
                  }
                );
              } else if (!storedUsers[0].servers.map((e) => e.channelID).includes(channel_Id)) {
                await sixmanCollection.update(
                  {
                    id: user.id,
                  },
                  {
                    $push: {
                      servers: {
                        channelID: channel_Id,
                        wins: 0,
                        losses: 0,
                        mmr: 1000,
                      },
                    },
                  }
                );
              }
            });
        }

        const valuesforpm = {
          name: Math.floor(Math.random() * 99999) + 100,
          password: Math.floor(Math.random() * 99999) + 100,
        };

        message.channel.send(
          `<@${queueArray[0].id}>, <@${queueArray[1].id}>, <@${queueArray[2].id}>, <@${queueArray[3].id}>, <@${queueArray[4].id}>, <@${queueArray[5].id}>, <@${queueArray[6].id}>, <@${queueArray[7].id}>, <@${queueArray[8].id}>, <@${queueArray[9].id}>`
        );

        correctEmbed.setTitle(
          "A game has been made! Please select your preferred gamemode: Captains (!c) or Random (!r) "
        );

        const rorc = {};

        rorc[gameCount] = [];

        const rorcArray = rorc[gameCount];

        await message.channel.send(correctEmbed);

        let filter = (m) => m.content.split("")[1] === "r" || m.content.split("")[1] === "c";

        message.channel
          .createMessageCollector(filter, {
            time: 20000,
          })
          .on("collect", (m) => {
            if (
              queueArray.map((e) => e.id).includes(m.author.id) ||
              !rorcArray.map((e) => e.id).includes(m.author.id)
            ) {
              rorcArray.push({
                id: m.author.id,
                param: m.content.split("")[1],
              });
            }
          });

        await new Promise((resolve) => setTimeout(resolve, 20000));

        if (rorcArray.length === 0) {
          rorcArray.push({
            param: rc[Math.floor(Math.random() * rc.length)],
          });
        }

        if (
          getOccurrence(
            rorcArray.map((e) => e.param),
            "r"
          ) ===
          getOccurrence(
            rorcArray.map((e) => e.param),
            "c"
          )
        ) {
          rorcArray.push({
            param: rorcArray[Math.floor(Math.random() * rorcArray.map((e) => e.param).length)].param,
          });
        }
        if (
          getOccurrence(
            rorcArray.map((e) => e.param),
            "r"
          ) >
          getOccurrence(
            rorcArray.map((e) => e.param),
            "c"
          )
        ) {
          shuffle(queueArray);
        } else if (
          getOccurrence(
            rorcArray.map((e) => e.param),
            "c"
          ) >
          getOccurrence(
            rorcArray.map((e) => e.param),
            "r"
          )
        ) {
          // yes this code is horrible no shit sherlock

          // also what youre about to see will kill you, its not permanent, as even i have standarts

          tempObject[gameCreatedObj.gameID] = [];

          usedNums[gameCreatedObj.gameID] = [];

          const gameCountNums = usedNums[gameCreatedObj.gameID];

          const captainsArray = tempObject[gameCreatedObj.gameID];

          captainsArray.push(
            ...queueArray.map((queueItem) => ({
              ...queueItem,
            }))
          );

          shuffle(captainsArray);

          for (const player of queueArray) {
            if (player.name !== undefined) {
              player.name = "Placeholder";
            }
          }

          queueArray[0] = captainsArray[0];

          queueArray[5] = captainsArray[1];

          const CaptainsEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle(`Game ID: ${gameCreatedObj.gameID}`)
            .addField("Captain for team 1", captainsArray[0].name)
            .addField("Captain for team 2", captainsArray[1].name);

          message.channel.send(CaptainsEmbed);

          const privatedm0 = await client.users
            .fetch(captainsArray[0].id)
            .catch(() => message.channel.send("Invalid captain"));

          const privatedm1 = await client.users
            .fetch(captainsArray[1].id)
            .catch(() => message.channel.send("Invalid captain"));

          captainsArray.shift();

          captainsArray.shift();

          const Captain1st = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("Choose one ( you have 40 seconds):")
            .addField("1 :", captainsArray[0].name)
            .addField("2 :", captainsArray[1].name)
            .addField("3 :", captainsArray[2].name)
            .addField("4 :", captainsArray[3].name)
            .addField("5 :", captainsArray[4].name)
            .addField("6 :", captainsArray[5].name)
            .addField("7 :", captainsArray[6].name)
            .addField("8 :", captainsArray[7].name);

          privatedm0.send(Captain1st).catch((error) => {
            const errorEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(
                `:x: Couldn't sent message to ${privatedm0}, please check if your DM'S aren't set to friends only.`
              );

            console.error(error);

            message.channel.send(errorEmbed);
          });

          filter = (m) => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 9;

          await privatedm0.createDM().then((m) => {
            m.createMessageCollector(filter, {
              time: 40000,
            }).on("collect", (m) => {
              const parsedM = parseInt(m.content) - 1;

              if (!hasVoted) {
                queueArray[1] = captainsArray[parsedM];

                captainsArray.splice(parsedM, 1);

                hasVoted = true;
              }
            });
          });

          await new Promise((resolve) => setTimeout(resolve, 40000));

          if (!hasVoted) {
            const randomnumber = Math.floor(Math.random() * 8);

            queueArray[1] = captainsArray[randomnumber];

            captainsArray.splice(randomnumber, 1);
          }

          hasVoted = false;

          const Captain2nd = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("Choose two ( you have 40 seconds):")
            .addField("1 :", captainsArray[0].name)
            .addField("2 :", captainsArray[1].name)
            .addField("3 :", captainsArray[2].name)
            .addField("4 :", captainsArray[3].name)
            .addField("5 :", captainsArray[4].name)
            .addField("6 :", captainsArray[5].name)
            .addField("7 :", captainsArray[6].name);

          privatedm1.send(Captain2nd).catch((error) => {
            const errorEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(
                `:x: Couldn't sent message to ${privatedm1}, please check if your DM'S aren't set to friends only.`
              );

            console.error(error);

            message.channel.send(errorEmbed);
          });

          filter = (m) => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 8;

          privatedm1.createDM().then((m) => {
            m.createMessageCollector(filter, {
              time: 40000,
            }).on("collect", (m) => {
              const parsedM = parseInt(m.content) - 1;

              if (!hasVoted) {
                queueArray[6] = captainsArray[parsedM];

                hasVoted = true;

                usedNums.push(parsedM);
              } else if (hasVoted && !usedNums.includes(parsedM) && hasVoted !== "all") {
                queueArray[7] = captainsArray[parsedM];

                hasVoted = "all";

                usedNums.push(parsedM);

                captainsArray.splice(usedNums[0], 1);

                if (usedNums[1] > usedNums[0]) {
                  captainsArray.splice(usedNums[1] - 1, 1);
                } else {
                  captainsArray.splice(usedNums[1], 1);
                }
              }
            });
          });

          await new Promise((resolve) => setTimeout(resolve, 40000));

          let randomnumber = Math.floor(Math.random() * 7);

          let randomnumber2 = Math.floor(Math.random() * 7);

          if (!hasVoted) {
            while (randomnumber === randomnumber2) {
              randomnumber2 = Math.floor(Math.random() * 7);
            }

            queueArray[6] = captainsArray[randomnumber];

            queueArray[7] = captainsArray[randomnumber2];

            captainsArray.splice(randomnumber, 1);

            if (randomnumber2 > randomnumber) {
              captainsArray.splice(randomnumber2 - 1, 1);
            } else {
              captainsArray.splice(randomnumber2, 1);
            }
          } else if (hasVoted !== "all") {
            while (usedNums.includes(randomnumber2)) {
              randomnumber2 = Math.floor(Math.random() * 6);
            }

            queueArray[7] = captainsArray[randomnumber2];

            captainsArray.splice(usedNums[0], 1);

            if (randomnumber2 > usedNums[0]) {
              captainsArray.splice(randomnumber2 - 1, 1);
            } else {
              captainsArray.splice(randomnumber2, 1);
            }
          }

          usedNums = [];

          hasVoted = false;

          const Captain3rd = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("Choose two ( you have 20 seconds):")
            .addField("1 :", captainsArray[0].name)
            .addField("2 :", captainsArray[1].name)
            .addField("3 :", captainsArray[2].name)
            .addField("4 :", captainsArray[3].name)
            .addField("5 :", captainsArray[4].name);

          privatedm0.send(Captain3rd).catch((error) => {
            const errorEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(
                `:x: Couldn't sent message to ${privatedm0}, please check if your DM'S aren't set to friends only.`
              );
            -console.error(error);

            message.channel.send(errorEmbed);
          });

          filter = (m) => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 6;

          privatedm0.createDM().then((m) => {
            m.createMessageCollector(filter, {
              time: 40000,
            }).on("collect", (m) => {
              const parsedM = parseInt(m.content) - 1;

              if (!hasVoted) {
                queueArray[2] = captainsArray[parsedM];

                hasVoted = true;

                gameCountNums.push(parsedM);
              } else if (hasVoted && !gameCountNums.includes(parsedM) && hasVoted !== "all") {
                queueArray[3] = captainsArray[parsedM];

                hasVoted = "all";

                gameCountNums.push(parsedM);

                captainsArray.splice(gameCountNums[0], 1);

                if (gameCountNums[1] > gameCountNums[0]) {
                  captainsArray.splice(gameCountNums[1] - 1, 1);
                } else {
                  captainsArray.splice(usedNums[1], 1);
                }
              }
            });
          });

          await new Promise((resolve) => setTimeout(resolve, 20000));

          randomnumber = Math.floor(Math.random() * 5);

          randomnumber2 = Math.floor(Math.random() * 5);

          if (!hasVoted) {
            while (randomnumber === randomnumber2) {
              randomnumber2 = Math.floor(Math.random() * 5);
            }

            queueArray[2] = captainsArray[randomnumber];

            queueArray[3] = captainsArray[randomnumber2];

            captainsArray.splice(randomnumber, 1);

            if (randomnumber2 > randomnumber) {
              captainsArray.splice(randomnumber2 - 1, 1);
            } else {
              captainsArray.splice(randomnumber2, 1);
            }
          } else if (hasVoted !== "all") {
            while (gameCountNums.includes(randomnumber2)) {
              randomnumber2 = Math.floor(Math.random() * 4);
            }

            queueArray[3] = captainsArray[randomnumber2];

            captainsArray.splice(gameCountNums[0], 1);

            if (randomnumber2 > gameCountNums[0]) {
              captainsArray.splice(randomnumber2 - 1, 1);
            } else {
              captainsArray.splice(randomnumber2, 1);
            }
          }

          gameCountNums = [];

          hasVoted = false;

          const Captain4th = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("Choose two ( you have 40 seconds):")
            .addField("1 :", captainsArray[0].name)
            .addField("2 :", captainsArray[1].name)
            .addField("3 :", captainsArray[2].name);

          privatedm1.send(Captain4th).catch((error) => {
            const errorEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(
                `:x: Couldn't sent message to ${privatedm1}, please check if your DM'S aren't set to friends only.`
              );

            console.error(error);

            message.channel.send(errorEmbed);
          });

          filter = (m) => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 4;

          privatedm1.createDM().then((m) => {
            m.createMessageCollector(filter, {
              time: 40000,
            }).on("collect", (m) => {
              const parsedM = parseInt(m.content) - 1;

              if (!hasVoted) {
                queueArray[8] = captainsArray[parsedM];

                hasVoted = true;

                gameCountNums.push(parsedM);
              } else if (hasVoted && !gameCountNums.includes(parsedM) && hasVoted !== "all") {
                queueArray[9] = captainsArray[parsedM];

                hasVoted = "all";

                gameCountNums.push(parsedM);

                captainsArray.splice(gameCountNums[0], 1);

                if (gameCountNums[1] > gameCountNums[0]) {
                  captainsArray.splice(gameCountNums[1] - 1, 1);
                } else {
                  captainsArray.splice(gameCountNums[1], 1);
                }
              }
            });
          });

          await new Promise((resolve) => setTimeout(resolve, 40000));

          randomnumber = Math.floor(Math.random() * 3);

          randomnumber2 = Math.floor(Math.random() * 3);

          if (!hasVoted) {
            while (randomnumber === randomnumber2) {
              randomnumber2 = Math.floor(Math.random() * 3);
            }

            queueArray[8] = captainsArray[randomnumber];

            queueArray[9] = captainsArray[randomnumber2];

            captainsArray.splice(randomnumber, 1);

            if (randomnumber2 > randomnumber) {
              captainsArray.splice(randomnumber2 - 1, 1);
            } else {
              captainsArray.splice(randomnumber2, 1);
            }
          } else if (hasVoted && hasVoted !== "all") {
            while (gameCountNums.includes(randomnumber2)) {
              randomnumber2 = Math.floor(Math.random() * 2);
            }

            queueArray[9] = captainsArray[randomnumber2];

            captainsArray.splice(gameCountNums[0], 1);

            if (randomnumber2 > gameCountNums[0]) {
              captainsArray.splice(randomnumber2 - 1, 1);
            } else {
              captainsArray.splice(randomnumber2, 1);
            }
          }

          hasVoted = false;

          queueArray[4] = captainsArray[0];

          captainsArray.splice(0, captainsArray.length);

          gameCountNums.splice(0, gameCountNums.length);
        }

        for (let i = 0; i < 10; i++) {
          gameCreatedObj.players.push(queueArray[i]);
        }

        await gamesCollection.insert(gameCreatedObj);

        const discordEmbed1 = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .addField("Game is ready:", `Game ID is: ${gameCreatedObj.gameID}`)
          .addField(
            ":small_orange_diamond: -Team 1-",
            `${gameCreatedObj.players[0].name}, ${gameCreatedObj.players[1].name}, ${gameCreatedObj.players[2].name}, ${gameCreatedObj.players[3].name}, ${gameCreatedObj.players[4].name}`
          )
          .addField(
            ":small_blue_diamond: -Team 2-",
            `${gameCreatedObj.players[5].name}, ${gameCreatedObj.players[6].name}, ${gameCreatedObj.players[7].name}, ${gameCreatedObj.players[8].name}, ${gameCreatedObj.players[9].name}`
          );
        if (gameName !== "LeagueOfLegends") {
          discordEmbed1.addField(
            `Map: ${
              gameName === "valorant"
                ? valorantMaps[Math.floor(Math.random() * valorantMaps.length)]
                : gameName === "valorant"
                ? CSGOMaps[Math.floor(Math.random() * CSGOMaps.length)]
                : gameName === "r6"
                ? R6Maps[Math.floor(Math.random() * R6Maps.length)]
                : "Summoners Rift (duh)"
            }`,
            "Please organize a match with your teammates and opponents. Team 1 attacks and Team 2 defends. Good luck!"
          );
        }
        message.channel.send(discordEmbed1);

        if (gameName === "leagueoflegends") {
          const JoinMatchEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .addField("Name:", valuesforpm.name)
            .addField("Password:", valuesforpm.password)
            .addField("You have to:", `Join match(Created by ${gameCreatedObj.players[0].name})`);

          for (const users of gameCreatedObj.players) {
            if (users.id !== gameCreatedObj.players[0].id) {
              const fetchedUser = await client.users.fetch(users.id).catch(() => message.channel.send("Invalid User"));
              await fetchedUser.send(JoinMatchEmbed).catch((error) => {
                const errorEmbed = new Discord.MessageEmbed()
                  .setColor(EMBED_COLOR_WARNING)
                  .setTitle(
                    `:x: Couldn't sent message to ${users.name}, please check if your DM'S aren't set to friends only.`
                  );

                console.error(error);

                message.channel.send(errorEmbed);
              });
            }
          }

          const CreateMatchEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .addField("Name:", valuesforpm.name)
            .addField("Password:", valuesforpm.password)
            .addField("You have to:", "Create Custom Match");

          const fetchedUser = await client.users
            .fetch(gameCreatedObj.players[0].id)
            .catch(() => message.channel.send("Invalid User"));

          await fetchedUser.send(CreateMatchEmbed).catch((error) => {
            const errorEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(
                `:x: Couldn't sent message to ${gameCreatedObj.players[0].name}, please check if your DM'S aren't set to friends only.`
              );

            message.channel.send(errorEmbed);
            console.error(error);
          });
        }

        message.guild.channels
          .create(`🔸Team-1-Game-${gameCreatedObj.gameID}`, {
            type: "voice",
            parent: message.channel.parentID,
            permissionOverwrites: [
              {
                id: message.guild.id,
                deny: "CONNECT",
              },
              {
                id: gameCreatedObj.players[0].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[1].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[2].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[3].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[4].id,
                allow: "CONNECT",
              },
            ],
          })
          .catch((e) =>
            message.channel.send("Error creating voice channels, are you sure the bot has permissions to do so?")
          );

        message.guild.channels
          .create(`🔹Team-2-Game-${gameCreatedObj.gameID}`, {
            type: "voice",
            parent: message.channel.parentID,
            permissionOverwrites: [
              {
                id: message.guild.id,
                deny: "CONNECT",
              },
              {
                id: gameCreatedObj.players[5].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[6].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[7].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[8].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[9].id,
                allow: "CONNECT",
              },
            ],
          })
          .catch((e) =>
            message.channel.send("Error creating voice channels, are you sure the bot has permissions to do so?")
          );

        queueArray.splice(0, queueArray.length);
      }
    }
  }
};

module.exports = {
  name: "a", /* [
    "q",
    "status",
    "leave",
    "report",
    "score",
    "cancel",
    "reset",
    "r",
    "c",
    "game",
    "ongoinggames",
    "mode",
    "revertgame",
  ], */
  description: "6man bot",
  execute,
};
