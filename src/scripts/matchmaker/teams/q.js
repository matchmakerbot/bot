const Discord = require("discord.js");

const OngoingGamesTeamsSchema = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const client = require("../../../utils/createClientInstance.js");

const TeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const ChannelsCollection = require("../../../utils/schemas/channelsSchema.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  EMBED_COLOR_WARNING,
  fetchTeamByGuildAndUserId,
  channelQueues,
  getQueueArray,
  shuffle,
  gameCount,
  fetchGamesTeams,
  sendMessage,
} = require("../../../utils/utils");

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const channelId = message.channel.id;

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  const queueArray = getQueueArray(queueSize, channelId, message.guild.id);

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You don't belong to a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (fetchedTeam.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (queueArray[0]?.name === fetchedTeam.name) {
    wrongEmbed.setTitle(":x: You're already in the queue");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (
    channelQueues
      .filter((e) => e.guildId === message.guild.id)
      .map((e) => e.players)
      .flat()
      .map((e) => e.name)
      .flat()
      .includes(fetchedTeam.name)
  ) {
    wrongEmbed.setTitle(":x: You're already queued in another channel!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const ongoingGames = await fetchGamesTeams(null, message.guild.id);

  if (
    ongoingGames
      .map((e) => [e.team1, e.team2])
      .flat()
      .map((e) => e.name)
      .includes(fetchedTeam.name)
  ) {
    wrongEmbed.setTitle(":x: Your team is in the middle of a game!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (fetchedTeam.members.length + 1 < queueSize / 2 || (fetchedTeam.members.length === 0 && queueSize !== 2)) {
    wrongEmbed.setTitle(
      `:x: You need at least ${queueSize / 2} members on your team to join the queue (including you)`
    );

    sendMessage(message, wrongEmbed);
    return;
  }

  if (message.content.split(" ").length !== queueSize / 2) {
    wrongEmbed.setTitle(`:x: Please tag ${queueSize / 2 - 1} teammates to play with you`);

    sendMessage(message, wrongEmbed);
    return;
  }

  let isInTeam = true;

  message.mentions.members.forEach((e) => {
    if (!fetchedTeam.members.includes(e.user.id)) {
      wrongEmbed.setTitle(`:x: ${e.user.username} is not on your team!`);

      sendMessage(message, wrongEmbed);
      isInTeam = false;
    }
  });

  if (!isInTeam) return;
  const teamMmr =
    fetchedTeam.channels.map((e) => e.channelId).indexOf(channelId) !== -1
      ? fetchedTeam.channels[fetchedTeam.channels.map((e) => e.channelId).indexOf(channelId)].mmr
      : 1000;

  const toPush = {
    name: fetchedTeam.name,
    captain: fetchedTeam.captain,
    mmr: teamMmr,
    members: [...message.mentions.members.map((e) => e.user.id)],
    date: new Date(),
  };

  queueArray.push(toPush);

  correctEmbed.setTitle(`:white_check_mark: Added to queue! ${queueArray.length}/2`);

  sendMessage(message, correctEmbed);

  if (queueArray.length === 2) {
    try {
      gameCount.value++;

      shuffle(queueArray);

      const gameCreatedObj = {
        queueSize,
        gameId: gameCount.value,
        date: new Date(),
        channelId,
        guildId: message.guild.id,
        team1: queueArray[0],
        team2: queueArray[1],
        channelIds: [],
      };
      const promises = [];
      queueArray.forEach((team) => {
        const dbRequest = TeamsCollection.findOne({
          name: team.name,
          guildId: message.guild.id,
        }).then(async (storedTeam) => {
          if (!storedTeam.channels.map((e) => e.channelId).includes(channelId)) {
            await TeamsCollection.updateOne(
              {
                name: team.name,
                guildId: message.guild.id,
              },
              {
                $push: {
                  channels: {
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
      });
      await Promise.all(promises);

      const valuesforpm = {
        name: Math.floor(Math.random() * 99999) + 100,
        password: Math.floor(Math.random() * 99999) + 100,
      };

      const channelData = await ChannelsCollection.findOne({ id: message.channel.id });

      if (channelData.createVoiceChannels) {
        const permissionOverwritesTeam1 = [
          {
            id: message.guild.id,
            deny: "CONNECT",
          },
        ];

        [gameCreatedObj.team1.captain, ...gameCreatedObj.team1.members].forEach((id) => {
          permissionOverwritesTeam1.push({
            id,
            allow: "CONNECT",
          });
        });

        await message.guild.channels
          .create(`🔸Team-${gameCreatedObj.team1.name}-Game-${gameCreatedObj.gameId}`, {
            type: "voice",
            parent: message.channel.parentID,
            permissionOverwrites: permissionOverwritesTeam1,
          })
          .then((e) => {
            gameCreatedObj.channelIds.push({
              id: e.id,
              channelName: `🔸Team-${gameCreatedObj.team1.name}-Game-${gameCreatedObj.gameId}`,
              channel: channelId,
            });
          })
          .catch(() =>
            sendMessage(message, "Error creating voice channels, are you sure the bot has permissions to do so?")
          );

        const permissionOverwritesTeam2 = [
          {
            id: message.guild.id,
            deny: "CONNECT",
          },
        ];

        [gameCreatedObj.team2.captain, ...gameCreatedObj.team2.members].forEach((id) => {
          permissionOverwritesTeam2.push({
            id,
            allow: "CONNECT",
          });
        });

        await message.guild.channels
          .create(`🔹Team-${gameCreatedObj.team2.name}-Game-${gameCreatedObj.gameId}`, {
            type: "voice",
            parent: message.channel.parentID,
            permissionOverwrites: permissionOverwritesTeam2,
          })
          .then((e) => {
            gameCreatedObj.channelIds.push({
              id: e.id,
              channelName: `🔹Team-${gameCreatedObj.team2.name}-Game-${gameCreatedObj.gameId}`,
              channel: channelId,
            });
          })
          .catch(() =>
            sendMessage(message, "Error creating voice channels, are you sure the bot has permissions to do so?")
          );
      }

      if (channelData.createTextChannels) {
        const permissionOverwrites = [
          {
            id: message.guild.id,
            deny: "VIEW_CHANNEL",
          },
        ];

        [
          gameCreatedObj.team2.captain,
          ...gameCreatedObj.team2.members,
          gameCreatedObj.team1.captain,
          ...gameCreatedObj.team1.members,
        ].forEach((user) => {
          permissionOverwrites.push({
            id: user,
            allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "SEND_MESSAGES"],
            deny: "MANAGE_MESSAGES",
          });
        });

        await message.guild.channels
          .create(`Matchmaker-Game-${gameCreatedObj.gameId}`, {
            type: "text",
            parent: message.channel.parentID,
            permissionOverwrites,
          })
          .then(async (e) => {
            gameCreatedObj.channelIds.push({
              id: e.id,
              channelName: e.name,
              channel: channelId,
            });
          })
          .catch(() =>
            sendMessage(message, "Error creating text chat, are you sure the bot has permissions to do so?")
          );
      }

      sendMessage(
        message,
        `<@${gameCreatedObj.team1.captain}>, ${gameCreatedObj.team1.members.reduce(
          (acc = "", curr) => `${acc}<@${curr}>, `,
          ""
        )} <@${gameCreatedObj.team1.captain}>, ${gameCreatedObj.team1.members.reduce(
          (acc = "", curr) => `${acc}<@${curr}>, `,
          ""
        )} `
      );

      const discordEmbed1 = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_CHECK)
        .addField("Game is ready:", `Game ID is: ${gameCreatedObj.gameId}`)
        .addField(
          `:small_orange_diamond: Team ${gameCreatedObj.team1.name}`,
          `<@${gameCreatedObj.team1.captain}>, ${gameCreatedObj.team1.members.reduce(
            (acc = "", curr) => `${acc}<@${curr}>, `,
            ""
          )}`
        )
        .addField(
          `:small_blue_diamond: Team ${gameCreatedObj.team2.name}`,
          `<@${gameCreatedObj.team2.captain}>, ${gameCreatedObj.team2.members.reduce(
            (acc = "", curr) => `${acc}<@${curr}>, `,
            ""
          )}`
        );

      sendMessage(message, discordEmbed1);

      if (channelData.sendDirectMessage) {
        const JoinMatchEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_CHECK)
          .addField("Name:", valuesforpm.name)
          .addField("Password:", valuesforpm.password)
          .addField("You have to:", `Join match(Created by <@${gameCreatedObj.team1.captain}>)`);

        [...gameCreatedObj.team1.members, ...gameCreatedObj.team2.members, gameCreatedObj.team2.captain].forEach(
          (id) => {
            const fetchedUser = client.users
              .fetch(id)
              .then(async (user) => {
                try {
                  await user.send(JoinMatchEmbed);
                } catch (error) {
                  const errorEmbed = new Discord.MessageEmbed()
                    .setColor(EMBED_COLOR_WARNING)
                    .setTitle(
                      `:x: Couldn't sent message to <@${id}>, please check if your DM'S aren't set to friends only.`
                    );

                  sendMessage(message, errorEmbed);
                }
              })
              .catch(() => sendMessage(message, "Invalid User"));
            promises.push(fetchedUser);
          }
        );

        const CreateMatchEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_CHECK)
          .addField("Name:", valuesforpm.name)
          .addField("Password:", valuesforpm.password)
          .addField("You have to:", "Create Custom Match");

        const create1 = await client.users.fetch(gameCreatedObj.team1.captain);
        create1.send(CreateMatchEmbed).catch((error) => {
          const errorEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_ERROR)
            .setTitle(
              `:x: Couldn't sent message to <@${gameCreatedObj.team1.captain}>, please check if your DM'S aren't set to friends only.`
            );

          sendMessage(message, errorEmbed);
          console.error(error);
        });
      }
      const ongoingGamesInsert = new OngoingGamesTeamsSchema(gameCreatedObj);

      await ongoingGamesInsert.save();
      queueArray.splice(0, queueArray.length);
    } catch (e) {
      wrongEmbed.setTitle("Error creating teams, resetting queue.");

      sendMessage(message, wrongEmbed);

      queueArray.splice(0, queueArray.length);

      console.error(e);
    }
  }
};

module.exports = {
  name: "q",
  description:
    "Enter the queue. To do this do !q and tag your other teammates(depending on the qeueSize) example: !q @Dany @Johny @Tony @David (removes team after 45 minutes if no game has been made)",
  execute,
};
