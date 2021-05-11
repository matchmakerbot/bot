// rework captainsMode, rework revertscore, try and replace findOnes with findMany whenever possible

const Discord = require("discord.js");

const client = require("../utils/createClientInstance.js");

const OngoingGamesCollection = require("../utils/schemas/ongoingGamesSchema.js");

const SixmanCollection = require("../utils/schemas/matchmakerUsers");

const rc = ["r", "c"];

const EMBED_COLOR_ERROR = "#F8534F";

const TEAM1 = "team1";

const TEAM2 = "team2";

const WINS = "wins"

const LOSSES = "losses"

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

let promises = [];

let gameCount = 0;

let hasVoted = false;

const fetchGames = async () => {
  const games = await OngoingGamesCollection.find({
    gamemode: "3v3",
  });
  return games;
};

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
  const currentTimeMS = Date.now();
  for (const channelUsers of Object.values(channelQueues).filter((channel) => channel.length < 6)) {
    for (const user of channelUsers.filter((user1) => currentTimeMS - user1.date > MAX_USER_IDLE_TIME_MS)) {
      const channel = Object.keys(channelQueues).find((key) => channelQueues[key] === channelUsers);
      const notifyChannel = client.channels
        .fetch(channel)
        .then((e) => {
          const embedRemove = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("You were removed from the queue after no game has been made in 45 minutes!");

          e.send(`<@${user.id}>`, embedRemove);
        })
        .catch(() => {
          delete channelQueues[channel];
        });
      promises.push(notifyChannel);
    }
  }
  await Promise.all(promises);

  promises = [];
};

const updateOngoingGames = async () => {
  const ongoingGames = await fetchGames();
  if (ongoingGames.length === 0) {
    return;
  }

  const currentTimeMS = Date.now();

  for (const game of ongoingGames.filter((game1) => currentTimeMS - game1.time > MAX_GAME_LENGTH_MS)) {
    const channelNotif = client.channels
      .fetch(game.channelID)
      .then(async (e) => {
        for (const channel of game.voiceChannelIds) {
          deletableChannels.push({
            channelName: channel.name,
            id: channel.id,
            channel: channel.channel,
          });
        }

        const embedRemove = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .setTitle(`:white_check_mark: Game ${game.gameID} Cancelled due to not being finished in 3 Hours!`);

        await e.send(embedRemove).catch(() => {
          console.log("Unable to send message 1");
        });
        await OngoingGamesCollection.deleteOne({
          gamemode: "3v3",
          gameID: game.gameID
        });
        return null;
      })
      .catch(async () => {
        await OngoingGamesCollection.deleteOne({
          gamemode: "3v3",
          gameID: game.gameID
        });
      });
    promises.push(channelNotif);
  }
  await Promise.all(promises);

  promises = [];
};

const updateVoiceChannels = async () => {
  const deleteVC = [];
  for (const deletableChannel of deletableChannels) {
    const voiceChannel = client.channels
      .fetch(deletableChannel.id)
      .then(async (e) => {
        if (e.members.array().length === 0) {
          deleteVC.push(deletableChannel);
          await e.delete().catch(async () => {
            warnNonDeletableChannel(deletableChannel.channel, deletableChannel.channelName);
          });
        }
      })
      .catch(() => {
        deleteVC.push(deletableChannel);
        warnNonDeletableChannel(deletableChannel.channel, deletableChannel.channelName);
      });
    promises.push(voiceChannel);
  }
  await Promise.all(promises);

  promises = [];
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

setInterval(evaluateUpdates, UPDATE_INTERVAL_MS);

const shuffle = (array) => {
  const arrayToShuffle = array;
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);

    currentIndex--;

    temporaryValue = array[currentIndex];

    arrayToShuffle[currentIndex] = array[randomIndex];

    arrayToShuffle[randomIndex] = temporaryValue;
  }

  return arrayToShuffle;
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

const includesUserId = (array, userIdParam) => array.map((e) => e.id).includes(userIdParam);

const assignWinLoseDb = async (user, game, score) => {
  const storedUserDb = SixmanCollection.findOne({
    id: user.id
  })

  const channelPos = storedUserDb.servers.map((e) => e.channelID).indexOf(game.channelId);

  const sort = `servers.${channelPos}.${score}`;

  const mmr = `servers.${channelPos}.mmr`;

  await SixmanCollection.update({
    id: user.id,
  }, {
    $set: {
      [sort]: storedUserDb.servers[channelPos][score] + 1,
      [mmr]: score === WINS ? storedUserDb.servers[channelPos].mmr + 13 : storedUserDb.servers[channelPos].mmr - 10,
    },
  });
};


const revertGame = async (user, game, param, team) => {
  const storedUserDb = SixmanCollection.findOne({
    id: user.id
  })

  const channelPos = storedUsers.servers.map((e) => e.channelID).indexOf(game.channelID);

  const win = `servers.${channelPos}.wins`;

  const lose = `servers.${channelPos}.losses`;

  const winsOrLosses = game.winningTeam === 1 && team === TEAM1 || game.winningTeam === 2 && team === TEAM2 ? "wins" : "losses"

  const sort = `servers.${channelPos}.${winsOrLosses}`;

  const mmr = `servers.${channelPos}.mmr`;

  switch (param) {
    case "revert": {
      await SixmanCollection.update({
        id: user.id,
      }, {
        $set: {
          [win]: winsOrLosses === "wins" ? storedUserDb.servers[channelPos][winsOrLosses] + 1 : storedUserDb.servers[channelPos][winsOrLosses] - 1,

          [lose]: winsOrLosses === "losses" ?
            storedUserDb.servers[channelPos][winsOrLosses] + 1 : storedUserDb.servers[channelPos][winsOrLosses] - 1,

          [mmr]: status === "wins" ? storedUserDb.servers[channelPos].mmr + 23 : storedUserDb.servers[channelPos].mmr - 23,
        },
      });
    }
    case "cancel": {
      await SixmanCollection.update({
        id: user.id,
      }, {
        $set: {
          [sort]: storedUserDb.servers[channelPos][winsOrLosses] - 1,

          [mmr]: winsOrLosses === "wins" ? storedUserDb.servers[channelPos].mmr - 13 : storedUserDb.servers[channelPos].mmr + 10,
        },
      });
    }
    default:
      console.log("Invalid param");
  }
}

const assignWinLostOrRevert = async (game, param) => {
  for (let user of game.team1) {
    if (param === "Finished") {
      promises.push(assignWinLoseDb(user, game, game.winningTeam === 1 ? WINS : LOSSES));
    } else {
      promises.push(revertGame(game, param, TEAM1));
    }
  }
  for (let user of game.team2) {
    if (param === "Finished") {
      promises.push(assignWinLoseDb(user, game, game.winningTeam === 2 ? WINS : LOSSES));
    } else {
      promises.push(revertGame(user, game, param, TEAM2));
    }
  }
  await Promise.all(promises);
  promises = [];
};

const fetchFromID = async (id, wrongEmbedParam, messageParam) => {
  const user = await client.users.fetch(id).catch((error) => {
    wrongEmbedParam.setTitle("Please tag the user");
    console.log(error);
    messageParam.channel.send(wrongEmbedParam);
  });
  return user;
};

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg, fourthArg] = message.content.split(" ");

  const channelId = message.channel.id;

  const userId = message.author.id;

  if (!Object.keys(channelQueues).includes(channelId)) {
    channelQueues[channelId] = [];
  }

  const queueArray = channelQueues[channelId];

  const toAdd = {
    id: userId,
    name: message.author.username,
    date: new Date(),
  };

  const index = queueArray.map((e) => e.id).indexOf(userId);

  switch (args(message)) {
    case "leave": {
      if (queueArray.length === 6) {
        wrongEmbed.setTitle(":x: You can't leave now!");

        return message.channel.send(wrongEmbed);
      }

      if (index === -1) {
        wrongEmbed.setTitle(":x: You aren't in the queue!");

        return message.channel.send(wrongEmbed);
      }

      queueArray.splice(index, 1);

      correctEmbed.setTitle(`:white_check_mark: ${message.author.username} left the queue! ${queueArray.length}/6`);

      return message.channel.send(correctEmbed);
    }

    case "status": {
      correctEmbed.setTitle(`Players in queue: ${queueArray.length}`);

      correctEmbed.setDescription(queueArray.map((e) => e.name).join(", "));

      return message.channel.send(correctEmbed);
    }

    case "report": {
      const gameList = await fetchGames();

      if (!includesUserId(gameList.map((e) => e.players).flat(), userId)) {
        wrongEmbed.setTitle(":x: You aren't in a game!");

        return message.channel.send(wrongEmbed);
      }
      const games = gameList.find((game) => includesUserId(game.players, userId));

      if (games.channelID !== channelId) {
        wrongEmbed.setTitle(":x: This is not the correct channel to report the win/lose!");

        return message.channel.send(wrongEmbed);
      }

      games.winningTeam = games.team1.map(e => e.id).includes(userId) && messageEndswith(message) === "win" ? 1 : 2;

      const typeFunc = "Finished"

      await assignWinLostOrRevert(games, typeFunc);

      finishedGames.push(games);

      await OngoingGamesCollection.deleteOne({
        gamemode: "3v3",
        gameID: games.gameID
      });

      games.voiceChannelIds.forEach((channel) => {
        deletableChannels.push({
          channelName: channel.name,
          id: channel.id,
          channel: channel.channel,
        });
      })

      correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

      return message.channel.send(correctEmbed);
    }


    case "revertgame": {
      if (message.content.split(" ").length === 1 || message.content.split(" ").length === 2) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      if (!message.member.hasPermission("ADMINISTRATOR")) {
        wrongEmbed.setTitle(":x: You do not have Administrator permission!");

        return message.channel.send(wrongEmbed);
      }

      if (!finishedGames.map((e) => e.gameID).includes(Number(secondArg))) {
        wrongEmbed.setTitle(":x: No game with that ID has been played");

        return message.channel.send(wrongEmbed);
      }

      const selectedGame = finishedGames.find((e) => e.gameID === Number(secondArg));

      if (selectedGame.channelID !== channelId) {
        wrongEmbed.setTitle(":x: That game hasn't been played in this channel");

        return message.channel.send(wrongEmbed);
      }

      if (thirdArg === "revert " || thirdArg === "cancel") {
        await assignWinLostOrRevert(selectedGame, thirdArg);
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

      if (!includesUserId(gameList.map((e) => e.players).flat(), userId)) {
        wrongEmbed.setTitle(":x: You aren't in a game!");

        return message.channel.send(wrongEmbed);
      }
      const games = gameList.find((game) => includesUserId(game.players, userId));

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
        `:exclamation: ${message.author.username} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/4)`
      );

      message.channel.send(correctEmbed);

      if (cancelqueuearray.length === 4) {
        games.voiceChannelIds.forEach((channel) => {
          deletableChannels.push({
            channelName: channel.name,
            id: channel.id,
            channel: channel.channel,
          });
        });

        correctEmbed.setTitle(`:white_check_mark: Game ${games.gameID} Cancelled!`);

        cancelQueue[IDGame] = [];

        await OngoingGamesCollection.deleteOne({
          gamemode: "3v3",
          gameID: IDGame
        });

        return message.channel.send(correctEmbed);
      }

      break;
    }

    case "score": {
      switch (secondArg) {
        case "me": {
          await SixmanCollection.findOne({
            id: userId,
            servers: {
              $elemMatch: {
                channelID: channelId,
              },
            },
          }).then((storedUsers) => {
            if (storedUsers.length === 0) {
              wrongEmbed.setTitle(":x: You haven't played any games yet!");

              return message.channel.send(wrongEmbed);
            }

            const scoreDirectory = storedUsers.servers[storedUsers.servers.map((e) => e.channelID).indexOf(channelId)];

            correctEmbed.addField("Wins:", scoreDirectory.wins);

            correctEmbed.addField("Losses:", scoreDirectory.losses);

            correctEmbed.addField(
              "Winrate:",
              Number.isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)) ?
              "0%" :
              `${Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)}%`
            );

            correctEmbed.addField("MMR:", scoreDirectory.mmr);

            return message.channel.send(correctEmbed);
          });
          break;
        }
        case "channel": {
          const getScore = async (id, arg) => {
            await SixmanCollection.find({
              servers: {
                $elemMatch: {
                  channelID: id,
                },
              },
            }).then(async (storedUsers) => {
              const storedUsersList = storedUsers.filter(
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

              if (storedUsersList.length === 0) {
                wrongEmbed.setTitle(":x: No games have been played in here!");

                return message.channel.send(wrongEmbed);
              }

              storedUsersList.sort((a, b) => {
                const indexA = a.servers.map((e) => e.channelID).indexOf(id);

                const indexB = b.servers.map((e) => e.channelID).indexOf(id);

                return b.servers[indexB].mmr - a.servers[indexA].mmr;
              });

              if (!Number.isNaN(arg) && arg > 0) {
                let indexes = 20 * (arg - 1);
                for (indexes; indexes < 20 * arg; indexes++) {
                  if (storedUsersList[indexes] == null) {
                    correctEmbed.addField("No more members to list in this page!", "Encourage your friends to play!");

                    break;
                  }
                  for (const servers of storedUsersList[indexes].servers) {
                    if (servers.channelID === id) {
                      correctEmbed.addField(
                        // eslint-disable-next-line no-await-in-loop
                        (await fetchFromID(storedUsersList[indexes].id), wrongEmbed, message).username,
                        `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${
                          Number.isNaN(Math.floor((servers.wins / (servers.wins + servers.losses)) * 100))
                            ? "0"
                            : Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)
                        }% | MMR: ${servers.mmr}`
                      );

                      correctEmbed.setFooter(`Showing page ${arg}/${Math.ceil(storedUsersList.length / 20)}`);
                    }
                  }
                }
              } else {
                for (let i = 0; i < 20; i++) {
                  if (storedUsersList[i] == null) {
                    correctEmbed.addField("No more members to list in this page!", "Encourage your friends to play!");
                    break;
                  }
                  for (const servers of storedUsersList[i].servers) {
                    if (servers.channelID === id) {
                      correctEmbed.addField(
                        // eslint-disable-next-line no-await-in-loop
                        (await fetchFromID(storedUsersList[i].id), wrongEmbed, message).username,
                        `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${
                          Number.isNaN(Math.floor((servers.wins / (servers.wins + servers.losses)) * 100))
                            ? "0"
                            : Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)
                        }% | MMR: ${servers.mmr}`
                      );

                      correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(storedUsersList.length / 20)}`);
                    }
                  }
                }
              }
              return message.channel.send(correctEmbed);
            });
          };

          if (!Number.isNaN(thirdArg) && Number(thirdArg) > 10000) {
            return getScore(thirdArg, fourthArg);
          }
          return getScore(channelId, thirdArg);
        }
        default: {
          wrongEmbed.setTitle("Invalid Parameters");

          message.channel.send(wrongEmbed);
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

        const game = games[i];

        if (game == null) {
          correctEmbed.addField("No more games to list ", "Encourage your friends to play!");
          break;
        }

        if (game.channelID === channelId) {
          correctEmbed.addField("Game ID:", ` ${game.gameID}`);

          correctEmbed.addField(
            ":small_orange_diamond: -Team 1-",
            `<@${game.players[0].id}>, <@${game.players[1].id}>, <@${game.players[2].id}>`
          );
          correctEmbed.addField(
            ":small_blue_diamond: -Team 2-",
            ` <@${game.players[3].id}>, <@${game.players[4].id}>, <@${game.players[5].id}>`
          );

          correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(games.length / 20)}`);
        }
      }
      return message.channel.send(correctEmbed);
    }

    case "reset": {
      if (message.content.split(" ").length === 1) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      if (!message.member.hasPermission("ADMINISTRATOR")) {
        wrongEmbed.setTitle(":x: You do not have Administrator permission!");

        return message.channel.send(wrongEmbed);
      }

      switch (secondArg) {
        case "channel": {
          const fetchGamesByChannelId = await OngoingGamesCollection.findOne({
            gamemode: "3v3",
            channelID: channelId
          });

          if (fetchGamesByChannelId.length !== 0) {
            wrongEmbed.setTitle(":x: There are users in game!");

            return message.channel.send(wrongEmbed);
          }

          if (message.content.split(" ").length !== 2) {
            wrongEmbed.setTitle(":x: Invalid Parameters!");

            return message.channel.send(wrongEmbed);
          }

          await SixmanCollection.find({
            servers: {
              $elemMatch: {
                channelID: channelId,
              },
            },
          }).then(async (storedUsers) => {
            for (const user of storedUsers) {
              const channelPos = user.servers
                .map((e) => e)
                .map((e) => e.channelID)
                .indexOf(channelId);

              if (channelPos !== -1) {
                SixmanCollection.update({
                  id: user.id,
                }, {
                  $pull: {
                    servers: {
                      channelID: channelId,
                    },
                  },
                });
              }
            }
          });

          for (const game of finishedGames) {
            if (game.channelID === channelId) {
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

          const player = await SixmanCollection.findOne({
            id: thirdArg
          });

          if (player.length === 0) {
            wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!");

            return message.channel.send(wrongEmbed);
          }

          await SixmanCollection.update({
            id: thirdArg,
          }, {
            $pull: {
              servers: {
                channelID: channelId,
              },
            },
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

      if (includesUserId(Object.values(channelQueues).flat(), userId)) {
        const channelQueued = (
          await client.channels.fetch(Object.keys(channelQueues).find((e) => includesUserId(channelQueues[e], userId)))
        ).name;
        wrongEmbed.setTitle(`:x: You're already queued in the channel ${channelQueued}!`);

        return message.channel.send(wrongEmbed);
      }

      if (includesUserId((await fetchGames()).map((e) => e.players).flat(), userId)) {
        wrongEmbed.setTitle(":x: You are in the middle of a game!");

        return message.channel.send(wrongEmbed);
      }

      if (queueArray.length > 5) {
        wrongEmbed.setTitle(":x: Please wait for the next game to be decided!");

        return message.channel.send(wrongEmbed);
      }

      queueArray.push(toAdd);

      correctEmbed.setTitle(`:white_check_mark: Added to queue! ${queueArray.length}/6`);

      message.channel.send(correctEmbed);

      if (queueArray.length === 6) {
        gameCount++;

        const gameCreatedObj = {
          gamemode: "3v3",
          gameID: gameCount,
          time: new Date(),
          channelID: channelId,
          team1: [],
          team2: [],
          voiceChannelIds: [],
        };

        for (const user of queueArray) {
          const dbRequest = SixmanCollection.findOne({
            id: user.id,
          }).then(async (storedUser) => {
            if (storedUser == null) {
              const newUser = {
                id: user.id,
                name: user.name,
                servers: [{
                  channelID: channelId,
                  wins: 0,
                  losses: 0,
                  mmr: 1000,
                }, ],
              };

              const sixmanInsert = new SixmanCollection(newUser);

              await sixmanInsert.save();
            } else if (!storedUser.servers.map((e) => e.channelID).includes(channelId)) {
              await SixmanCollection.update({
                id: user.id,
              }, {
                $push: {
                  servers: {
                    channelID: channelId,
                    wins: 0,
                    losses: 0,
                    mmr: 1000,
                  },
                },
              });
            }
          });
          promises.push(dbRequest);
        }
        await Promise.all(promises);

        promises = [];

        const valuesforpm = {
          name: Math.floor(Math.random() * 99999) + 100,
          password: Math.floor(Math.random() * 99999) + 100,
        };

        await message.channel.send(
          `<@${queueArray[0].id}>, <@${queueArray[1].id}>, <@${queueArray[2].id}>, <@${queueArray[3].id}>, <@${queueArray[4].id}>, <@${queueArray[5].id}>`
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
          const captainsObject = {
            captain1: null,
            captain2: null,
            team1: [],
            team2: [],
            usedNums: []
          }

          const queueArrayCopy = [...queueArray]

          shuffle(queueArrayCopy);

          captainsObject.captain1 = queueArrayCopy[0];

          captainsObject.captain2 = queueArrayCopy[1];

          queueArrayCopy.splice(0,2)

          const CaptainsEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle(`Game ID: ${gameCreatedObj.gameID}`)
            .addField("Captain for team 1", queueArrayCopy[0].name)
            .addField("Captain for team 2", queueArrayCopy[1].name);

          message.channel.send(CaptainsEmbed);

          const privateDmCaptain1 = await client.users
            .fetch(captainsObject.captain1.id)
            .catch(() => message.channel.send("Invalid captain"));

          const privateDmCaptain2 = await client.users
            .fetch(captainsObject.captain2.id)
            .catch(() => message.channel.send("Invalid captain"));

          let queueArrayCopyLength = queueArrayCopy.length;

          while (queueArrayCopyLength > 0) {
            const Captain1Embed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle("Choose one ( you have 40 seconds):")
              for(let k=0;k<i;k++) {
                Captain1Dm.addField(`${queueArrayCopyLength+1} :`, queueArrayCopy[queueArrayCopyLength].name)
              }

              privateDmCaptain1.send(Captain1Embed).catch((error) => {
              const errorEmbed = new Discord.MessageEmbed()
                .setColor(EMBED_COLOR_WARNING)
                .setTitle(
                  `:x: Couldn't sent message to ${privateDmCaptain1.username}, please check if your DM'S aren't set to friends only.`
                );

              console.error(error);

              message.channel.send(errorEmbed);
            });

            filter = (m) => !Number.isNaN(m.content) && Number(m.content) > 0 && Number(m.content) < queueArrayCopyLength+1;

            await privateDmCaptain1
              .createDM()
              .then((m1) => {
                m1.createMessageCollector(filter, {
                  time: 40000,
                }).on("collect", (m) => {
                  const parsedM = Number(m.content) - 1;

                  if (!hasVoted) {
                    captainsObject.team1.push(queueArrayCopy[parsedM]);

                    queueArrayCopy.splice(parsedM, 1);

                    hasVoted = true;
                  }
                });
              })
              .catch((e) => {
                console.log(e);
              });

            await new Promise((resolve) => setTimeout(resolve, 40000));

            if (!hasVoted) {
              const randomnumber = Math.floor(Math.random() * queueArrayCopyLength - 2); //dunno if its correc

              captainsObject.team1.push(queueArrayCopy[randomnumber]);

              queueArrayCopy.splice(randomnumber, 1);
            }

            hasVoted = false;

            const Captain2Embed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle("Choose two( you have 40 seconds):")
              for(let k=0;k<i;k++) {
                Captain2Embed.addField(`${queueArrayCopyLength+1} :`, queueArrayCopy[queueArrayCopyLength].name)
              }
//check after this
            Captain2Dm.send(Captain2Embed).catch((error) => {
              const errorEmbed = new Discord.MessageEmbed()
                .setColor(EMBED_COLOR_WARNING)
                .setTitle(
                  `:x: Couldn't sent message to ${privatedm1.username}, please check if your DM'S aren't set to friends only.`
                );

              console.error(error);

              message.channel.send(errorEmbed);
            });

            filter = (m) => !Number.isNaN(m.content) && Number(m.content) > 0 && Number(m.content) < 4;

            privatedm1
              .createDM()
              .then((m1) => {
                m1.createMessageCollector(filter, {
                  time: 40000,
                }).on("collect", (m) => {
                  const parsedM = Number(m) - 1;

                  if (!hasVoted) {
                    queueArray[4] = queueArrayCopy[parsedM];

                    hasVoted = true;

                    gameCountNums.push(parsedM);
                  } else if (hasVoted && !gameCountNums.includes(parsedM) && hasVoted !== "all") {
                    queueArray[5] = queueArrayCopy[parsedM];

                    hasVoted = "all";

                    gameCountNums.push(parsedM);

                    queueArrayCopy.splice(gameCountNums[0], 1);

                    if (gameCountNums[1] > gameCountNums[0]) {
                      queueArrayCopy.splice(gameCountNums[1] - 1, 1);
                    } else {
                      queueArrayCopy.splice(gameCountNums[1], 1);
                    }
                  }
                });
              })
              .catch(() => {
                console.error("Error creating DM");
              });

            await new Promise((resolve) => setTimeout(resolve, 40000));

            const randomnumber = Math.floor(Math.random() * 3);

            let randomnumber2 = Math.floor(Math.random() * 3);

            if (!hasVoted) {
              while (randomnumber === randomnumber2) {
                randomnumber2 = Math.floor(Math.random() * 3);
              }

              queueArray[4] = queueArrayCopy[randomnumber];

              queueArray[5] = queueArrayCopy[randomnumber2];

              queueArrayCopy.splice(randomnumber, 1);

              if (randomnumber2 > randomnumber) {
                queueArrayCopy.splice(randomnumber2 - 1, 1);
              } else {
                queueArrayCopy.splice(randomnumber2, 1);
              }
            } else if (hasVoted && hasVoted !== "all") {
              while (gameCountNums.includes(randomnumber2)) {
                randomnumber2 = Math.floor(Math.random() * 2);
              }

              queueArray[5] = queueArrayCopy[randomnumber2];

              queueArrayCopy.splice(gameCountNums[0], 1);

              if (randomnumber2 > gameCountNums[0]) {
                queueArrayCopy.splice(randomnumber2 - 1, 1);
              } else {
                queueArrayCopy.splice(randomnumber2, 1);
              }
            }

            hasVoted = false;

            queueArray[2] = queueArrayCopy[0];

            queueArrayCopy.splice(0, queueArrayCopy.length);

            gameCountNums.splice(0, gameCountNums.length);
          }

          captainsObject.team1.push(captainsObject.captain1);

          captainsObject.team2.push(captainsObject.captain2);
        }
//only works in captain mode, change to allow both
        for (let i = 0; i < 3; i++) {
          gameCreatedObj.team1.push(captainsObject.team1);
        }

        for (let i = 3; i < 6; i++) {
          gameCreatedObj.team2.push(captainsObject);
        }

        const orangeTeamVc = await message.guild.channels
          .create(`🔸Team-1-Game-${gameCreatedObj.gameID}`, {
            type: "voice",
            parent: message.channel.parentID,
            permissionOverwrites: [{
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
            ],
          })
          .catch(() =>
            message.channel.send("Error creating voice channels, are you sure the bot has permissions to do so?")
          );

        gameCreatedObj.voiceChannelIds.push({
          id: orangeTeamVc.id,
          channelName: `🔸Team-1-Game-${gameCreatedObj.gameID}`,
          channel: channelId,
        });

        const blueTeamVc = await message.guild.channels
          .create(`🔹Team-2-Game-${gameCreatedObj.gameID}`, {
            type: "voice",
            parent: message.channel.parentID,
            permissionOverwrites: [{
                id: message.guild.id,
                deny: "CONNECT",
              },
              {
                id: gameCreatedObj.players[3].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[4].id,
                allow: "CONNECT",
              },
              {
                id: gameCreatedObj.players[5].id,
                allow: "CONNECT",
              },
            ],
          })
          .catch(() =>
            message.channel.send("Error creating voice channels, are you sure the bot has permissions to do so?")
          );

        gameCreatedObj.voiceChannelIds.push({
          id: blueTeamVc.id,
          channelName: `🔹Team-2-Game-${gameCreatedObj.gameID}`,
          channel: channelId,
        });

        const ongoingGamesInsert = new OngoingGamesCollection(gameCreatedObj);

        await ongoingGamesInsert.save();

        const discordEmbed1 = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .addField("Game is ready:", `Game ID is: ${gameCreatedObj.gameID}`)
          .addField(
            ":small_orange_diamond: -Team 1-",
            `${gameCreatedObj.players[0].name}, ${gameCreatedObj.players[1].name}, ${gameCreatedObj.players[2].name}`
          )
          .addField(
            ":small_blue_diamond: -Team 2-",
            `${gameCreatedObj.players[3].name}, ${gameCreatedObj.players[4].name}, ${gameCreatedObj.players[5].name}`
          );
        message.channel.send(discordEmbed1);

        const JoinMatchEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .addField("Name:", valuesforpm.name)
          .addField("Password:", valuesforpm.password)
          .addField("You have to:", `Join match(Created by ${gameCreatedObj.players[0].name})`);

        for (const users of gameCreatedObj.players) {
          if (users.id !== gameCreatedObj.players[0].id) {
            const fetchedUser = client.users
              .fetch(users.id)
              .then(async (user) => {
                try {
                  await user.send(JoinMatchEmbed);
                } catch (error) {
                  const errorEmbed = new Discord.MessageEmbed()
                    .setColor(EMBED_COLOR_WARNING)
                    .setTitle(
                      `:x: Couldn't sent message to ${users.name}, please check if your DM'S aren't set to friends only.`
                    );

                  console.error(error);

                  message.channel.send(errorEmbed);
                }
              })
              .catch(() => message.channel.send("Invalid User"));
            promises.push(fetchedUser);
          }
        }

        await Promise.all(promises);

        promises = [];

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

        queueArray.splice(0, queueArray.length);
      }
      break;
    }
    default: {
      console.log("Wat");
    }
  }
  return null;
};

module.exports = {
  name: ["q", "status", "leave", "report", "score", "cancel", "reset", "r", "c", "revertgame", "ongoinggames"],
  description: "6man bot",
  execute,
};