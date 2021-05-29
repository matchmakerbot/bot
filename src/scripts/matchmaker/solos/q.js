const Discord = require("discord.js");

const client = require("../../../utils/createClientInstance.js");

const OngoingGamesCollection = require("../../../utils/schemas/ongoingGamesSchema.js");

const MatchmakerCollection = require("../../../utils/schemas/matchmakerUsersSchema");
// make mmr based system (the worse the team is the higher mmr they win if they win the match and vice versa,) not just add 13 and subtract 10 like a retard
// 2 players with highest mmr are the captains
// balance randoms by mmr
const {
  EMBED_COLOR_CHECK,
  getQueueArray,
  EMBED_COLOR_ERROR,
  includesUserId,
  channelQueues,
  joinTeam1And2,
  fetchGames,
  EMBED_COLOR_WARNING,
} = require("../utils");

const rc = ["r", "c"];

const reactEmojisCaptains = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

const reactEmojisrorc = ["🇨", "🇷"];

let gameCount = 0;

const getOccurrence = (array, value) => {
  return array.filter((v) => v === value).length;
};

const filterReactionrorc = (reaction, user, queueArray) =>
  reactEmojisrorc.includes(reaction.emoji.name) && queueArray.map((e) => e.id).includes(user.id);

const filterReactionCaptains = (reaction, user) =>
  user.id !== "571839826744180736" && reactEmojisCaptains.includes(reaction.emoji.name);

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

const choose2Players = async (dm, team, queue, captainsObject, message) => {
  if (queue.length < 2) return false;
  const CaptainRepeatingEmbed = new Discord.MessageEmbed()
    .setColor(EMBED_COLOR_WARNING)
    .setTitle("Choose two ( you have 30 seconds):");
  for (let k = 0; k < queue.length; k++) {
    CaptainRepeatingEmbed.addField(`${k + 1} :`, queue[k].name);
  }
  const privateDmMessage = await dm.send(CaptainRepeatingEmbed).catch((error) => {
    const errorEmbed = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_WARNING)
      .setTitle(`:x: Couldn't sent message to ${dm.username}, please check if your DM'S aren't set to friends only.`);

    console.error(error);

    message.channel.send(errorEmbed);
  });

  for (let i = 0; i < queue.length; i++) {
    privateDmMessage.react(reactEmojisCaptains[i]);
  }

  await privateDmMessage
    .awaitReactions(filterReactionCaptains, { max: 2, time: 30000 })
    .then((collected) => {
      if (collected.first() != null) {
        if (reactEmojisCaptains.indexOf(collected.first().emoji.name) < queue.length) {
          const num = reactEmojisCaptains.indexOf(collected.first().emoji.name);

          team.push(queue[num]);

          captainsObject.usedNums.push(num);
        }
      }
      if (collected.last() != null) {
        if (
          collected.last().emoji.name !== collected.first().emoji.name &&
          reactEmojisCaptains.indexOf(collected.last().emoji.name) < queue.length &&
          reactEmojisCaptains.indexOf(collected.first().emoji.name) < queue.length
        ) {
          const num2 = reactEmojisCaptains.indexOf(collected.last().emoji.name);

          team.push(queue[num2]);

          captainsObject.usedNums.push(num2);

          queue.splice(captainsObject.usedNums[0], 1);

          if (captainsObject.usedNums[1] > captainsObject.usedNums[0]) {
            queue.splice(captainsObject.usedNums[1] - 1, 1);
          } else {
            queue.splice(captainsObject.usedNums[1], 1);
          }
        }
      }
    })
    .catch((e) => {
      console.error(e);
    });

  if (captainsObject.usedNums.length === 0) {
    team.push(queue[0]);

    team.push(queue[1]);

    queue.splice(0, 2);
  } else if (captainsObject.usedNums.length === 1) {
    queue.splice(captainsObject.usedNums[0], 1);

    team.push(queue[0]);

    queue.shift();
  }

  captainsObject.usedNums.splice(0, captainsObject.usedNums.length);
  return true;
};

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const userId = message.author.id;

  const queueArray = getQueueArray(queueSize, message.channel.id);

  const channelId = message.channel.id;

  if (queueArray.find((e) => e.id === userId) != null) {
    wrongEmbed.setTitle(":x: You're already in the queue!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (includesUserId(channelQueues.map((e) => e.players).flat(), userId)) {
    const channelQueued = (
      await client.channels.fetch(channelQueues.find((e) => includesUserId(e.players, userId)).channelId)
    ).name;
    wrongEmbed.setTitle(`:x: You're already queued in the channel ${channelQueued}!`);

    message.channel.send(wrongEmbed);
    return;
  }

  const storedGames = await fetchGames();

  for (const game of storedGames) {
    if (includesUserId(joinTeam1And2(game), userId)) {
      wrongEmbed.setTitle(":x: You are in the middle of a game!");

      message.channel.send(wrongEmbed);
      return;
    }
  }

  if (queueArray.length > queueSize - 1) {
    wrongEmbed.setTitle(":x: Please wait for the next game to be decided!");

    message.channel.send(wrongEmbed);
    return;
  }

  const toAdd = {
    id: userId,
    name: message.author.username,
    date: new Date(),
  };

  queueArray.push(toAdd);

  correctEmbed.setTitle(`:white_check_mark: Added to queue! ${queueArray.length}/${queueSize}`);

  message.channel.send(correctEmbed);

  if (queueArray.length === queueSize) {
    try {
      gameCount++;

      const gameCreatedObj = {
        queueSize,
        gameId: gameCount,
        time: new Date(),
        channelId,
        team1: [],
        team2: [],
        voiceChannelIds: [],
      };
      const promises = [];
      for (const user of queueArray) {
        const dbRequest = MatchmakerCollection.findOne({
          id: user.id,
        }).then(async (storedUser) => {
          if (storedUser == null) {
            const newUser = {
              id: user.id,
              name: user.name,
              servers: [
                {
                  channelId,
                  wins: 0,
                  losses: 0,
                  mmr: 1000,
                },
              ],
            };

            const matchmakerInsert = new MatchmakerCollection(newUser);

            await matchmakerInsert.save();
          } else if (!storedUser.servers.map((e) => e.channelId).includes(channelId)) {
            await MatchmakerCollection.update(
              {
                id: user.id,
              },
              {
                $push: {
                  servers: {
                    channelId,
                    wins: 0,
                    losses: 0,
                    mmr: 1000,
                  },
                },
              }
            );
          }
        });
        promises.push(dbRequest);
      }
      await Promise.all(promises);

      const valuesforpm = {
        name: Math.floor(Math.random() * 99999) + 100,
        password: Math.floor(Math.random() * 99999) + 100,
      };

      await message.channel.send(queueArray.reduce((acc = "", curr) => `${acc}<@${curr.id}>, `, ""));

      correctEmbed.setTitle(
        "A game has been made! Please select your preferred gamemode: Captains (Reaction C) or Random (Reaction R) (Captains disabled for queues with less than 6 players)"
      );

      const rorcCount = {
        r: 0,
        c: 0,
      };

      const rorcMessage = await message.channel.send(correctEmbed);

      rorcMessage.react("🇨");

      rorcMessage.react("🇷");

      await rorcMessage
        .awaitReactions((reaction, user) => filterReactionrorc(reaction, user, queueArray), {
          max: queueSize,
          time: 20000,
        })
        .then((collected) => {
          collected.forEach((e) => (e._emoji.name === "🇷" ? rorcCount.r++ : rorcCount.c++));
        });

      if (rorcCount.r === rorcCount.c) {
        Math.floor(Math.random()) === 0 ? rorcCount.r++ : rorcCount.c++;
      }
      if (rorcCount.r > rorcCount.c) {
        shuffle(queueArray);

        for (let i = 0; i < queueArray.length / 2; i++) {
          gameCreatedObj.team1.push(queueArray[i]);
        }

        for (let i = queueArray.length / 2; i < queueArray.length; i++) {
          gameCreatedObj.team2.push(queueArray[i]);
        }
      } else {
        let hasVoted = false;

        const captainsObject = {
          captain1: null,
          captain2: null,
          team1: [],
          team2: [],
          usedNums: [],
        };

        const queueArrayCopy = [...queueArray];

        shuffle(queueArrayCopy);

        [captainsObject.captain1, captainsObject.captain2] = queueArrayCopy;

        queueArrayCopy.splice(0, 2);

        const CaptainsEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .setTitle(`Game Id: ${gameCreatedObj.gameId}`)
          .addField("Captain for team 1", captainsObject.captain1.name)
          .addField("Captain for team 2", captainsObject.captain2.name);

        message.channel.send(CaptainsEmbed);

        const privateDmCaptain1 = await client.users
          .fetch(captainsObject.captain1.id)
          .catch(() => message.channel.send("Invalid captain"));

        const privateDmCaptain2 = await client.users
          .fetch(captainsObject.captain2.id)
          .catch(() => message.channel.send("Invalid captain"));

        const Captain1Embed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .setTitle("Choose one ( you have 30 seconds):");
        for (let k = 0; k < queueArrayCopy.length; k++) {
          Captain1Embed.addField(`${k + 1} :`, queueArrayCopy[k].name);
        }

        const privateDmCaptain1Message = await privateDmCaptain1.send(Captain1Embed).catch((error) => {
          const errorEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle(
              `:x: Couldn't sent message to ${privateDmCaptain1.username}, please check if your DM'S aren't set to friends only.`
            );

          console.error(error);

          message.channel.send(errorEmbed);
        });

        for (let i = 0; i < queueArrayCopy.length; i++) {
          privateDmCaptain1Message.react(reactEmojisCaptains[i]);
        }

        await privateDmCaptain1Message
          .awaitReactions(filterReactionCaptains, { max: 1, time: 30000 })
          .then((collected) => {
            if (collected.first() != null) {
              const num = reactEmojisCaptains.indexOf(collected.first().emoji.name);

              captainsObject.team1.push(queueArrayCopy[num]);

              queueArrayCopy.splice(num, 1);

              hasVoted = true;
            }
          })
          .catch((e) => {
            console.error(e);
          });

        if (!hasVoted) {
          captainsObject.team1.push(queueArrayCopy[0]);

          queueArrayCopy.shift();
        }

        hasVoted = false;
        const captains = [
          {
            captainDm: privateDmCaptain2,
            team: captainsObject.team2,
          },
          {
            captainDm: privateDmCaptain1,
            team: captainsObject.team1,
          },
        ];
        let wasLastCaptainTeam1;
        while (queueArrayCopy.length > 1) {
          for (const captain of captains) {
            // eslint-disable-next-line no-await-in-loop
            wasLastCaptainTeam1 = await choose2Players(
              captain.captainDm,
              captain.team,
              queueArrayCopy,
              captainsObject,
              message
            );
          }
        }

        delete rorc[gameCount];

        const teamChosen = !wasLastCaptainTeam1 ? "team1" : "team2";

        captainsObject[teamChosen].push(queueArrayCopy[0]);

        queueArrayCopy.splice(0, queueArrayCopy.length);

        captainsObject.team1.push(captainsObject.captain1);

        captainsObject.team2.push(captainsObject.captain2);

        gameCreatedObj.team1 = [...captainsObject.team1];

        gameCreatedObj.team2 = [...captainsObject.team2];
      }
      const permissionOverwritesTeam1 = [
        {
          id: message.guild.id,
          deny: "CONNECT",
        },
      ];

      for (const user of gameCreatedObj.team1) {
        permissionOverwritesTeam1.push({
          id: user.id,
          allow: "CONNECT",
        });
      }

      const orangeTeamVc = await message.guild.channels
        .create(`🔸Team-1-Game-${gameCreatedObj.gameId}`, {
          type: "voice",
          parent: message.channel.parentID,
          permissionOverwrites: permissionOverwritesTeam1,
        })
        .catch(() =>
          message.channel.send("Error creating voice channels, are you sure the bot has permissions to do so?")
        );

      gameCreatedObj.voiceChannelIds.push({
        id: orangeTeamVc.id,
        channelName: `🔸Team-1-Game-${gameCreatedObj.gameId}`,
        channel: channelId,
      });

      const permissionOverwritesTeam2 = [
        {
          id: message.guild.id,
          deny: "CONNECT",
        },
      ];

      for (const user of gameCreatedObj.team2) {
        permissionOverwritesTeam2.push({
          id: user.id,
          allow: "CONNECT",
        });
      }

      const blueTeamVc = await message.guild.channels
        .create(`🔹Team-2-Game-${gameCreatedObj.gameId}`, {
          type: "voice",
          parent: message.channel.parentID,
          permissionOverwrites: permissionOverwritesTeam2,
        })
        .catch(() =>
          message.channel.send("Error creating voice channels, are you sure the bot has permissions to do so?")
        );

      gameCreatedObj.voiceChannelIds.push({
        id: blueTeamVc.id,
        channelName: `🔹Team-2-Game-${gameCreatedObj.gameId}`,
        channel: channelId,
      });

      const ongoingGamesInsert = new OngoingGamesCollection(gameCreatedObj);

      await ongoingGamesInsert.save();

      const discordEmbed1 = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_WARNING)
        .addField("Game is ready:", `Game Id is: ${gameCreatedObj.gameId}`)
        .addField(
          ":small_orange_diamond: -Team 1-",
          gameCreatedObj.team1.reduce((acc = "", curr) => `${acc}<@${curr.id}>, `, "")
        )
        .addField(
          ":small_blue_diamond: -Team 2-",
          gameCreatedObj.team2.reduce((acc = "", curr) => `${acc}<@${curr.id}>, `, "")
        );
      message.channel.send(discordEmbed1);

      const JoinMatchEmbed = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_WARNING)
        .addField("Name:", valuesforpm.name)
        .addField("Password:", valuesforpm.password)
        .addField("You have to:", `Join match(Created by ${gameCreatedObj.team1[0].name})`);

      const playersArray = gameCreatedObj.team1.concat(gameCreatedObj.team2);

      for (const users of playersArray) {
        if (users.id !== gameCreatedObj.team1[0].id) {
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

      const CreateMatchEmbed = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_WARNING)
        .addField("Name:", valuesforpm.name)
        .addField("Password:", valuesforpm.password)
        .addField("You have to:", "Create Custom Match");

      const fetchedUser = await client.users
        .fetch(gameCreatedObj.team1[0].id)
        .catch(() => message.channel.send("Invalid User"));

      await fetchedUser.send(CreateMatchEmbed).catch((error) => {
        const errorEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .setTitle(
            `:x: Couldn't sent message to ${gameCreatedObj.team1[0].name}, please check if your DM'S aren't set to friends only.`
          );

        message.channel.send(errorEmbed);
        console.error(error);
      });

      queueArray.splice(0, queueArray.length);
    } catch (e) {
      wrongEmbed.setTitle("Error creating teams, resetting queue.");

      message.channel.send(wrongEmbed);

      queueArray.splice(0, queueSize);

      console.error(e);
    }
  }
};

module.exports = {
  name: "q",
  description: "6man bot",
  execute,
};
