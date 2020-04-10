const Discord = require("discord.js")

const client = require("../client.js");

const MongoDB = require("../mongodb");

const db = MongoDB.getDB()

const dbCollection = db.collection('sixman')

const usedNums = []

const tempObject = {}

const rc = ["r", "c"]

const EMBED_COLOR = "#F8534F";

const ongoingGames = [];

const channelQueues = {
};

const cancelQueue = {}

let gameCount = 0;

let storedData;

let hasVoted = false

let embedRemove = new Discord.RichEmbed().setColor(EMBED_COLOR)

setInterval(() => {
  if (Object.entries(channelQueues).length !== 0) {
    for (let channel of Object.values(channelQueues)) {
      for (let user of channel) {
        if ((Date.now() - user.date) > 45 * 60 * 1000) {

          const actualChannel = client.channels.get(Object.keys(channelQueues).find(key => channelQueues[key] === channel))

          embedRemove.setTitle(`You were removed from the queue after no game has been made in 45 minutes!`)

          actualChannel.send(`<@${user.id}>`)

          actualChannel.send(embedRemove)

          embedRemove = new Discord.RichEmbed().setColor(EMBED_COLOR)

          channel.splice(channel.indexOf(user), 1)
        }
      }
    }
  }

  if (ongoingGames.length !== 0) {
    for (let games of ongoingGames) {
      if ((Date.now() - games[6].time) > 3 * 60 * 60 * 1000) {
        for (let channel of client.channels.get(games[6].channelID).guild.channels.array()) {

          if (channel.name === `Team-1-Game-${games[6].gameID}`) {

            channel.delete()
          }

          if (channel.name === `Team-2-Game-${games[6].gameID}`) {

            channel.delete()
          }
        }

        embedRemove.setTitle(`:white_check_mark: Game ${games[6].gameID} Cancelled due to not being finished in 3 Hours!`)

        let index = ongoingGames.indexOf(games);

        ongoingGames.splice(index, 1)

        client.channels.get(games[6].channelID).send(embedRemove)

        embedRemove = new Discord.RichEmbed().setColor(EMBED_COLOR)
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

  const embed = new Discord.RichEmbed().setColor(EMBED_COLOR)

  const secondArg = message.content.split(" ")[1]

  const thirdparam = message.content.split(" ")[2]

  await dbCollection.find().toArray().then(dataDB => {
    storedData = dataDB
  })

  const channel_ID = message.channel.id

  const givewinLose = async (score) => {

    for (let user of storedData) {
      for (let games of ongoingGames) {

        const channelPos = user.servers.map(e => e.channelID).indexOf(channel_ID)

        const sort = `servers.${channelPos}.${score}`

        if (user.id === games[i].id) {

          await dbCollection.update({
            id: user.id
          }, {
            $set: {
              [sort]: user.servers[channelPos][score] + 1,
            }
          });
        }
      }
    }
  }

  if (!Object.keys(channelQueues).includes(channel_ID)) {

    channelQueues[channel_ID] = []
  }

  const sixMansArray = channelQueues[channel_ID]

  const userId = message.author.id

  const includesUserID = (array) => array.map(e => e.id).includes(userId)

  const toAdd = {
    id: userId,
    name: message.author.username,
    date: new Date()
  };

  const index = sixMansArray.map(e => e.id).indexOf(userId);

  switch (args(message)) {

    case "leave": {

      for (let captainGames of Object.values(tempObject).flat()) {
        if (includesUserID(captainGames)) {

          embed.setTitle(":x: You can't leave now!");

          return message.channel.send(embed);
        }
      }
      if (sixMansArray.length === 6) {

        embed.setTitle(":x: You can't leave now!");

        return message.channel.send(embed);
      }

      if (index === -1) {

        embed.setTitle(":x: You aren't in the queue!");

        return message.channel.send(embed);
      };

      sixMansArray.splice(index, 1);

      embed.setTitle(`:white_check_mark: ${message.author.username} left the queue!`);

      return message.channel.send(embed);
    }

    case "status": {

      embed.setTitle("Players in queue:");

      embed.setDescription(sixMansArray.map(e => e.name).join(", "));

      return message.channel.send(embed);
    }

    case "report": {
      switch (messageEndswith(message)) {
        case "win": {

          if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

            embed.setTitle(":x: You aren't in a game!");

            return message.channel.send(embed)
          }

          for (let games of ongoingGames) {

            if (!includesUserID(games)) {

              continue
            }

            embed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

            const indexplayer = games.map(e => e.id).indexOf(userId);

            if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2) {
              for (i = 0; i < 3; i++) {
                givewinLose("wins");
              }
              for (i = 3; i < 6; i++) {
                givewinLose("losses");
              }
            }

            if (indexplayer === 3 || indexplayer === 4 || indexplayer === 5) {
              for (i = 3; i < 6; i++) {
                givewinLose("wins");
              }
              for (i = 0; i < 3; i++) {
                givewinLose("losses");
              }
            }

            let index = ongoingGames.indexOf(games);

            ongoingGames.splice(index, 1);

            for (let channel of message.guild.channels.array()) {

              if (channel.name === `Team-1-Game-${games[6].gameID}`) {

                channel.delete()
              }

              if (channel.name === `Team-2-Game-${games[6].gameID}`) {

                channel.delete()
              }
            }

            return message.channel.send(embed);
          }
        }

        case "lose": {

          if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

            embed.setTitle(":x: You aren't in a game!");

            return message.channel.send(embed);
          }

          for (let games of ongoingGames) {

            if (!includesUserID(games)) {

              continue
            }

            embed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

            const indexplayer = games.map(e => e.id).indexOf(userId);

            if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2) {
              for (i = 0; i < 3; i++) {
                givewinLose("losses");
              }
              for (i = 3; i < 6; i++) {
                givewinLose("wins");
              }
            }

            if (indexplayer === 3 || indexplayer === 4 || indexplayer === 5) {
              for (i = 3; i < 6; i++) {
                givewinLose("losses");
              }
              for (i = 0; i < 3; i++) {
                givewinLose("wins");

              }
            }

            let index = ongoingGames.indexOf(games);

            ongoingGames.splice(index, 1);

            for (let channel of message.guild.channels.array()) {

              if (channel.name === `Team-1-Game-${games[6].gameID}`) {

                channel.delete()
              }

              if (channel.name === `Team-2-Game-${games[6].gameID}`) {

                channel.delete()
              }
            }

            return message.channel.send(embed);
          }
        }
        default: {
          embed.setTitle(":x: Invalid Parameters!")
          return message.channel.send(embed);
        }
      }
    }

    case "cancel": {
      if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

        embed.setTitle(":x: You aren't in a game!");

        return message.channel.send(embed);
      }
      for (let games of ongoingGames) {

        if (!includesUserID(games)) {

          continue
        }

        const IDGame = games[6].gameID

        const index = games.map(e => e.id).indexOf(userId);

        if (!Object.keys(cancelQueue).includes(IDGame.toString())) {

          cancelQueue[IDGame] = []
        }

        const cancelqueuearray = cancelQueue[IDGame]

        if (cancelqueuearray.includes(userId)) {
          embed.setTitle(":x: You've already voted to cancel!");

          return message.channel.send(embed);
        }

        cancelqueuearray.push(userId)

        embed.setTitle(`:exclamation: ${games[index].name} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/4)`)

        message.channel.send(embed)

        if (cancelqueuearray.length === 4) {

          for (let channel of message.guild.channels.array()) {

            if (channel.name === `Team-1-Game-${games[6].gameID}`) {

              channel.delete()
            }

            if (channel.name === `Team-2-Game-${games[6].gameID}`) {

              channel.delete()
            }
          }

          embed.setTitle(`:white_check_mark: Game ${games[6].gameID} Cancelled!`)

          let index = ongoingGames.indexOf(games);

          cancelQueue[IDGame] = []

          ongoingGames.splice(index, 1);

          return message.channel.send(embed)
        }

      }
      break;
    }

    case "score": {
      switch (secondArg) {
        case "me": {
          if (!includesUserID(storedData)) {

            embed.setTitle(":x: You haven't played any games yet!");

            return message.channel.send(embed);
          }

          for (let j = 0; j < storedData.length; j++) {
            if (storedData[j].id === userId) {

              const scoreDirectory = storedData[j].servers[storedData[j].servers.map(e => e.channelID).indexOf(message.channel.id)]

              if (scoreDirectory === undefined) {

                embed.setTitle(":x: You haven't played any games in here yet!");

                return message.channel.send(embed);
              }

              embed.addField("Wins:", scoreDirectory.wins);

              embed.addField("Losses:", scoreDirectory.losses);

              embed.addField("Winrate:", isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)) ? "0%" : Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100) + "%");

              return message.channel.send(embed);
            }
          }
        }
        case "channel": {

          if (!message.member.hasPermission("ADMINISTRATOR")) {

            embed.setTitle(":x: You do not have Administrator permission!")

            return message.channel.send(embed)
          }

          storedData = storedData.filter(a => a.servers.map(e => e.channelID).indexOf(channel_ID) !== -1)

          if (storedData.length === 0) {
            embed.setTitle(":x: No games have been played in here!");

            return message.channel.send(embed);
          }

          storedData.sort((a, b) => {

            const indexA = a.servers.map(e => e.channelID).indexOf(channel_ID);

            const indexB = b.servers.map(e => e.channelID).indexOf(channel_ID);

            const winrateb = isNaN(Math.floor((b.servers[indexB].wins / (b.servers[indexB].wins + b.servers[indexB].losses)) * 100)) ? 0 : Math.floor((b.servers[indexB].wins / (b.servers[indexB].wins + b.servers[indexB].losses)) * 100)

            const winratea = isNaN(Math.floor((a.servers[indexA].wins / (a.servers[indexA].wins + a.servers[indexA].losses)) * 100)) ? 0 : Math.floor((a.servers[indexA].wins / (a.servers[indexA].wins + a.servers[indexA].losses)) * 100)

            return winrateb - winratea;
          });

          if (!isNaN(thirdparam) && thirdparam > 0) {
            let indexes = 20 * (thirdparam - 1);
            for (indexes; indexes < 20 * thirdparam; indexes++) {
              if (storedData[indexes] == undefined) {

                embed.addField(`No more members to list in this page!`, "Encourage your friends to play!");

                break
              }
              for (let servers of storedData[indexes].servers) {
                if (servers.channelID === channel_ID) {

                  embed.addField(storedData[indexes].name, `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${isNaN(Math.floor((servers.wins/(servers.wins + servers.losses)) * 100))? "0" : Math.floor((servers.wins/(servers.wins + servers.losses)) * 100)}%`)

                  embed.setFooter(`Showing page ${thirdparam}/${Math.ceil(storedData.length / 20)}`);
                }
              }
            }
          } else {
            for (i = 0; i < 20; i++) {
              if (storedData[i] == undefined) {
                embed.addField(`No more members to list in this page!`, "Encourage your friends to play!");
                break
              }
              for (let servers of storedData[i].servers) {
                if (servers.channelID === channel_ID) {

                  embed.addField(storedData[i].name, `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${isNaN(Math.floor((servers.wins/(servers.wins + servers.losses)) * 100))? "0" : Math.floor((servers.wins/(servers.wins + servers.losses)) * 100)}%`)

                  embed.setFooter(`Showing page ${1}/${Math.ceil(storedData.length / 20)}`);
                }
              }
            }
          }
          message.channel.send(embed)
        }
      }
      break;
    }

    case "reset": {
      if (message.content.split(" ").length == 1) {

        embed.setTitle(":x: Invalid Parameters!")

        return message.channel.send(embed)
      }

      if (!message.member.hasPermission("ADMINISTRATOR")) {

        embed.setTitle(":x: You do not have Administrator permission!")

        return message.channel.send(embed)
      }

      switch (secondArg) {
        case "channel": {
          if (message.content.split(" ").length !== 2) {

            embed.setTitle(":x: Invalid Parameters!")

            return message.channel.send(embed)
          }

          for (let user of storedData) {

            const channelPos = user.servers.map(e => e).map(e => e.channelID).indexOf(channel_ID)

            if (channelPos !== -1) {

              await dbCollection.update({
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

          embed.setTitle(":white_check_mark: Player's score reset!")

          return message.channel.send(embed)
        }
        case "player": {
          if (message.content.split(" ").length !== 3) {

            embed.setTitle(":x: Invalid Parameters!")

            return message.channel.send(embed)

          }
          const channelPos = storedData[storedData.map(e => e.id).indexOf(thirdparam)].servers.map(e => e.channelID).indexOf(channel_ID)

          if (channelPos == -1) {

            embed.setTitle(":x: This user hasn't played any games in this channel!")

            return message.channel.send(embed)
          } else {
            await dbCollection.update({
              id: thirdparam
            }, {
              $pull: {
                servers: {
                  channelID: channel_ID
                }
              }
            });
          }

          embed.setTitle(":white_check_mark: Player's score reset!")

          return message.channel.send(embed)
        }
        default: {
          embed.setTitle(":x: Invalid Parameters!")

          return message.channel.send(embed);
        }
      }
    }

    case "q": {

      for (let person of sixMansArray) {
        if (person.id === userId) {

          embed.setTitle(":x: You're already in the queue!");

          return message.channel.send(embed);
        }
      };

      if (includesUserID(ongoingGames.flat())) {

        embed.setTitle(":x: You are in the middle of a game!");

        return message.channel.send(embed);
      };

      if (Object.entries(tempObject).length !== 0 || sixMansArray.length === 6) {

        embed.setTitle(":x: Please wait for the next game to be decided!")

        return message.channel.send(embed)
      }

      sixMansArray.push(toAdd);

      embed.setTitle(":white_check_mark: Addeed to queue!");

      message.channel.send(embed);

      if (sixMansArray.length === 6) {
        for (let user of sixMansArray) {

          const newUser = {
            id: user.id,
            name: user.name,
            servers: []
          };

          // yes i know having lots of requests isnt good ill change when i can be fucked to

          if (await dbCollection.find({
              id: user.id
            }).toArray().then(dataDB => dataDB.length === 0)) {
            (async function () {
              await dbCollection.insert(newUser);
            })()
          };

          if (await dbCollection.find({
              id: user.id,
              ["servers.channelID"]: channel_ID
            }).toArray().then(dataDB => dataDB.length === 0)) {

            (async function () {
              await dbCollection.update({
                id: user.id
              }, {
                $push: {
                  servers: {
                    channelID: channel_ID,
                    wins: 0,
                    losses: 0
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

        embed.setTitle("a game has been made! Please select your preferred gamemode: Captains (c) or Random (r) ")

        gameCount++

        const rorc = {}

        rorc[gameCount] = []

        const rorcArray = rorc[gameCount]

        message.channel.send(embed)

        let filter = m => m.content.split("")[1] === "r" || m.content.split("")[1] === "c"

        message.channel.createMessageCollector(filter, {
          time: 15000
        }).on('collect', m => {
          if (!sixMansArray.map(e => e.id).includes(m.author.id) || rorcArray.map(e => e.id).includes(m.author.id)) {

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

          shuffle(sixMansArray);

          sixMansArray.push({
            gameID: gameCount,
            time: new Date(),
            channelID: channel_ID
          })

          ongoingGames.push([...sixMansArray]);


          const discordEmbed1 = new Discord.RichEmbed()
            .setColor(EMBED_COLOR)
            .addField("Game is ready:", `Game ID is: ${gameCount}`)
            .addField(":small_orange_diamond: -Team 1-", `${sixMansArray[0].name}, ${sixMansArray[1].name}, ${sixMansArray[2].name}`)
            .addField(":small_blue_diamond: -Team 2-", `${sixMansArray[3].name}, ${sixMansArray[4].name}, ${sixMansArray[5].name}`);
          message.channel.send(discordEmbed1);

          const JoinMatchEmbed = new Discord.RichEmbed()
            .setColor(EMBED_COLOR)
            .addField("Name:", valuesforpm.name)
            .addField("Password:", valuesforpm.password)
            .addField("You have to:", `Join match(Created by ${sixMansArray[0].name})`);


          for (let users of sixMansArray) {
            if (users.id !== sixMansArray[0].id && users.id !== sixMansArray[6].id) {

              client.users.get(users.id).send(JoinMatchEmbed).catch(error => {
                const errorEmbed = new Discord.RichEmbed()
                  .setColor(EMBED_COLOR)
                  .setTitle(`:x: Couldn't sent message to ${users.name}, please check if your DM'S aren't set to friends only.`);

                console.error(error);

                message.channel.send(errorEmbed)
              });
            };
          };

          const CreateMatchEmbed = new Discord.RichEmbed()
            .setColor(EMBED_COLOR)
            .addField("Name:", valuesforpm.name)
            .addField("Password:", valuesforpm.password)
            .addField("You have to:", "Create Match");

          client.users.get(sixMansArray[0].id).send(CreateMatchEmbed).catch(error => {
            const errorEmbed = new Discord.RichEmbed()
              .setColor(EMBED_COLOR)
              .setTitle(`:x: Couldn't sent message to ${sixMansArray[0].name}, please check if your DM'S aren't set to friends only.`);

            message.channel.send(errorEmbed)
            console.error(error);
          });

          message.guild.createChannel(`Team-1-Game-${gameCount}`, {
              type: 'voice',
              parent: message.channel.parentID,
              permissionOverwrites: [{
                  id: message.guild.defaultRole,
                  deny: "CONNECT"
                },
                {
                  id: sixMansArray[0].id,
                  allow: "CONNECT"
                },
                {
                  id: sixMansArray[1].id,
                  allow: "CONNECT"
                },
                {
                  id: sixMansArray[2].id,
                  allow: "CONNECT"
                }
              ]
            })
            .catch(console.error)

          message.guild.createChannel(`Team-2-Game-${gameCount}`, {
              type: 'voice',
              parent: message.channel.parentID,
              permissionOverwrites: [{
                  id: message.guild.defaultRole,
                  deny: "CONNECT"
                },
                {
                  id: sixMansArray[3].id,
                  allow: "CONNECT"
                },
                {
                  id: sixMansArray[4].id,
                  allow: "CONNECT"
                },
                {
                  id: sixMansArray[5].id,
                  allow: "CONNECT"
                }
              ]
            })
            .catch(console.error)

          sixMansArray.splice(0, sixMansArray.length);

        } else if (getOccurrence(rorcArray.map(e => e.param), "c") > getOccurrence(rorcArray.map(e => e.param), "r")) {

          //yes this code is horrible no shit sherlock

          sixMansArray.push({
            gameID: gameCount,
            time: new Date(),
            channelID: channel_ID
          })

          tempObject[gameCount] = []

          const tempobjectArray = tempObject[gameCount]

          tempobjectArray.push([...sixMansArray]);

          for (let tempObjectLoop of tempobjectArray) {
            if (!includesUserID(tempObjectLoop)) {
              continue
            }
            const tempvar = tempObjectLoop[6]

            shuffle(tempObjectLoop);

            tempObjectLoop.splice(tempObjectLoop.findIndex(o => o.gameID === tempvar.gameID), 1)

            tempObjectLoop.push(tempvar)

            sixMansArray[0] = tempObjectLoop[0]

            sixMansArray[3] = tempObjectLoop[1]

            const CaptainsEmbed = new Discord.RichEmbed()
              .setColor(EMBED_COLOR)
              .setTitle(`Game ID: ${tempObjectLoop[6].gameID}`)
              .addField(`Captain for team 1`, tempObjectLoop[0].name)
              .addField(`Captain for team 2`, tempObjectLoop[1].name);

            message.channel.send(CaptainsEmbed)

            const privatedm0 = client.users.get(tempObjectLoop[0].id)

            const privatedm1 = client.users.get(tempObjectLoop[1].id)

            tempObjectLoop.shift()
            tempObjectLoop.shift()

            const Captain1st = new Discord.RichEmbed()
              .setColor(EMBED_COLOR)
              .setTitle("Choose one:")
              .addField(`1 :`, tempObjectLoop[0].name)
              .addField(`2 :`, tempObjectLoop[1].name)
              .addField(`3 :`, tempObjectLoop[2].name)
              .addField(`4 :`, tempObjectLoop[3].name);

            privatedm0.send(Captain1st).catch(error => {
              const errorEmbed = new Discord.RichEmbed()
                .setColor(EMBED_COLOR)
                .setTitle(`:x: Couldn't sent message to ${privatedm0}, please check if your DM'S aren't set to friends only.`);

              console.error(error);

              message.channel.send(errorEmbed)
            });

            filter = m => !isNaN(m.content) && parseInt(m.content) > -1 && parseInt(m.content) < 4

            await privatedm0.createDM().then(m => {
              m.createMessageCollector(filter, {
                time: 20000
              }).on('collect', m => {
                const parsedM = parseInt(m) - 1
                if (!hasVoted) {

                  sixMansArray[1] = tempObjectLoop[parsedM]

                  tempObjectLoop.splice(parsedM, 1)

                  hasVoted = true
                }
              })
            })

            await new Promise(resolve => setTimeout(resolve, 20000));

            if (!hasVoted) {

              const randomnumber = Math.floor(Math.random() * 4)

              sixMansArray[1] = tempObjectLoop[randomnumber]

              tempObjectLoop.splice(randomnumber, 1)
            }

            hasVoted = false

            const Captain2nd = new Discord.RichEmbed()
              .setColor(EMBED_COLOR)
              .setTitle("Choose two:")
              .addField(`1 :`, tempObjectLoop[0].name)
              .addField(`2 :`, tempObjectLoop[1].name)
              .addField(`3 :`, tempObjectLoop[2].name);

            privatedm1.send(Captain2nd).catch(error => {
              const errorEmbed = new Discord.RichEmbed()
                .setColor(EMBED_COLOR)
                .setTitle(`:x: Couldn't sent message to ${privatedm1}, please check if your DM'S aren't set to friends only.`);

              console.error(error);

              message.channel.send(errorEmbed)
            });

            filter = m => !isNaN(m.content) && parseInt(m.content) > -1 && parseInt(m.content) < 4

            privatedm1.createDM().then(m => {
              m.createMessageCollector(filter, {
                time: 20000
              }).on('collect', m => {

                const parsedM = parseInt(m) - 1

                if (!hasVoted) {

                  sixMansArray[4] = tempObjectLoop[parsedM]

                  hasVoted = true

                  usedNums.push(parsedM)

                } else if (hasVoted && !usedNums.includes(parsedM) && hasVoted !== "all") {

                  sixMansArray[5] = tempObjectLoop[parsedM]

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

            const randomnumber = Math.floor(Math.random() * 3)

            let randomnumber2 = Math.floor(Math.random() * 3)

            if (!hasVoted) {

              while (randomnumber === randomnumber2) {
                randomnumber2 = Math.floor(Math.random() * 3)
              }

              sixMansArray[4] = tempObjectLoop[randomnumber]

              sixMansArray[5] = tempObjectLoop[randomnumber2]

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

              sixMansArray[5] = tempObjectLoop[randomnumber2]

              tempObjectLoop.splice(usedNums[0], 1)

              if (randomnumber2 > usedNums[0]) {

                tempObjectLoop.splice(randomnumber2 - 1, 1)
              } else {

                tempObjectLoop.splice(randomnumber2, 1)
              }
            }

            sixMansArray[2] = tempObjectLoop[0]

            delete tempObject[gameCount]

            ongoingGames.push([...sixMansArray])

            const discordEmbed1 = new Discord.RichEmbed()
              .setColor(EMBED_COLOR)
              .addField("Game is ready:", `Game ID is: ${sixMansArray[6].gameID}`)
              .addField(":small_orange_diamond: -Team 1-", `${sixMansArray[0].name}, ${sixMansArray[1].name}, ${sixMansArray[2].name}`)
              .addField(":small_blue_diamond: -Team 2-", `${sixMansArray[3].name}, ${sixMansArray[4].name}, ${sixMansArray[5].name}`);
            message.channel.send(discordEmbed1);

            const JoinMatchEmbed = new Discord.RichEmbed()
              .setColor(EMBED_COLOR)
              .addField("Name:", valuesforpm.name)
              .addField("Password:", valuesforpm.password)
              .addField("You have to:", `Join match(Created by ${sixMansArray[0].name})`);

            for (let users of sixMansArray) {
              if (users.id !== sixMansArray[0].id && users.id !== sixMansArray[6].id) {

                client.users.get(users.id).send(JoinMatchEmbed).catch(error => {
                  const errorEmbed = new Discord.RichEmbed()
                    .setColor(EMBED_COLOR)
                    .setTitle(`:x: Couldn't sent message to ${users.name}, please check if your DM'S aren't set to friends only.`);

                  console.error(error);

                  message.channel.send(errorEmbed)
                });
              };
            };

            const CreateMatchEmbed = new Discord.RichEmbed()
              .setColor(EMBED_COLOR)
              .addField("Name:", valuesforpm.name)
              .addField("Password:", valuesforpm.password)
              .addField("You have to:", "Create Match");

            client.users.get(sixMansArray[0].id).send(CreateMatchEmbed).catch(error => {
              const errorEmbed = new Discord.RichEmbed()
                .setColor(EMBED_COLOR)
                .setTitle(`:x: Couldn't sent message to ${sixMansArray[0].name}, please check if your DM'S aren't set to friends only.`);

              message.channel.send(errorEmbed)
              console.error(error);
            });

            message.guild.createChannel(`Team-1-Game-${sixMansArray[6].gameID}`, {
                type: 'voice',
                parent: message.channel.parentID,
                permissionOverwrites: [{
                    id: message.guild.defaultRole,
                    deny: "CONNECT"
                  },
                  {
                    id: sixMansArray[0].id,
                    allow: "CONNECT"
                  },
                  {
                    id: sixMansArray[1].id,
                    allow: "CONNECT"
                  },
                  {
                    id: sixMansArray[2].id,
                    allow: "CONNECT"
                  }
                ]
              })
              .catch(console.error)

            message.guild.createChannel(`Team-2-Game-${gameCount}`, {
                type: 'voice',
                parent: message.channel.parentID,
                permissionOverwrites: [{
                    id: message.guild.defaultRole,
                    deny: "CONNECT"
                  },
                  {
                    id: sixMansArray[3].id,
                    allow: "CONNECT"
                  },
                  {
                    id: sixMansArray[4].id,
                    allow: "CONNECT"
                  },
                  {
                    id: sixMansArray[5].id,
                    allow: "CONNECT"
                  }
                ]
              })
              .catch(console.error)

            sixMansArray.splice(0, sixMansArray.length);

          }
        }
      };
    }
  };
};

module.exports = {
  name: ['q', "status", "leave", "report", "score", "cancel", "reset", "r", "c"],
  description: '6man bot',
  execute
};