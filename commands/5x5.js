const Discord = require("discord.js")

const client = require("../client.js");

const MongoDB = require("../mongodb");

const db = MongoDB.getDB()

const usersCollection = db.collection('sixman')

const serversCollection = db.collection('guilds')

let usedNums = []

const tempObject = {}

const rc = ["r", "c"]

const valorantMaps = ["Haven", "Bind", "Split"]

const CSGOMaps = ["Cache", "Dust II", "Inferno", "Mirage", "Train"]

const EMBED_COLOR_ERROR = "#F8534F";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#77B255";

const ongoingGames = [];

const channelQueues = {};

const cancelQueue = {}

const avaiableGames = ["Valorant", "CSGO", "LeagueOfLegends"]

let gameCount = 0;

let storedUsers;

let storedGuilds;

let hasVoted = false

setInterval(async () => {

  let embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING)

  if (Object.entries(channelQueues).length !== 0) {
    for (let channel of Object.values(channelQueues)) {
      for (let user of channel) {
        if ((Date.now() - user.date) > 45 * 60 * 1000) {

          const actualChannel = client.channels.fetch(Object.keys(channelQueues).find(key => channelQueues[key] === channel))

          embedRemove.setTitle(`You were removed from the queue after no game has been made in 45 minutes!`)

          actualChannel.send(`<@${user.id}>`)

          actualChannel.send(embedRemove)

          embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING)

          channel.splice(channel.indexOf(user), 1)
        }
      }
    }
  }

  if (ongoingGames.length !== 0) {
    for (let games of ongoingGames) {
      if ((Date.now() - games[10].time) > 3 * 60 * 60 * 1000) {
        for (let channel of await client.channels.fetch(games[10].channelID).then(e => e.guild.channels.cache.array())) {

          if (channel.name === `🔸Team-1-Game-${games[10].gameID}`) {

            channel.delete()
          }

          if (channel.name === `🔹Team-2-Game-${games[10].gameID}`) {

            channel.delete()
          }
        }

        embedRemove.setTitle(`Game ${games[10].gameID} Cancelled due to not being finished in 3 Hours!`)

        let index = ongoingGames.indexOf(games);

        ongoingGames.splice(index, 1)

        const a = await client.channels.fetch(games[2].channel)

        a.send(embedRemove)

        embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING)
      }
    }
  }
}, 60 * 1000)

const shuffle = function (array) {

  let currentIndex = array.length;
  let temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);

    currentIndex--;

    temporaryValue = array[currentIndex];

    array[currentIndex] = array[randomIndex];

    array[randomIndex] = temporaryValue;
  }

  return array;
};

function messageEndswith(message) {

  const split = message.content.split(" ");
  return split[split.length - 1];
};

const args = message => {
  const arraywords = message.content.split(" ")
  return arraywords[0].substring(1)
}

const execute = async (message) => {


  const secondArg = message.content.split(" ")[1]

  const thirdArg = message.content.split(" ")[2]

  const fourthArg = message.content.split(" ")[3]

  const channel_ID = message.channel.id

  if (!Object.keys(channelQueues).includes(channel_ID)) {

    channelQueues[channel_ID] = []
  }

  const queueArray = channelQueues[channel_ID]

  const userId = message.author.id

  const includesUserID = (array) => array.map(e => e.id).includes(userId)

  const toAdd = {
    id: userId,
    name: message.author.username,
    date: new Date()
  };

  const serverInfo = {
    id: message.guild.id,
    game: secondArg,
    whitelist: []
  }

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR)

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK)

  await usersCollection.find().toArray().then(dataDB => {
    storedUsers = dataDB
  })

  await serversCollection.find().toArray().then(dataDB => {
    storedGuilds = dataDB
  })

  const givewinLose = async (score) => {

    for (let user of storedUsers) {
      for (let games of ongoingGames) {

        const channelPos = user.servers.map(e => e.channelID).indexOf(channel_ID)

        const sort = `servers.${channelPos}.${score}`

        const mmr = `servers.${channelPos}.mmr`
        //not sure if this works need test DO TEST THIS
        if (user.id === games[i].id && games.map(e => e.id).includes(userId)) {

          await usersCollection.update({
            id: user.id
          }, {
            $set: {
              [sort]: user.servers[channelPos][score] + 1,
              [mmr]: score === "wins" ? user.servers[channelPos].mmr + 13 : user.servers[channelPos].mmr - 10
            }
          });
        }
      }
    }
  }

  const index = queueArray.map(e => e.id).indexOf(userId);

  if (!storedGuilds.map(e => e.id).includes(message.guild.id) && args(message) !== "game") {

    wrongEmbed.setTitle(`:x: You haven't set your mode yet! Please ask an Admin to do !game ${avaiableGames.join(", ")}`)

    return message.channel.send(wrongEmbed)
  }

  if (storedGuilds.map(e => e.id).indexOf(message.guild.id) !== -1) {
    if (!storedGuilds[storedGuilds.map(e => e.id).indexOf(message.guild.id)].whitelist.includes(message.channel.id) && args(message) !== "whitelist") {
      wrongEmbed.setTitle(":x: Please add this channel to the whitelist using !whitelist channelId.")

      return message.channel.send(wrongEmbed)
    }
  }

  switch (args(message)) {

    case "game": {
      if (!avaiableGames.includes(secondArg)) {

        wrongEmbed.setTitle(":x: Invalid argument")

        return message.channel.send(wrongEmbed)
      }

      if (!storedGuilds.map(e => e.id).includes(message.guild.id) && message.member.hasPermission("ADMINISTRATOR") && avaiableGames.includes(secondArg)) {

        await serversCollection.insert(serverInfo);

        correctEmbed.setTitle(":white_check_mark: Server added!")

        return message.channel.send(correctEmbed)

      } else if (storedGuilds.map(e => e.id).includes(message.guild.id) && message.member.hasPermission("ADMINISTRATOR") && avaiableGames.includes(secondArg)) {

        await serversCollection.update({
          id: message.guild.id
        }, {
          $set: {
            game: secondArg
          }
        });
        correctEmbed.setTitle(":white_check_mark: Game updated!")

        return message.channel.send(correctEmbed)
      }
    }

    case "whitelist": {

      if (isNaN(secondArg)) {
        wrongEmbed.setTitle(":x: Please copy the actual discord id of the channel, more info can be found here \n https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-")

        return message.channel.send(wrongEmbed)
      }

      if (!message.guild.channels.cache.map(e => e.id).includes(secondArg)) {
        wrongEmbed.setTitle(":x: This channel does not belong to this server.")

        return message.channel.send(wrongEmbed)
      }

      if (!message.member.hasPermission("ADMINISTRATOR")) {

        wrongEmbed.setTitle(":x: You do not have Administrator permission!")

        return message.channel.send(wrongEmbed)
      }

      if (storedGuilds[storedGuilds.map(e => e.id).indexOf(message.guild.id)].whitelist.includes(secondArg)) {

        await serversCollection.update({
          id: message.guild.id
        }, {
          $pull: {
            whitelist: secondArg
          }
        });

        correctEmbed.setTitle(":white_check_mark: Channel removed from whitelist!")

        return message.channel.send(correctEmbed)
      }

      await serversCollection.update({
        id: message.guild.id
      }, {
        $push: {
          whitelist: secondArg
        }
      });

      correctEmbed.setTitle(":white_check_mark: Channel Whitelisted!")

      return message.channel.send(correctEmbed)

    }

    case "leave": {

      for (let captainGames of Object.values(tempObject).flat()) {
        if (includesUserID(captainGames)) {

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
      };

      queueArray.splice(index, 1);

      correctEmbed.setTitle(`:white_check_mark: ${message.author.username} left the queue! ${queueArray.length}/10`);

      return message.channel.send(correctEmbed);
    }

    case "status": {

      correctEmbed.setTitle(`Players in queue: ${queueArray.length}`);

      correctEmbed.setDescription(queueArray.map(e => e.name).join(", "));

      return message.channel.send(correctEmbed);
    }

    case "report": {
      switch (messageEndswith(message)) {
        case "win": {

          if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

            wrongEmbed.setTitle(":x: You aren't in a game!");

            return message.channel.send(wrongEmbed)
          }

          for (let games of ongoingGames) {

            if (!includesUserID(games)) {

              continue
            }

            correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

            const indexplayer = games.map(e => e.id).indexOf(userId);

            if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2 || indexplayer === 3 || indexplayer === 4) {
              for (i = 0; i < 5; i++) {
                givewinLose("wins");
              }
              for (i = 5; i < 10; i++) {
                givewinLose("losses");
              }
            }

            if (indexplayer === 5 || indexplayer === 6 || indexplayer === 7 || indexplayer === 8 || indexplayer === 9) {
              for (i = 5; i < 10; i++) {
                givewinLose("wins");
              }
              for (i = 0; i < 5; i++) {
                givewinLose("losses");
              }
            }

            let index = ongoingGames.indexOf(games);

            ongoingGames.splice(index, 1);

            for (let channel of message.guild.channels.cache.array()) {

              if (channel.name === `🔸Team-1-Game-${games[10].gameID}`) {

                channel.delete()
              }

              if (channel.name === `🔹Team-2-Game-${games[10].gameID}`) {

                channel.delete()
              }
            }

            return message.channel.send(correctEmbed);
          }
        }

        case "lose": {

          if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

            wrongEmbed.setTitle(":x: You aren't in a game!");

            return message.channel.send(wrongEmbed);
          }

          for (let games of ongoingGames) {

            if (!includesUserID(games)) {

              continue
            }

            correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

            const indexplayer = games.map(e => e.id).indexOf(userId);

            if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2 || indexplayer === 3 || indexplayer === 4) {
              for (i = 0; i < 5; i++) {
                givewinLose("losses");
              }
              for (i = 5; i < 10; i++) {
                givewinLose("wins");
              }
            }

            if (indexplayer === 5 || indexplayer === 6 || indexplayer === 7 || indexplayer === 8 || indexplayer === 9) {
              for (i = 5; i < 10; i++) {
                givewinLose("losses");
              }
              for (i = 0; i < 5; i++) {
                givewinLose("wins");
              }
            }

            let index = ongoingGames.indexOf(games);

            ongoingGames.splice(index, 1);

            for (let channel of message.guild.channels.cache.array()) {

              if (channel.name === `🔸Team-1-Game-${games[10].gameID}`) {

                channel.delete()
              }

              if (channel.name === `🔹Team-2-Game-${games[10].gameID}`) {

                channel.delete()
              }
            }

            return message.channel.send(correctEmbed);
          }
        }
        default: {
          wrongEmbed.setTitle(":x: Invalid Parameters!")
          return message.channel.send(wrongEmbed);
        }
      }
    }

    case "cancel": {
      if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

        wrongEmbed.setTitle(":x: You aren't in a game!");

        return message.channel.send(wrongEmbed);
      }
      for (let games of ongoingGames) {

        if (!includesUserID(games)) {

          continue
        }

        const IDGame = games[10].gameID

        const index = games.map(e => e.id).indexOf(userId);

        if (!Object.keys(cancelQueue).includes(IDGame.toString())) {

          cancelQueue[IDGame] = []
        }

        const cancelqueuearray = cancelQueue[IDGame]

        if (cancelqueuearray.includes(userId)) {
          wrongEmbed.setTitle(":x: You've already voted to cancel!");

          return message.channel.send(wrongEmbed);
        }

        cancelqueuearray.push(userId)

        wrongEmbed.setTitle(`:exclamation: ${games[index].name} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/6)`)

        message.channel.send(wrongEmbed)

        if (cancelqueuearray.length === 6) {

          for (let channel of message.guild.channels.cache.array()) {

            if (channel.name === `🔸Team-1-Game-${games[10].gameID}`) {

              channel.delete()
            }

            if (channel.name === `🔹Team-2-Game-${games[10].gameID}`) {

              channel.delete()
            }
          }

          correctEmbed.setTitle(`:white_check_mark: Game ${games[10].gameID} Cancelled!`)

          let index = ongoingGames.indexOf(games);

          cancelQueue[IDGame] = []

          ongoingGames.splice(index, 1);

          return message.channel.send(correctEmbed)
        }

      }
      break;
    }

    case "score": {
      switch (secondArg) {
        case "me": {
          if (!includesUserID(storedUsers)) {

            wrongEmbed.setTitle(":x: You haven't played any games yet!");

            return message.channel.send(wrongEmbed);
          }

          for (let j = 0; j < storedUsers.length; j++) {
            if (storedUsers[j].id === userId) {

              const scoreDirectory = storedUsers[j].servers[storedUsers[j].servers.map(e => e.channelID).indexOf(message.channel.id)]

              if (scoreDirectory === undefined) {

                wrongEmbed.setTitle(":x: You haven't played any games in here yet!");

                return message.channel.send(wrongEmbed);
              }

              wrongEmbed.addField("Wins:", scoreDirectory.wins);

              wrongEmbed.addField("Losses:", scoreDirectory.losses);

              wrongEmbed.addField("Winrate:", isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)) ? "0%" : Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100) + "%");

              wrongEmbed.addField("MMR:", scoreDirectory.mmr)

              return message.channel.send(wrongEmbed);
            }
          }
        }

        case "channel": {

          if (!message.member.hasPermission("ADMINISTRATOR")) {

            wrongEmbed.setTitle(":x: You do not have Administrator permission!")

            return message.channel.send(wrongEmbed)
          }
          //CHANGE

          const getScore = (id) => {

            storedUsers = storedUsers.filter(a => a.servers.map(e => e.channelID).indexOf(id) !== -1 && a.servers[a.servers.map(e => e.channelID).indexOf(id)].wins + a.servers[a.servers.map(e => e.channelID).indexOf(id)].losses !== 0)

            if (storedUsers.length === 0) {
              wrongEmbed.setTitle(":x: No games have been played in here!");

              return message.channel.send(wrongEmbed);
            }

            storedUsers.sort((a, b) => {
              const indexA = a.servers.map(e => e.channelID).indexOf(id);

              const indexB = b.servers.map(e => e.channelID).indexOf(id);

              return b.servers[indexB].mmr - a.servers[indexA].mmr
            })

            if (!isNaN(fourthArg) && fourthArg > 0) {
              let indexes = 20 * (fourthArg - 1);
              for (indexes; indexes < 20 * fourthArg; indexes++) {
                if (storedUsers[indexes] == undefined) {

                  correctEmbed.addField(`No more members to list in this page!`, "Encourage your friends to play!");

                  break
                }
                for (let servers of storedUsers[indexes].servers) {
                  if (servers.channelID === id) {

                    correctEmbed.addField(storedUsers[indexes].name, `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${isNaN(Math.floor((servers.wins/(servers.wins + servers.losses)) * 100))? "0" : Math.floor((servers.wins/(servers.wins + servers.losses)) * 100)}% | MMR: ${servers.mmr}`)

                    correctEmbed.setFooter(`Showing page ${fourthArg}/${Math.ceil(storedUsers.length / 20)}`);
                  }
                }
              }
            } else {
              for (i = 0; i < 20; i++) {
                if (storedUsers[i] == undefined) {
                  correctEmbed.addField(`No more members to list in this page!`, "Encourage your friends to play!");
                  break
                }
                for (let servers of storedUsers[i].servers) {
                  if (servers.channelID === id) {

                    correctEmbed.addField(storedUsers[i].name, `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${isNaN(Math.floor((servers.wins/(servers.wins + servers.losses)) * 100))? "0" : Math.floor((servers.wins/(servers.wins + servers.losses)) * 100)}% | MMR: ${servers.mmr}`)

                    correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(storedUsers.length / 20)}`);
                  }
                }
              }
            }
            message.channel.send(correctEmbed)
          }
//maybe add something like get score channel on the channel that you are and on nother channels and, instead of just typing the id, type the name aka optimize
          return getScore(thirdArg)
        }
      }
    }

    case "ongoinggames": {

      if (ongoingGames.length === 0) {
        wrongEmbed.setTitle(":x: No games are currently having place!");

        return message.channel.send(wrongEmbed);
      }

      for (i = 0; i < 20; i++) {

        const game = ongoingGames[i]

        if (game == undefined) {
          correctEmbed.addField(`No more games to list `, "Encourage your friends to play!");
          break
        }

        if (game[10].channelID === channel_ID) {

          correctEmbed.addField(`Game ${game[10].gameID}`, `🔸 <@${game[0].id}>, <@${game[1].id}>, <@${game[2].id}>, <@${game[3].id}>, <@${game[4].id}>`)
          correctEmbed.addField(`**VS**`, `🔹 <@${game[5].id}>, <@${game[6].id}>, <@${game[7].id}>, <@${game[8].id}>, <@${game[9].id}>, `)

          correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(ongoingGames.length / 20)}`);
        }
      }
      return message.channel.send(correctEmbed);
    }

    case "reset": {
      if (message.content.split(" ").length == 1) {

        wrongEmbed.setTitle(":x: Invalid Parameters!")

        return message.channel.send(wrongEmbed)
      }

      if (!message.member.hasPermission("ADMINISTRATOR")) {

        wrongEmbed.setTitle(":x: You do not have Administrator permission!")

        return message.channel.send(wrongEmbed)
      }

      switch (secondArg) {
        case "channel": {
          if (message.content.split(" ").length !== 2) {

            wrongEmbed.setTitle(":x: Invalid Parameters!")

            return message.channel.send(wrongEmbed)
          }

          for (let user of storedUsers) {

            const channelPos = user.servers.map(e => e).map(e => e.channelID).indexOf(channel_ID)

            if (channelPos !== -1) {

              await usersCollection.update({
                id: user.id
              }, {
                $pull: {
                  servers: {
                    channelID: channel_ID
                  }
                }
              });
            }
          }

          correctEmbed.setTitle(":white_check_mark: Player's score reset!")

          return message.channel.send(correctEmbed)
        }
        case "player": {
          if (message.content.split(" ").length !== 3) {

            wrongEmbed.setTitle(":x: Invalid Parameters!")

            return message.channel.send(wrongEmbed)

          }
          const channelPos = storedUsers[storedUsers.map(e => e.id).indexOf(thirdArg)].servers.map(e => e.channelID).indexOf(channel_ID)

          if (channelPos == -1) {

            wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!")

            return message.channel.send(wrongEmbed)
          } else {

            await usersCollection.update({
              id: thirdArg
            }, {
              $pull: {
                servers: {
                  channelID: channel_ID
                }
              }
            });
          }

          correctEmbed.setTitle(":white_check_mark: Player's score reset!")

          return message.channel.send(correctEmbed)
        }
        default: {
          wrongEmbed.setTitle(":x: Invalid Parameters!")

          return message.channel.send(wrongEmbed);
        }
      }
    }

    case "q": {

      for (let person of queueArray) {
        if (person.id === userId) {

          wrongEmbed.setTitle(":x: You're already in the queue!");

          return message.channel.send(wrongEmbed);
        }
      };

      if (includesUserID(ongoingGames.flat())) {

        wrongEmbed.setTitle(":x: You are in the middle of a game!");

        return message.channel.send(wrongEmbed);
      };

      if (Object.entries(tempObject).length !== 0 || queueArray.length === 10) {

        wrongEmbed.setTitle(":x: Please wait for the next game to be decided!")

        return message.channel.send(wrongEmbed)
      }

      queueArray.push(toAdd);

      correctEmbed.setTitle(`:white_check_mark: Added to queue! ${queueArray.length}/10`);

      message.channel.send(correctEmbed);

      if (queueArray.length === 10) {
        for (let user of queueArray) {

          const newUser = {
            id: user.id,
            name: user.name,
            servers: []
          };

          // yes i know having lots of requests isnt good ill change when i can be fucked to

          if (await usersCollection.find({
              id: user.id
            }).toArray().then(dataDB => dataDB.length === 0)) {
            (async function () {
              await usersCollection.insert(newUser);
            })()
          };

          if (await usersCollection.find({
              id: user.id,
              ["servers.channelID"]: channel_ID
            }).toArray().then(dataDB => dataDB.length === 0)) {

            (async function () {
              await usersCollection.update({
                id: user.id
              }, {
                $push: {
                  servers: {
                    channelID: channel_ID,
                    wins: 0,
                    losses: 0,
                    mmr: 1000
                  }
                }
              });
            })()
          };
        };

        const valuesforpm = {
          name: Math.floor(Math.random() * 99999),
          password: Math.floor(Math.random() * 99999)
        };

        message.channel.send(`<@${queueArray[0].id}>, <@${queueArray[1].id}>, <@${queueArray[2].id}>, <@${queueArray[3].id}>, <@${queueArray[4].id}>, <@${queueArray[5].id}>, <@${queueArray[6].id}>, <@${queueArray[7].id}>, <@${queueArray[8].id}>, <@${queueArray[9].id}>`)

        correctEmbed.setTitle("a game has been made! Please select your preferred gamemode: Captains (c) or Random (r) ")

        gameCount++

        const rorc = {}

        rorc[gameCount] = []

        const rorcArray = rorc[gameCount]

        message.channel.send(correctEmbed)

        let filter = m => m.content.split("")[1] === "r" || m.content.split("")[1] === "c"

        message.channel.createMessageCollector(filter, {
          time: 15000
        }).on('collect', m => {
          if (!queueArray.map(e => e.id).includes(m.author.id) || rorcArray.map(e => e.id).includes(m.author.id)) {

          } else {

            rorcArray.push({
              id: m.author.id,
              param: m.content.split("")[1]
            })
          }
        })

        await new Promise(resolve => setTimeout(resolve, 15000));

        function getOccurrence(array, value) {

          return array.filter((v) => (v === value)).length;
        }

        if (rorcArray.length === 0) {

          rorcArray.push({
            param: rc[Math.floor(Math.random() * rc.length)]
          })
        }

        if (getOccurrence(rorcArray.map(e => e.param), "r") === getOccurrence(rorcArray.map(e => e.param), "c")) {

          rorcArray.push({
            param: rorcArray[Math.floor(Math.random() * rorcArray.map(e => e.param).length)].param
          })
        }
        if (getOccurrence(rorcArray.map(e => e.param), "r") > getOccurrence(rorcArray.map(e => e.param), "c")) {

          shuffle(queueArray);

          queueArray.push({
            gameID: gameCount,
            time: new Date(),
            channelID: channel_ID
          })

        } else if (getOccurrence(rorcArray.map(e => e.param), "c") > getOccurrence(rorcArray.map(e => e.param), "r")) {

          //yes this code is horrible no shit sherlock

          //also what youre about to see will kill you, its not permanent, as even i have standarts

          queueArray.push({
            gameID: gameCount,
            time: new Date(),
            channelID: channel_ID
          })

          tempObject[gameCount] = []

          const tempobjectArray = tempObject[gameCount]

          tempobjectArray.push([...queueArray]);

          for (let tempObjectLoop of tempobjectArray) {
            if (!includesUserID(tempObjectLoop)) {
              continue
            }

            const tempvar = tempObjectLoop[10]

            shuffle(tempObjectLoop);

            tempObjectLoop.splice(tempObjectLoop.findIndex(o => o.gameID === tempvar.gameID), 1)

            tempObjectLoop.push(tempvar)

            queueArray[0] = tempObjectLoop[0]

            queueArray[5] = tempObjectLoop[1]

            const CaptainsEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(`Game ID: ${tempObjectLoop[10].gameID}`)
              .addField(`Captain for team 1`, tempObjectLoop[0].name)
              .addField(`Captain for team 2`, tempObjectLoop[1].name);

            message.channel.send(CaptainsEmbed)

            const privatedm0 = await client.users.fetch(tempObjectLoop[0].id)

            const privatedm1 = await client.users.fetch(tempObjectLoop[1].id)

            tempObjectLoop.shift()

            tempObjectLoop.shift()

            const Captain1st = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle("Choose one:")
              .addField(`1 :`, tempObjectLoop[0].name)
              .addField(`2 :`, tempObjectLoop[1].name)
              .addField(`3 :`, tempObjectLoop[2].name)
              .addField(`4 :`, tempObjectLoop[3].name)
              .addField(`5 :`, tempObjectLoop[4].name)
              .addField(`6 :`, tempObjectLoop[5].name)
              .addField(`7 :`, tempObjectLoop[6].name)
              .addField(`8 :`, tempObjectLoop[7].name);

            privatedm0.send(Captain1st).catch(error => {
              const errorEmbed = new Discord.MessageEmbed()
                .setColor(EMBED_COLOR_WARNING)
                .setTitle(`:x: Couldn't sent message to ${privatedm0}, please check if your DM'S aren't set to friends only.`);

              console.error(error);

              message.channel.send(errorEmbed)
            });

            filter = m => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 9

            await privatedm0.createDM().then(m => {
              m.createMessageCollector(filter, {
                time: 20000
              }).on('collect', m => {

                const parsedM = parseInt(m.content) - 1

                if (!hasVoted) {

                  queueArray[1] = tempObjectLoop[parsedM]

                  tempObjectLoop.splice(parsedM, 1)

                  hasVoted = true
                }
              })
            })

            await new Promise(resolve => setTimeout(resolve, 20000));

            if (!hasVoted) {

              const randomnumber = Math.floor(Math.random() * 8)

              queueArray[1] = tempObjectLoop[randomnumber]

              tempObjectLoop.splice(randomnumber, 1)
            }

            hasVoted = false

            const Captain2nd = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle("Choose two:")
              .addField(`1 :`, tempObjectLoop[0].name)
              .addField(`2 :`, tempObjectLoop[1].name)
              .addField(`3 :`, tempObjectLoop[2].name)
              .addField(`4 :`, tempObjectLoop[3].name)
              .addField(`5 :`, tempObjectLoop[4].name)
              .addField(`6 :`, tempObjectLoop[5].name)
              .addField(`7 :`, tempObjectLoop[6].name);

            privatedm1.send(Captain2nd).catch(error => {
              const errorEmbed = new Discord.MessageEmbed()
                .setColor(EMBED_COLOR_WARNING)
                .setTitle(`:x: Couldn't sent message to ${privatedm1}, please check if your DM'S aren't set to friends only.`);

              console.error(error);

              message.channel.send(errorEmbed)
            });

            filter = m => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 8

            privatedm1.createDM().then(m => {
              m.createMessageCollector(filter, {
                time: 20000
              }).on('collect', m => {

                const parsedM = parseInt(m.content) - 1

                if (!hasVoted) {
                  queueArray[6] = tempObjectLoop[parsedM]

                  hasVoted = true

                  usedNums.push(parsedM)

                } else if (hasVoted && !usedNums.includes(parsedM) && hasVoted !== "all") {

                  queueArray[7] = tempObjectLoop[parsedM]

                  hasVoted = "all"

                  usedNums.push(parsedM)

                  tempObjectLoop.splice(usedNums[0], 1)

                  if (usedNums[1] > usedNums[0]) {

                    tempObjectLoop.splice(usedNums[1] - 1, 1)
                  } else {

                    tempObjectLoop.splice(usedNums[1], 1)
                  }
                }
              })
            })

            await new Promise(resolve => setTimeout(resolve, 20000));

            let randomnumber = Math.floor(Math.random() * 7)

            let randomnumber2 = Math.floor(Math.random() * 7)

            if (!hasVoted) {

              while (randomnumber === randomnumber2) {
                randomnumber2 = Math.floor(Math.random() * 7)
              }

              queueArray[6] = tempObjectLoop[randomnumber]

              queueArray[7] = tempObjectLoop[randomnumber2]

              tempObjectLoop.splice(randomnumber, 1)

              if (randomnumber2 > randomnumber) {

                tempObjectLoop.splice(randomnumber2 - 1, 1)
              } else {

                tempObjectLoop.splice(randomnumber2, 1)
              }

            } else if (hasVoted !== "all") {

              while (usedNums.includes(randomnumber2)) {

                randomnumber2 = Math.floor(Math.random() * 6)
              }

              queueArray[7] = tempObjectLoop[randomnumber2]

              tempObjectLoop.splice(usedNums[0], 1)

              if (randomnumber2 > usedNums[0]) {

                tempObjectLoop.splice(randomnumber2 - 1, 1)
              } else {

                tempObjectLoop.splice(randomnumber2, 1)
              }
            }

            usedNums = []

            hasVoted = false

            const Captain3rd = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle("Choose two:")
              .addField(`1 :`, tempObjectLoop[0].name)
              .addField(`2 :`, tempObjectLoop[1].name)
              .addField(`3 :`, tempObjectLoop[2].name)
              .addField(`4 :`, tempObjectLoop[3].name)
              .addField(`5 :`, tempObjectLoop[4].name)

            privatedm0.send(Captain3rd).catch(error => {
              const errorEmbed = new Discord.MessageEmbed()
                .setColor(EMBED_COLOR_WARNING)
                .setTitle(`:x: Couldn't sent message to ${privatedm0}, please check if your DM'S aren't set to friends only.`); -
              console.error(error);

              message.channel.send(errorEmbed)
            });

            filter = m => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 6

            privatedm0.createDM().then(m => {
              m.createMessageCollector(filter, {
                time: 20000
              }).on('collect', m => {

                const parsedM = parseInt(m.content) - 1

                if (!hasVoted) {

                  queueArray[2] = tempObjectLoop[parsedM]

                  hasVoted = true

                  usedNums.push(parsedM)

                } else if (hasVoted && !usedNums.includes(parsedM) && hasVoted !== "all") {

                  queueArray[3] = tempObjectLoop[parsedM]

                  hasVoted = "all"

                  usedNums.push(parsedM)

                  tempObjectLoop.splice(usedNums[0], 1)

                  if (usedNums[1] > usedNums[0]) {

                    tempObjectLoop.splice(usedNums[1] - 1, 1)
                  } else {

                    tempObjectLoop.splice(usedNums[1], 1)
                  }
                }
              })
            })

            await new Promise(resolve => setTimeout(resolve, 20000));

            randomnumber = Math.floor(Math.random() * 5)

            randomnumber2 = Math.floor(Math.random() * 5)

            if (!hasVoted) {

              while (randomnumber === randomnumber2) {
                randomnumber2 = Math.floor(Math.random() * 5)
              }

              queueArray[2] = tempObjectLoop[randomnumber]

              queueArray[3] = tempObjectLoop[randomnumber2]

              tempObjectLoop.splice(randomnumber, 1)

              if (randomnumber2 > randomnumber) {

                tempObjectLoop.splice(randomnumber2 - 1, 1)
              } else {

                tempObjectLoop.splice(randomnumber2, 1)
              }

            } else if (hasVoted !== "all") {

              while (usedNums.includes(randomnumber2)) {

                randomnumber2 = Math.floor(Math.random() * 4)
              }

              queueArray[3] = tempObjectLoop[randomnumber2]

              tempObjectLoop.splice(usedNums[0], 1)

              if (randomnumber2 > usedNums[0]) {

                tempObjectLoop.splice(randomnumber2 - 1, 1)
              } else {

                tempObjectLoop.splice(randomnumber2, 1)
              }
            }

            usedNums = []

            hasVoted = false

            const Captain4th = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle("Choose two:")
              .addField(`1 :`, tempObjectLoop[0].name)
              .addField(`2 :`, tempObjectLoop[1].name)
              .addField(`3 :`, tempObjectLoop[2].name)

            privatedm1.send(Captain4th).catch(error => {
              const errorEmbed = new Discord.MessageEmbed()
                .setColor(EMBED_COLOR_WARNING)
                .setTitle(`:x: Couldn't sent message to ${privatedm1}, please check if your DM'S aren't set to friends only.`);

              console.error(error);

              message.channel.send(errorEmbed)
            });

            filter = m => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 4

            privatedm1.createDM().then(m => {
              m.createMessageCollector(filter, {
                time: 20000
              }).on('collect', m => {

                const parsedM = parseInt(m.content) - 1

                if (!hasVoted) {

                  queueArray[8] = tempObjectLoop[parsedM]

                  hasVoted = true

                  usedNums.push(parsedM)

                } else if (hasVoted && !usedNums.includes(parsedM) && hasVoted !== "all") {

                  queueArray[9] = tempObjectLoop[parsedM]

                  hasVoted = "all"

                  usedNums.push(parsedM)

                  tempObjectLoop.splice(usedNums[0], 1)

                  if (usedNums[1] > usedNums[0]) {

                    tempObjectLoop.splice(usedNums[1] - 1, 1)
                  } else {

                    tempObjectLoop.splice(usedNums[1], 1)
                  }
                }
              })
            })

            await new Promise(resolve => setTimeout(resolve, 20000));

            randomnumber = Math.floor(Math.random() * 3)

            randomnumber2 = Math.floor(Math.random() * 3)

            if (!hasVoted) {

              while (randomnumber === randomnumber2) {
                randomnumber2 = Math.floor(Math.random() * 3)
              }

              queueArray[8] = tempObjectLoop[randomnumber]

              queueArray[9] = tempObjectLoop[randomnumber2]

              tempObjectLoop.splice(randomnumber, 1)

              if (randomnumber2 > randomnumber) {

                tempObjectLoop.splice(randomnumber2 - 1, 1)
              } else {

                tempObjectLoop.splice(randomnumber2, 1)
              }

            } else if (hasVoted && hasVoted !== "all") {

              while (usedNums.includes(randomnumber2)) {

                randomnumber2 = Math.floor(Math.random() * 2)
              }

              queueArray[9] = tempObjectLoop[randomnumber2]

              tempObjectLoop.splice(usedNums[0], 1)

              if (randomnumber2 > usedNums[0]) {

                tempObjectLoop.splice(randomnumber2 - 1, 1)
              } else {

                tempObjectLoop.splice(randomnumber2, 1)
              }
            }

            usedNums = []

            queueArray[4] = tempObjectLoop[0]

            delete tempObject[gameCount]
          }
        }
        ongoingGames.push([...queueArray]);

        const gameName = storedGuilds[storedGuilds.map(e => e.id).indexOf(message.guild.id)].game

        const discordEmbed1 = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .addField("Game is ready:", `Game ID is: ${gameCount}`)
          .addField(":small_orange_diamond: -Team 1-", `${queueArray[0].name}, ${queueArray[1].name}, ${queueArray[2].name}, ${queueArray[3].name}, ${queueArray[4].name}`)
          .addField(":small_blue_diamond: -Team 2-", `${queueArray[5].name}, ${queueArray[6].name}, ${queueArray[7].name}, ${queueArray[8].name}, ${queueArray[9].name}`);
        if (gameName !== "LeagueOfLegends") {

          discordEmbed1.addField(`Map: ${gameName === "Valorant" ? valorantMaps[Math.floor(Math.random() * valorantMaps.length)] : CSGOMaps[Math.floor(Math.random() * CSGOMaps.length)]}`, "Please organize a match with your teammates and opponents. Team 1 attacks and Team 2 defends. Good luck!")
        }
        message.channel.send(discordEmbed1);

        if (gameName === "LeagueOfLegends") {

          const JoinMatchEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .addField("Name:", valuesforpm.name)
            .addField("Password:", valuesforpm.password)
            .addField("You have to:", `Join match(Created by ${queueArray[0].name})`);

          for (let users of queueArray) {
            if (users.id !== queueArray[0].id && users.id !== queueArray[10].id) {

              await client.users.fetch(users.id).send(JoinMatchEmbed).catch(error => {
                const errorEmbed = new Discord.MessageEmbed()
                  .setColor(EMBED_COLOR_WARNING)
                  .setTitle(`:x: Couldn't sent message to ${users.name}, please check if your DM'S aren't set to friends only.`);

                console.error(error);

                message.channel.send(errorEmbed)
              });
            };
          };

          const CreateMatchEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .addField("Name:", valuesforpm.name)
            .addField("Password:", valuesforpm.password)
            .addField("You have to:", "Create Custom Match");

          await client.users.fetch(queueArray[0].id).send(CreateMatchEmbed).catch(error => {
            const errorEmbed = new Discord.MessageEmbed()
              .setColor(EMBED_COLOR_WARNING)
              .setTitle(`:x: Couldn't sent message to ${queueArray[0].name}, please check if your DM'S aren't set to friends only.`);

            message.channel.send(errorEmbed)
            console.error(error);
          });
        }

        message.guild.channels.create(`🔸Team-1-Game-${gameCount}`, {
            type: 'voice',
            parent: message.channel.parentID,
            permissionOverwrites: [{
                id: message.guild.id,
                deny: "CONNECT"
              },
              {
                id: queueArray[0].id,
                allow: "CONNECT"
              },
              {
                id: queueArray[1].id,
                allow: "CONNECT"
              },
              {
                id: queueArray[2].id,
                allow: "CONNECT"
              },
              {
                id: queueArray[3].id,
                allow: "CONNECT"
              },
              {
                id: queueArray[4].id,
                allow: "CONNECT"
              }
            ]
          })
          .catch(console.error)

        message.guild.channels.create(`🔹Team-2-Game-${gameCount}`, {
            type: 'voice',
            parent: message.channel.parentID,
            permissionOverwrites: [{
                id: message.guild.id,
                deny: "CONNECT"
              },
              {
                id: queueArray[5].id,
                allow: "CONNECT"
              },
              {
                id: queueArray[6].id,
                allow: "CONNECT"
              },
              {
                id: queueArray[7].id,
                allow: "CONNECT"
              },
              {
                id: queueArray[8].id,
                allow: "CONNECT"
              },
              {
                id: queueArray[9].id,
                allow: "CONNECT"
              }
            ]
          })
          .catch(console.error)

        queueArray.splice(0, queueArray.length);
      };
    }
  };
};

module.exports = {
  name: ['q', "status", "leave", "report", "score", "cancel", "reset", "r", "c", "game", "whitelist", "ongoinggames", "mode"],
  description: '6man bot',
  execute
};