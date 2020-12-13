const Discord = require("discord.js");

const client = require("../utils/client.js");

const MongoDB = require("../utils/mongodb");

const db = MongoDB.getDB();

const dbCollection = db.collection("sixman");

const tempObject = {};

const rc = ["r", "c"];

const EMBED_COLOR_ERROR = "#F8534F";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#77B255";

const MAX_USER_IDLE_TIME_MS = 45 * 60 * 1000;

const MAX_GAME_LENGTH_MS = 3 * 60 * 60 * 1000;

const UPDATE_INTERVAL_MS = 60 * 1000;

const ongoingGames = [];

const finishedGames = [];

const usedNums = [];

const deletableChannels = [];

const channelQueues = {};

const cancelQueue = {};

let gameCount = 0;

let hasVoted = false;

const updateUsers = async () => {
  const currentTimeMS = Date.now();

  for (const channelUsers of Object.values(channelQueues).filter(
    (channel) => channel.length < 6
  )) {
    for (const user of channelUsers.filter(
      (user1) => currentTimeMS - user1.date > MAX_USER_IDLE_TIME_MS
    )) {
      const notifyChannel = await client.channels.fetch(
        Object.keys(channelQueues).find(
          (key) => channelQueues[key] === channelUsers
        )
      );
      const embedRemove = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_WARNING)
        .setTitle(
          "You were removed from the queue after no game has been made in 45 minutes!"
        );

      await notifyChannel.send(`<@${user.id}>`, embedRemove);
      channelUsers.splice(channelUsers.indexOf(user), 1);
    }
  }
};

const updateOngoingGames = async () => {
  const currentTimeMS = Date.now();

  for (const game of ongoingGames.filter(
    (game1) => currentTimeMS - game1[6].time > MAX_GAME_LENGTH_MS
  )) {
    const channels = await client.channels
      .fetch(game[6].channelID)
      .then((e) => e.guild.channels.cache.array());

    for (const channel of channels) {
      if (channel.name === `🔸Team-1-Game-${game[6].gameID}`) {
        await channel.delete();
        // delete the channel in deletablechannels
      }

      if (channel.name === `🔹Team-2-Game-${game[6].gameID}`) {
        await channel.delete();
      }
    }

    const notifyChannel = await client.channels.fetch(game[6].channel);
    const embedRemove = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_WARNING)
      .setTitle(
        `:white_check_mark: Game ${game[6].gameID} Cancelled due to not being finished in 3 Hours!`
      );

    await notifyChannel.send(embedRemove);
    ongoingGames.splice(ongoingGames.indexOf(game), 1);
  }
};

const updateVoiceChannels = async () => {
  for (const deletableChannel of deletableChannels) {
    const voiceChannel = await client.channels
      .fetch(deletableChannel.channel)
      .then((e) =>
        e.guild.channels.cache
          .array()
          .find((channel) => channel.id === deletableChannel.id)
      );

    if (voiceChannel) {
      if (voiceChannel.members.array().length === 0) {
        await voiceChannel.delete().catch( async () => {
          const notifyChannel = await client.channels.fetch(deletableChannel.channel);
          const embedRemove = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle(
              `Unable to delete voice channel ${deletableChannel.gameID}, please delete it manually.`
            );
            await notifyChannel.send(embedRemove);
            deletableChannels.splice(deletableChannels.indexOf(deletableChannel), 1);
        });
        deletableChannels.splice(
          deletableChannels.indexOf(deletableChannel),1
        );
      }

      continue;
    } else {
      const notifyChannel = await client.channels.fetch(deletableChannel.channel);
      const embedRemove = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_WARNING)
        .setTitle(
          `Unable to delete voice channel ${deletableChannel.gameID}, please delete it manually.`
        );
        await notifyChannel.send(embedRemove);
        deletableChannels.splice(deletableChannels.indexOf(deletableChannel), 1);
    }
  }
};

const evaluateUpdates = async () => {
  if (Object.entries(channelQueues).length !== 0) {
    await updateUsers();
  }
  if (ongoingGames.length !== 0) {
    await updateOngoingGames();
  }

  await updateVoiceChannels();
  console.log(channelQueues)
};

setInterval(evaluateUpdates, UPDATE_INTERVAL_MS);

const shuffle = (array) => {
  let currentIndex = array.length;
  let temporaryValue, randomIndex;

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

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const secondArg = message.content.split(" ")[1];

  const thirdArg = message.content.split(" ")[2];

  const fourthArg = message.content.split(" ")[3];

  const channel_ID = message.channel.id;

  const userId = message.author.id;

  const includesUserID = (array) => array.map((e) => e.id).includes(userId);

  const givewinLose = async (score, i) => {
    const games = ongoingGames.find((game) =>
      game.map((e) => e.id).includes(userId)
    );

    const userid = games[i].id;

    await dbCollection
      .find({
        id: userid,
      })
      .toArray()
      .then(async (storedUsers) => {
        const channelPos = storedUsers[0].servers
          .map((e) => e.channelID)
          .indexOf(channel_ID);

        const sort = `servers.${channelPos}.${score}`;

        const mmr = `servers.${channelPos}.mmr`;

        await dbCollection.update(
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
    const games = finishedGames.find(
      (game) => game[6].gameID === parseInt(secondArg)
    );

    const userid = games[i].id;

    await dbCollection
      .find({
        id: userid,
      })
      .toArray()
      .then(async (storedUsers) => {
        const channelPos = storedUsers[0].servers
          .map((e) => e.channelID)
          .indexOf(channel_ID);

        const win = `servers.${channelPos}.wins`;

        const lose = `servers.${channelPos}.losses`;

        const sort = `servers.${channelPos}.${status}`;

        const mmr = `servers.${channelPos}.mmr`;

        if (thirdArg === "revert") {
          await dbCollection.update(
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
          await dbCollection.update(
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

  if (!Object.keys(channelQueues).includes(channel_ID)) {
    channelQueues[channel_ID] = [];
  }

  const fetchFromID = async (id) => {
    return await client.users.fetch(id).catch((error) => {
      wrongEmbed.setTitle("Please tag the user");
      console.log(error);
      message.channel.send(wrongEmbed);
    });
  };

  const queueArray = channelQueues[channel_ID];

  const toAdd = {
    id: userId,
    name: message.author.username,
    date: new Date(),
  };

  const index = queueArray.map((e) => e.id).indexOf(userId);

  switch (args(message)) {
    case "leave": {
      for (const captainGames of Object.values(tempObject).flat()) {
        if (includesUserID(captainGames)) {
          wrongEmbed.setTitle(":x: You can't leave now!");

          return message.channel.send(wrongEmbed);
        }
      }
      if (queueArray.length === 6) {
        wrongEmbed.setTitle(":x: You can't leave now!");

        return message.channel.send(wrongEmbed);
      }

      if (index === -1) {
        wrongEmbed.setTitle(":x: You aren't in the queue!");

        return message.channel.send(wrongEmbed);
      }

      queueArray.splice(index, 1);

      correctEmbed.setTitle(
        `:white_check_mark: ${message.author.username} left the queue! ${queueArray.length}/6`
      );

      return message.channel.send(correctEmbed);
    }

    case "status": {
      correctEmbed.setTitle(`Players in queue: ${queueArray.length}`);

      correctEmbed.setDescription(queueArray.map((e) => e.name).join(", "));

      return message.channel.send(correctEmbed);
    }

    case "report": {
      switch (messageEndswith(message)) {
        case "win": {
          if (
            !includesUserID(ongoingGames.flat()) ||
            ongoingGames.length === 0
          ) {
            wrongEmbed.setTitle(":x: You aren't in a game!");

            return message.channel.send(wrongEmbed);
          }

          const games = ongoingGames.find((game) => includesUserID(game));

          if (games[6].channelID !== channel_ID) {
            wrongEmbed.setTitle(
              ":x: This is not the correct channel to report the win/lose!"
            );

            return message.channel.send(wrongEmbed);
          }

          const indexplayer = games.map((e) => e.id).indexOf(userId);

          if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2) {
            for (let i = 0; i < 3; i++) {
              givewinLose("wins", i);
            }
            for (let i = 3; i < 6; i++) {
              givewinLose("losses", i);
            }
          }

          if (indexplayer === 3 || indexplayer === 4 || indexplayer === 5) {
            for (let i = 3; i < 6; i++) {
              givewinLose("wins", i);
            }
            for (let i = 0; i < 3; i++) {
              givewinLose("losses", i);
            }
          }

          games[6].winningTeam =
            indexplayer === 0 || indexplayer === 1 || indexplayer === 2 ? 0 : 1;

          finishedGames.push(games);

          const indexGame = ongoingGames.indexOf(games);

          ongoingGames.splice(indexGame, 1);

          for (const channel of message.guild.channels.cache.array()) {
            if (channel.name === `🔸Team-1-Game-${games[6].gameID}`) {
              deletableChannels.push({
                gameID: `🔸Team-1-Game-${games[6].gameID}`,
                id: channel.id,
                channel: message.channel.id,
              });
            }

            if (channel.name === `🔹Team-2-Game-${games[6].gameID}`) {
              deletableChannels.push({
                gameID: `🔹Team-2-Game-${games[6].gameID}`,
                id: channel.id,
                channel: message.channel.id,
              });
            }
          }

          correctEmbed.setTitle(
            ":white_check_mark: Game Completed! Thank you for Playing!"
          );

          return message.channel.send(correctEmbed);
        }

        case "lose": {
          if (
            !includesUserID(ongoingGames.flat()) ||
            ongoingGames.length === 0
          ) {
            wrongEmbed.setTitle(":x: You aren't in a game!");

            return message.channel.send(wrongEmbed);
          }

          const games = ongoingGames.find((game) => includesUserID(game));

          if (games[6].channelID !== channel_ID) {
            wrongEmbed.setTitle(
              ":x: This is not the correct channel to report the win/lose!"
            );

            return message.channel.send(wrongEmbed);
          }

          const indexplayer = games.map((e) => e.id).indexOf(userId);

          if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2) {
            for (let i = 0; i < 3; i++) {
              givewinLose("losses");
            }
            for (let i = 3; i < 6; i++) {
              givewinLose("wins");
            }
          }

          if (indexplayer === 3 || indexplayer === 4 || indexplayer === 5) {
            for (let i = 3; i < 6; i++) {
              givewinLose("losses");
            }
            for (let i = 0; i < 3; i++) {
              givewinLose("wins");
            }
          }

          games[6].winningTeam =
            indexplayer === 0 || indexplayer === 1 || indexplayer === 2 ? 0 : 1;

          finishedGames.push(games);

          const indexGame = ongoingGames.indexOf(games);

          ongoingGames.splice(indexGame, 1);

          for (const channel of message.guild.channels.cache.array()) {
            if (channel.name === `🔸Team-1-Game-${games[6].gameID}`) {
              deletableChannels.push({
                gameID: `🔸Team-1-Game-${games[6].gameID}`,
                id: channel.id,
                channel: message.channel.id,
              });
            }

            if (channel.name === `🔹Team-2-Game-${games[6].gameID}`) {
              deletableChannels.push({
                gameID: `🔹Team-2-Game-${games[6].gameID}`,
                id: channel.id,
                channel: message.channel.id,
              });
            }
          }

          correctEmbed.setTitle(
            ":white_check_mark: Game Completed! Thank you for Playing!"
          );

          return message.channel.send(correctEmbed);
        }
        default: {
          wrongEmbed.setTitle(":x: Invalid Parameters!");
          return message.channel.send(wrongEmbed);
        }
      }
    }

    case "revertgame": {
      if (
        message.content.split(" ").length == 1 ||
        message.content.split(" ").length == 2
      ) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      if (!message.member.hasPermission("ADMINISTRATOR")) {
        wrongEmbed.setTitle(":x: You do not have Administrator permission!");

        return message.channel.send(wrongEmbed);
      }

      if (
        !finishedGames.map((e) => e[6].gameID).includes(parseInt(secondArg))
      ) {
        wrongEmbed.setTitle(":x: No game with that ID has been played");

        return message.channel.send(wrongEmbed);
      }

      const selectedGame = finishedGames.find(
        (e) => e[6].gameID === parseInt(secondArg)
      );

      if (selectedGame[6].channelID !== channel_ID) {
        wrongEmbed.setTitle(":x: That game hasn't been played in this channel");

        return message.channel.send(wrongEmbed);
      }

      if (thirdArg === "revert") {
        if (selectedGame[6].winningTeam === 0) {
          for (let i = 0; i < 3; i++) {
            revertgame("losses", i);
          }
          for (let i = 3; i < 6; i++) {
            revertgame("wins", i);
          }
        } else {
          for (let i = 3; i < 6; i++) {
            revertgame("losses", i);
          }
          for (let i = 0; i < 3; i++) {
            revertgame("wins", i);
          }
        }
      } else if (thirdArg === "cancel") {
        if (selectedGame[6].winningTeam === 0) {
          for (let i = 0; i < 3; i++) {
            revertgame("wins", i);
          }
          for (let i = 3; i < 6; i++) {
            revertgame("losses", i);
          }
        } else {
          for (let i = 3; i < 6; i++) {
            revertgame("wins", i);
          }
          for (let i = 0; i < 3; i++) {
            revertgame("losses", i);
          }
        }
      } else {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      const indexSelectedGame = finishedGames.indexOf(selectedGame);

      finishedGames.splice(indexSelectedGame, 1);

      correctEmbed.setTitle(
        `:white_check_mark: Game ${
          thirdArg === "revert" ? "reverted" : "cancelled"
        }!`
      );

      return message.channel.send(correctEmbed);
    }

    case "cancel": {
      if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {
        wrongEmbed.setTitle(":x: You aren't in a game!");

        return message.channel.send(wrongEmbed);
      }

      const games = ongoingGames.find((game) => includesUserID(game));

      const IDGame = games[6].gameID;

      const indexUser = games.map((e) => e.id).indexOf(userId);

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
        `:exclamation: ${games[indexUser].name} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/4)`
      );

      message.channel.send(correctEmbed);

      if (cancelqueuearray.length === 4) {
        for (const channel of message.guild.channels.cache.array()) {
          if (channel.name === `🔸Team-1-Game-${games[6].gameID}`) {
            channel.delete();
          }

          if (channel.name === `🔹Team-2-Game-${games[6].gameID}`) {
            channel.delete();
          }
        }

        correctEmbed.setTitle(
          `:white_check_mark: Game ${games[6].gameID} Cancelled!`
        );

        const indexGame = ongoingGames.indexOf(games);

        cancelQueue[IDGame] = [];

        ongoingGames.splice(indexGame, 1);

        return message.channel.send(correctEmbed);
      }

      break;
    }

    case "score": {
      switch (secondArg) {
        case "me": {
          await dbCollection
            .find({
              id: userId,
              servers: {
                $elemMatch: {
                  channelID: channel_ID,
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
                storedUsers[0].servers[
                  storedUsers[0].servers
                    .map((e) => e.channelID)
                    .indexOf(message.channel.id)
                ];

              correctEmbed.addField("Wins:", scoreDirectory.wins);

              correctEmbed.addField("Losses:", scoreDirectory.losses);

              correctEmbed.addField(
                "Winrate:",
                isNaN(
                  Math.floor(
                    (scoreDirectory.wins /
                      (scoreDirectory.wins + scoreDirectory.losses)) *
                      100
                  )
                )
                  ? "0%"
                  : Math.floor(
                      (scoreDirectory.wins /
                        (scoreDirectory.wins + scoreDirectory.losses)) *
                        100
                    ) + "%"
              );

              correctEmbed.addField("MMR:", scoreDirectory.mmr);

              return message.channel.send(correctEmbed);
            });
          break;
        }
        case "channel": {
          const getScore = async (id, arg) => {
            await dbCollection
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
                    a.servers[a.servers.map((e) => e.channelID).indexOf(id)]
                      .wins +
                      a.servers[a.servers.map((e) => e.channelID).indexOf(id)]
                        .losses !==
                      0
                );

                if (
                  !message.guild.channels.cache
                    .array()
                    .map((e) => e.id)
                    .includes(id)
                ) {
                  wrongEmbed.setTitle(
                    ":x: This channel does not belong to this server!"
                  );

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
                      correctEmbed.addField(
                        "No more members to list in this page!",
                        "Encourage your friends to play!"
                      );

                      break;
                    }
                    for (const servers of storedUsers[indexes].servers) {
                      if (servers.channelID === id) {
                        correctEmbed.addField(
                          (await fetchFromID(storedUsers[indexes].id)).username,
                          `Wins: ${servers.wins} | Losses: ${
                            servers.losses
                          } | Winrate: ${
                            isNaN(
                              Math.floor(
                                (servers.wins /
                                  (servers.wins + servers.losses)) *
                                  100
                              )
                            )
                              ? "0"
                              : Math.floor(
                                  (servers.wins /
                                    (servers.wins + servers.losses)) *
                                    100
                                )
                          }% | MMR: ${servers.mmr}`
                        );

                        correctEmbed.setFooter(
                          `Showing page ${arg}/${Math.ceil(
                            storedUsers.length / 20
                          )}`
                        );
                      }
                    }
                  }
                } else {
                  for (let i = 0; i < 20; i++) {
                    if (storedUsers[i] == undefined) {
                      correctEmbed.addField(
                        "No more members to list in this page!",
                        "Encourage your friends to play!"
                      );
                      break;
                    }
                    for (const servers of storedUsers[i].servers) {
                      if (servers.channelID === id) {
                        correctEmbed.addField(
                          (await fetchFromID(storedUsers[i].id)).username,
                          `Wins: ${servers.wins} | Losses: ${
                            servers.losses
                          } | Winrate: ${
                            isNaN(
                              Math.floor(
                                (servers.wins /
                                  (servers.wins + servers.losses)) *
                                  100
                              )
                            )
                              ? "0"
                              : Math.floor(
                                  (servers.wins /
                                    (servers.wins + servers.losses)) *
                                    100
                                )
                          }% | MMR: ${servers.mmr}`
                        );

                        correctEmbed.setFooter(
                          `Showing page ${1}/${Math.ceil(
                            storedUsers.length / 20
                          )}`
                        );
                      }
                    }
                  }
                }
                return message.channel.send(correctEmbed);
              });
          };

          if (!isNaN(thirdArg) && parseInt(thirdArg) > 10000) {
            return getScore(thirdArg, fourthArg);
          } else {
            return getScore(channel_ID, thirdArg);
          }
        }
      }
      break;
    }

    case "ongoinggames": {
      if (ongoingGames.length === 0) {
        wrongEmbed.setTitle(":x: No games are currently having place!");

        return message.channel.send(wrongEmbed);
      }

      for (let i = 0; i < 6; i++) {
        // change it to allow more games
        const game = ongoingGames[i];

        if (game == undefined) {
          correctEmbed.addField(
            "No more games to list ",
            "Encourage your friends to play!"
          );
          break;
        }

        if (game[6].channelID === channel_ID) {
          correctEmbed.addField("Game ID:", ` ${game[6].gameID}`);

          correctEmbed.addField(
            ":small_orange_diamond: -Team 1-",
            `<@${game[0].id}>, <@${game[1].id}>, <@${game[2].id}>`
          );
          correctEmbed.addField(
            ":small_blue_diamond: -Team 2-",
            ` <@${game[3].id}>, <@${game[4].id}>, <@${game[5].id}>`
          );

          correctEmbed.setFooter(
            `Showing page ${1}/${Math.ceil(ongoingGames.length / 20)}`
          );
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
          if (
            ongoingGames
              .flat()
              .map((e) => e.channelID)
              .includes(channel_ID)
          ) {
            wrongEmbed.setTitle(":x: There are users in game!");

            return message.channel.send(wrongEmbed);
          }

          if (message.content.split(" ").length !== 2) {
            wrongEmbed.setTitle(":x: Invalid Parameters!");

            return message.channel.send(wrongEmbed);
          }

          await dbCollection
            .find({
              servers: {
                $elemMatch: {
                  channelID: channel_ID,
                },
              },
            })
            .toArray()
            .then(async (storedUsers) => {
              for (const user of storedUsers) {
                const channelPos = user.servers
                  .map((e) => e)
                  .map((e) => e.channelID)
                  .indexOf(channel_ID);

                if (channelPos !== -1) {
                  await dbCollection.update(
                    {
                      id: user.id,
                    },
                    {
                      $pull: {
                        servers: {
                          channelID: channel_ID,
                        },
                      },
                    }
                  );
                }
              }
            });

          for (const game of finishedGames) {
            if (game[6].channelID === channel_ID) {
              finishedGames.splice(finishedGames.indexOf(game), 1);
            }
          }
          correctEmbed.setTitle(":white_check_mark: Channel score reset!");

          return message.channel.send(correctEmbed);
        }

        case "player": {
          if (
            ongoingGames
              .flat()
              .map((e) => e.id)
              .includes(userId)
          ) {
            wrongEmbed.setTitle(":x: User is in the middle of a game!");

            return message.channel.send(wrongEmbed);
          }

          if (message.content.split(" ").length !== 3) {
            wrongEmbed.setTitle(":x: Invalid Parameters!");

            return message.channel.send(wrongEmbed);
          }
          await dbCollection
            .find({
              id: thirdArg,
            })
            .toArray()
            .then(async (storedUsers) => {
              if (storedUsers.length === 0) {
                wrongEmbed.setTitle(
                  ":x: This user hasn't played any games in this channel!"
                );

                return message.channel.send(wrongEmbed);
              }

              await dbCollection.update(
                {
                  id: thirdArg,
                },
                {
                  $pull: {
                    servers: {
                      channelID: channel_ID,
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

      if (includesUserID(Object.values(channelQueues).flat())) {
        wrongEmbed.setTitle(
          `:x: You're already queued in the channel ${
            (
              await client.channels.fetch(
                Object.keys(channelQueues).find((e) =>
                  includesUserID(channelQueues[e])
                )
              )
            ).name
          }!`
        );

        return message.channel.send(wrongEmbed);
      }

      if (includesUserID(ongoingGames.flat())) {
        wrongEmbed.setTitle(":x: You are in the middle of a game!");

        return message.channel.send(wrongEmbed);
      }

      if (queueArray.length > 5) {
        wrongEmbed.setTitle(":x: Please wait for the next game to be decided!");

        return message.channel.send(wrongEmbed);
      }

      queueArray.push(toAdd);

      correctEmbed.setTitle(
        `:white_check_mark: Added to queue! ${queueArray.length}/6`
      );

      message.channel.send(correctEmbed);

      if (queueArray.length === 6) {
        for (const user of queueArray) {
          await dbCollection
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
                await dbCollection.insert(newUser);

                await dbCollection.update(
                  {
                    id: user.id,
                  },
                  {
                    $push: {
                      servers: {
                        channelID: channel_ID,
                        wins: 0,
                        losses: 0,
                        mmr: 1000,
                      },
                    },
                  }
                );
              } else if (
                !storedUsers[0].servers
                  .map((e) => e.channelID)
                  .includes(channel_ID)
              ) {
                await dbCollection.update(
                  {
                    id: user.id,
                  },
                  {
                    $push: {
                      servers: {
                        channelID: channel_ID,
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

        await message.channel.send(
          `<@${queueArray[0].id}>, <@${queueArray[1].id}>, <@${queueArray[2].id}>, <@${queueArray[3].id}>, <@${queueArray[4].id}>, <@${queueArray[5].id}>`
        );

        correctEmbed.setTitle(
          "A game has been made! Please select your preferred gamemode: Captains (!c) or Random (!r) "
        );

        gameCount++;

        const rorc = {};

        rorc[gameCount] = [];

        const rorcArray = rorc[gameCount];

        await message.channel.send(correctEmbed);

        let filter = (m) =>
          m.content.split("")[1] === "r" || m.content.split("")[1] === "c";

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
            param:
              rorcArray[
                Math.floor(Math.random() * rorcArray.map((e) => e.param).length)
              ].param,
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

          queueArray.push({
            gameID: gameCount,
            time: new Date(),
            channelID: channel_ID,
          });
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
          tempObject[gameCount] = [];

          usedNums[gameCount] = [];

          const gameCountNums = usedNums[gameCount];

          const captainsArray = tempObject[gameCount];

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

          queueArray[3] = captainsArray[1];

          const CaptainsEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle(`Game ID: ${gameCount}`)
            .addField("Captain for team 1", captainsArray[0].name)
            .addField("Captain for team 2", captainsArray[1].name);

          message.channel.send(CaptainsEmbed);

          const privatedm0 = await client.users.fetch(captainsArray[0].id);

          const privatedm1 = await client.users.fetch(captainsArray[1].id);

          captainsArray.shift();

          captainsArray.shift();

          const Captain1st = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("Choose one ( you have 40 seconds):")
            .addField("1 :", captainsArray[0].name)
            .addField("2 :", captainsArray[1].name)
            .addField("3 :", captainsArray[2].name)
            .addField("4 :", captainsArray[3].name);

          privatedm0.send(Captain1st).catch((error) => {
            const errorEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(
                `:x: Couldn't sent message to ${privatedm0}, please check if your DM'S aren't set to friends only.`
              );

            console.error(error);

            message.channel.send(errorEmbed);
          });

          filter = (m) =>
            !isNaN(m.content) &&
            parseInt(m.content) > 0 &&
            parseInt(m.content) < 5;

          await privatedm0.createDM().then((m1) => {
            m1.createMessageCollector(filter, {
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
            const randomnumber = Math.floor(Math.random() * 4);

            queueArray[1] = captainsArray[randomnumber];

            captainsArray.splice(randomnumber, 1);
          }

          hasVoted = false;

          const Captain2nd = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("Choose two( you have 40 seconds):")
            .addField("1 :", captainsArray[0].name)
            .addField("2 :", captainsArray[1].name)
            .addField("3 :", captainsArray[2].name);

          privatedm1.send(Captain2nd).catch((error) => {
            const errorEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(
                `:x: Couldn't sent message to ${privatedm1}, please check if your DM'S aren't set to friends only.`
              );

            console.error(error);

            message.channel.send(errorEmbed);
          });

          filter = (m) =>
            !isNaN(m.content) &&
            parseInt(m.content) > 0 &&
            parseInt(m.content) < 4;

          privatedm1.createDM().then((m1) => {
            m1.createMessageCollector(filter, {
              time: 40000,
            }).on("collect", (m) => {
              const parsedM = parseInt(m) - 1;

              if (!hasVoted) {
                queueArray[4] = captainsArray[parsedM];

                hasVoted = true;

                gameCountNums.push(parsedM);
              } else if (
                hasVoted &&
                !gameCountNums.includes(parsedM) &&
                hasVoted !== "all"
              ) {
                queueArray[5] = captainsArray[parsedM];

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

          const randomnumber = Math.floor(Math.random() * 3);

          let randomnumber2 = Math.floor(Math.random() * 3);

          if (!hasVoted) {
            while (randomnumber === randomnumber2) {
              randomnumber2 = Math.floor(Math.random() * 3);
            }

            queueArray[4] = captainsArray[randomnumber];

            queueArray[5] = captainsArray[randomnumber2];

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

            queueArray[5] = captainsArray[randomnumber2];

            captainsArray.splice(gameCountNums[0], 1);

            if (randomnumber2 > gameCountNums[0]) {
              captainsArray.splice(randomnumber2 - 1, 1);
            } else {
              captainsArray.splice(randomnumber2, 1);
            }
          }

          hasVoted = false;

          queueArray[2] = captainsArray[0];

          captainsArray.splice(0, captainsArray.length);

          gameCountNums.splice(0, gameCountNums.length);

          queueArray.push({
            gameID: gameCount,
            time: new Date(),
            channelID: channel_ID,
          });
        }

        ongoingGames.push([...queueArray]);

        const discordEmbed1 = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .addField("Game is ready:", `Game ID is: ${queueArray[6].gameID}`)
          .addField(
            ":small_orange_diamond: -Team 1-",
            `${queueArray[0].name}, ${queueArray[1].name}, ${queueArray[2].name}`
          )
          .addField(
            ":small_blue_diamond: -Team 2-",
            `${queueArray[3].name}, ${queueArray[4].name}, ${queueArray[5].name}`
          );
        message.channel.send(discordEmbed1);

        const JoinMatchEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .addField("Name:", valuesforpm.name)
          .addField("Password:", valuesforpm.password)
          .addField(
            "You have to:",
            `Join match(Created by ${queueArray[0].name})`
          );

        for (const users of queueArray) {
          if (users.id !== queueArray[0].id && users.id !== queueArray[6].id) {
            const fetchedUser = await client.users.fetch(users.id);
            fetchedUser.send(JoinMatchEmbed).catch((error) => {
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

        const fetchedUser = await client.users.fetch(queueArray[0].id);

        fetchedUser.send(CreateMatchEmbed).catch((error) => {
          const errorEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle(
              `:x: Couldn't sent message to ${queueArray[0].name}, please check if your DM'S aren't set to friends only.`
            );

          message.channel.send(errorEmbed);
          console.error(error);
        });

        message.guild.channels
          .create(`🔸Team-1-Game-${queueArray[6].gameID}`, {
            type: "voice",
            parent: message.channel.parentID,
            permissionOverwrites: [
              {
                id: message.guild.id,
                deny: "CONNECT",
              },
              {
                id: queueArray[0].id,
                allow: "CONNECT",
              },
              {
                id: queueArray[1].id,
                allow: "CONNECT",
              },
              {
                id: queueArray[2].id,
                allow: "CONNECT",
              },
            ],
          })
          .catch(console.error);

        message.guild.channels
          .create(`🔹Team-2-Game-${queueArray[6].gameID}`, {
            type: "voice",
            parent: message.channel.parentID,
            permissionOverwrites: [
              {
                id: message.guild.id,
                deny: "CONNECT",
              },
              {
                id: queueArray[3].id,
                allow: "CONNECT",
              },
              {
                id: queueArray[4].id,
                allow: "CONNECT",
              },
              {
                id: queueArray[5].id,
                allow: "CONNECT",
              },
            ],
          })
          .catch(console.error);

        queueArray.splice(0, queueArray.length);
      }
    }
  }
};

module.exports = {
  name: [
    "q",
    "status",
    "leave",
    "report",
    "score",
    "cancel",
    "reset",
    "r",
    "c",
    "revertgame",
  ],
  description: "6man bot",
  execute,
};
