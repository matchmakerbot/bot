const Discord = require("discord.js");

const logger = require("pino")();

const client = require("../../../utils/createClientInstance.js");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const MatchmakerTeamsScoreCollection = require("../../../utils/schemas/matchmakerTeamsScoreSchema");

const ChannelsCollection = require("../../../utils/schemas/channelsSchema.js");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  EMBED_COLOR_WARNING,
  getQueueArray,
  shuffle,
  gameCount,
  sendReply,
  sendFollowUp,
} = require("../../../utils/utils");

const numberOfUsersArr = [1, 2, 3, 4, 5];

const execute = async (interaction, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const channelId = interaction.channel.id;

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    guildId: interaction.guild.id,
    captain: interaction.member.id,
  });

  const channelQueues = await redisInstance.getObject("channelQueues");

  const queueArray = getQueueArray(channelQueues, queueSize, interaction.channel.id, interaction.guild.id);

  if (!fetchedTeam) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (queueArray[0]?.name === fetchedTeam.name) {
    wrongEmbed.setTitle(":x: You're already in the queue");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (
    channelQueues
      .filter((e) => e.guildId === interaction.guild.id)
      .map((e) => e.players[0])
      .map((e) => e?.name)
      .includes(fetchedTeam?.name)
  ) {
    wrongEmbed.setTitle(":x: You're already queued in another channel!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const ongoingGame = await OngoingGamesTeamsCollection.findOne({
    guildId: interaction.guild.id,
    $or: [
      {
        "team1.name": fetchedTeam.name,
      },
      {
        "team2.name": fetchedTeam.name,
      },
    ],
  });

  if (ongoingGame != null) {
    wrongEmbed.setTitle(":x: Your team is in the middle of a game!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (fetchedTeam.memberIds.length + 1 < queueSize / 2 || (fetchedTeam.memberIds.length === 0 && queueSize !== 2)) {
    wrongEmbed.setTitle(
      `:x: You need at least ${queueSize / 2} members on your team to join the queue (including you)`
    );

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const pingedUsers = numberOfUsersArr.map((e) => interaction.options.getUser(`user${e}`)).filter((e) => e != null);

  if (pingedUsers.length !== queueSize / 2 - 1) {
    wrongEmbed.setTitle(`:x: Please tag ${queueSize / 2 - 1} teammates to play with you`);

    await sendReply(interaction, wrongEmbed);
    return;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const pingedUser of pingedUsers) {
    if (!fetchedTeam.memberIds.includes(pingedUser.id)) {
      wrongEmbed.setTitle(`:x: <@${pingedUser.username} is not on your team!`);

      // eslint-disable-next-line no-await-in-loop
      await sendReply(interaction, wrongEmbed);
      return;
    }
  }

  const toPush = {
    name: fetchedTeam.name,
    captain: fetchedTeam.captain,
    mmr: null,
    memberIds: pingedUsers.map((e) => e.id),
    date: new Date(),
  };

  queueArray.push(toPush);

  await redisInstance.setObject("channelQueues", channelQueues);

  correctEmbed.setTitle(`:white_check_mark: Added to queue! ${queueArray.length}/2`);

  await sendReply(interaction, correctEmbed);

  if (queueArray.length === 2) {
    try {
      gameCount.value++;

      shuffle(queueArray);

      const gameCreatedObj = {
        queueSize,
        gameId: gameCount.value,
        date: new Date(),
        channelId,
        guildId: interaction.guild.id,
        team1: queueArray[0],
        team2: queueArray[1],
        channelIds: [],
      };

      const promises = [];

      const teamsInDb = await MatchmakerTeamsScoreCollection.find({
        $or: queueArray.map((e) => ({ name: e.name })),
        guildId: interaction.guild.id,
      });

      queueArray.forEach((team) => {
        const thisTeam = gameCreatedObj.team1.name === team.name ? gameCreatedObj.team1 : gameCreatedObj.team2;
        if (!teamsInDb.find((e) => e.name === team.name)) {
          const newUser = {
            name: team.name,
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
          };

          teamsInDb.push({ ...newUser });

          thisTeam.mmr = 1000;

          const matchmakerInsert = new MatchmakerTeamsScoreCollection(newUser);

          promises.push(matchmakerInsert.save());
        } else {
          thisTeam.mmr = teamsInDb.find((e) => e.name === team.name).mmr;
        }
      });

      await Promise.all(promises);

      const valuesforpm = {
        name: Math.floor(Math.random() * 99999) + 100,
        password: Math.floor(Math.random() * 99999) + 100,
      };

      const channelData = await ChannelsCollection.findOne({ channelId: interaction.channel.id });

      if (channelData.createVoiceChannels) {
        const permissionOverwritesTeam1 = [
          {
            id: interaction.guild.id,
            deny: "CONNECT",
          },
        ];

        [gameCreatedObj.team1.captain, ...gameCreatedObj.team1.memberIds].forEach((id) => {
          permissionOverwritesTeam1.push({
            id,
            allow: "CONNECT",
          });
        });

        await interaction.guild.channels
          .create(`🔸Team-${gameCreatedObj.team1.name}-Game-${gameCreatedObj.gameId}`, {
            type: "GUILD_VOICE",
            permissionOverwrites: permissionOverwritesTeam1,
          })
          .then((e) => {
            e.setParent(interaction.channel.parentId);
            gameCreatedObj.channelIds.push(e.id);
          })
          .catch(() =>
            sendFollowUp(interaction, "Error creating voice channels, are you sure the bot has permissions to do so?")
          );

        const permissionOverwritesTeam2 = [
          {
            id: interaction.guild.id,
            deny: "CONNECT",
          },
        ];

        [gameCreatedObj.team2.captain, ...gameCreatedObj.team2.memberIds].forEach((id) => {
          permissionOverwritesTeam2.push({
            id,
            allow: "CONNECT",
          });
        });

        await interaction.guild.channels
          .create(`🔹Team-${gameCreatedObj.team2.name}-Game-${gameCreatedObj.gameId}`, {
            type: "GUILD_VOICE",
            permissionOverwrites: permissionOverwritesTeam2,
          })
          .then((e) => {
            e.setParent(interaction.channel.parentId);
            gameCreatedObj.channelIds.push(e.id);
          })
          .catch(() =>
            sendFollowUp(interaction, "Error creating voice channels, are you sure the bot has permissions to do so?")
          );
      }

      if (channelData.createTextChannels) {
        const permissionOverwrites = [
          {
            id: interaction.guild.id,
            deny: "VIEW_CHANNEL",
          },
        ];

        [
          gameCreatedObj.team2.captain,
          ...gameCreatedObj.team2.memberIds,
          gameCreatedObj.team1.captain,
          ...gameCreatedObj.team1.memberIds,
        ].forEach((user) => {
          permissionOverwrites.push({
            id: user,
            allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY", "SEND_MESSAGES"],
            deny: "MANAGE_MESSAGES",
          });
        });

        await interaction.guild.channels
          .create(`Matchmaker-Game-${gameCreatedObj.gameId}`, {
            type: "text",
            permissionOverwrites,
          })
          .then(async (e) => {
            e.setParent(interaction.channel.parentId);
            gameCreatedObj.channelIds.push(e.id);
          })
          .catch(() =>
            sendFollowUp(interaction, "Error creating text chat, are you sure the bot has permissions to do so?")
          );
      }

      sendFollowUp(
        interaction,
        `<@${gameCreatedObj.team1.captain}>, ${gameCreatedObj.team1.memberIds.reduce(
          (acc, curr) => `${acc}<@${curr}>, `,
          ""
        )} <@${gameCreatedObj.team1.captain}>, ${gameCreatedObj.team1.memberIds.reduce(
          (acc, curr) => `${acc}<@${curr}>, `,
          ""
        )} `
      );

      const discordEmbed1 = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_CHECK)
        .addField("Game is ready:", `Game ID is: ${gameCreatedObj.gameId}`)
        .addField(
          `:small_orange_diamond: Team ${gameCreatedObj.team1.name}`,
          `<@${gameCreatedObj.team1.captain}>, ${gameCreatedObj.team1.memberIds.reduce(
            (acc, curr) => `${acc}<@${curr}>, `,
            ""
          )}`
        )
        .addField(
          `:small_blue_diamond: Team ${gameCreatedObj.team2.name}`,
          `<@${gameCreatedObj.team2.captain}>, ${gameCreatedObj.team2.memberIds.reduce(
            (acc, curr) => `${acc}<@${curr}>, `,
            ""
          )}`
        );

      sendFollowUp(interaction, discordEmbed1);

      if (channelData.sendDirectMessage) {
        const JoinMatchEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_CHECK)
          .addField("Name:", valuesforpm.name.toString())
          .addField("Password:", valuesforpm.password.toString())
          .addField("You have to:", `Join match(Created by <@${gameCreatedObj.team1.captain}>)`);

        [...gameCreatedObj.team1.memberIds, ...gameCreatedObj.team2.memberIds, gameCreatedObj.team2.captain].forEach(
          (id) => {
            const fetchedUser = client.users
              .fetch(id)
              .then(async (user) => {
                try {
                  await user.send({ embeds: [JoinMatchEmbed] });
                } catch (error) {
                  const errorEmbed = new Discord.MessageEmbed()
                    .setColor(EMBED_COLOR_WARNING)
                    .setTitle(
                      `:x: Couldn't sent message to ${
                        (await client.users.fetch(id)).username
                      }, please check if your DM'S aren't set to friends only.`
                    );

                  sendFollowUp(interaction, errorEmbed);
                }
              })
              .catch((e) => {
                console.log(e);
                sendFollowUp(interaction, "Invalid User");
              });
            promises.push(fetchedUser);
          }
        );

        const CreateMatchEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_CHECK)
          .addField("Name:", valuesforpm.name.toString())
          .addField("Password:", valuesforpm.password.toString())
          .addField("You have to:", "Create Custom Match");

        const create1 = await client.users.fetch(gameCreatedObj.team1.captain);
        create1.send({ embeds: [CreateMatchEmbed] }).catch(() => {
          const errorEmbed = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_ERROR)
            .setTitle(
              `:x: Couldn't sent message to <@${gameCreatedObj.team1.captain}>, please check if your DM'S aren't set to friends only.`
            );

          sendFollowUp(interaction, errorEmbed);
        });
      }

      const ongoingGamesInsert = new OngoingGamesTeamsCollection(gameCreatedObj);

      await ongoingGamesInsert.save();

      queueArray.splice(0, queueArray.length);

      await redisInstance.setObject("channelQueues", channelQueues);
    } catch (e) {
      wrongEmbed.setTitle("Error creating teams, resetting queue.");

      sendFollowUp(interaction, wrongEmbed);

      logger.error(e);
    }
    queueArray.splice(0, queueArray.length);

    await redisInstance.setObject("channelQueues", channelQueues);
  }
};

module.exports = {
  name: "q",
  description: "Enter the queue (removes player after 45 minutes if no game has been made)",
  helpDescription:
    "Enter the queue. To do this do /q and tag your other teammates(depending on the qeueSize) example: /q @Dany @Johny @Tony @David (removes team after 45 minutes if no game has been made)",
  args: numberOfUsersArr.map((e) => {
    return { name: `user${e}`, description: "user", required: false, type: "mention" };
  }),
  execute,
};
