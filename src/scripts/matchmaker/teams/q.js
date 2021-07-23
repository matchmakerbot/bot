const Discord = require("discord.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  fetchTeamByGuildAndUserId,
  channelQueues,
  getQueueArray,
  fetchGames,
} = require("../utils");

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchTeam = fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id, "teams");

  if (fetchTeam.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain/dont belong to a team!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (queueArray[0].name === fetchTeam.name) {
    wrongEmbed.setTitle(":x: You're already in the queue");

    message.channel.send(wrongEmbed);
    return;
  }

  // test

  if (channelQueues.map((e) => e.teams).flat()) {
    wrongEmbed.setTitle(":x: You're already queued in another channel!");

    message.channel.send(wrongEmbed);
    return;
  }
  const ongoingGames = fetchGames();

  // also wrong lol

  for (const games of ongoingGames) {
    if (games.map((e) => e.name).includes(fetchTeam.name) && games.guildId === message.guild.id) {
      wrongEmbed.setTitle(":x: You are in the middle of a game!");

      message.channel.send(wrongEmbed);
      return;
    }
  }

  if (fetchTeam.members.length < queueSize / 2) {
    wrongEmbed.setTitle(
      `:x: You need at least ${queueSize / 2} members on your team to join the queue (including you)`
    );

    message.channel.send(wrongEmbed);
    return;
  }

  if (message.content.split(" ").length !== queueSize / 2) {
    wrongEmbed.setTitle(`:x: Please tag ${queueSize / 2 - 1} teammates to play with you`);

    message.channel.send(wrongEmbed);
    return;
  }

  let isInTeam = true;

  message.mentions.members.forEach((e) => {
    if (!fetchTeam.members.includes(e.user.id)) {
      wrongEmbed.setTitle(`:x: ${e.user.username} is not on your team!`);

      message.channel.send(wrongEmbed);
      isInTeam = false;
    }
  });

  if (!isInTeam) return;

  const toPush = {
    name: teamsInfo().name,
    members: [userId, getIDByTag(message.content.split(" ")[1]), getIDByTag(message.content.split(" ")[2])],
    time: new Date(),
  };

  teamsArray.push(toPush);

  correctEmbed.setTitle(`:white_check_mark: Added to queue! ${teamsArray.length}/2`);

  message.channel.send(correctEmbed);

  if (teamsArray.length === 2) {
    const valuesforpm = {
      name: Math.floor(Math.random() * 99999) + 100,
      password: Math.floor(Math.random() * 99999) + 100,
    };

    shuffle(teamsArray);

    gameCount++;

    teamsArray.push({
      gameID: gameCount,
      channel: channel_ID,
      guild: message.guild.id,
      time: new Date(),
    });

    for (const team of teamsArray) {
      if (team.gameID !== undefined) {
        break;
      }
      const channelsInDatabaseSpecific = `teams.${findGuildTeams.indexOf(teamsInfoSpecific(team.members[0]))}.channels`;

      if (
        !findGuildTeams[findGuildTeams.map((e) => e.name).indexOf(team.name)].channels
          .map((e) => e.channelID)
          .includes(channel_ID)
      ) {
        (async function () {
          await teamsCollection.update(
            {
              id: message.guild.id,
            },
            {
              $push: {
                [channelsInDatabaseSpecific]: {
                  channelID: channel_ID,
                  wins: 0,
                  losses: 0,
                  mmr: 1000,
                },
              },
            }
          );
        })();
      }
    }

    message.channel.send(
      `<@${teamsArray[0].members[0]}>, <@${teamsArray[0].members[1]}>, <@${teamsArray[0].members[2]}>, <@${teamsArray[1].members[0]}>, <@${teamsArray[1].members[1]}>, <@${teamsArray[0].members[2]}>`
    );

    ongoingGames.push([...teamsArray]);

    const discordEmbed1 = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_CHECK)
      .addField("Game is ready:", `Game ID is: ${gameCount}`)
      .addField(
        `:small_orange_diamond: Team ${teamsArray[0].name}`,
        `<@${teamsArray[0].members[0]}>, <@${teamsArray[0].members[1]}>, <@${teamsArray[0].members[2]}>`
      )
      .addField(
        `:small_blue_diamond: Team ${teamsArray[1].name}`,
        `<@${teamsArray[1].members[0]}>, <@${teamsArray[1].members[1]}>, <@${teamsArray[1].members[2]}>`
      );

    message.channel.send(discordEmbed1);

    userIDsPM.push(
      teamsArray[0].members[1],
      teamsArray[0].members[2],
      teamsArray[1].members[0],
      teamsArray[1].members[1],
      teamsArray[1].members[2]
    );

    const JoinMatchEmbed = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_CHECK)
      .addField("Name:", valuesforpm.name)
      .addField("Password:", valuesforpm.password)
      .addField("You have to:", `Join match(Created by ${(await fetchFromID(teamsArray[0].members[0])).username})`);

    for (const user of userIDsPM) {
      const create0 = await client.users.fetch(user);
      create0.send(JoinMatchEmbed).catch((error) => {
        const errorEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_ERROR)
          .setTitle(`:x: Couldn't sent message to ${users}, please check if your DM'S aren't set to friends only.`);

        console.error(error);

        message.channel.send(errorEmbed);
      });
    }

    userIDsPM = [];

    const CreateMatchEmbed = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_CHECK)
      .addField("Name:", valuesforpm.name)
      .addField("Password:", valuesforpm.password)
      .addField("You have to:", "Create Custom Match");

    const create1 = await client.users.fetch(teamsArray[0].members[0]);
    create1.send(CreateMatchEmbed).catch((error) => {
      const errorEmbed = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_ERROR)
        .setTitle(
          `:x: Couldn't sent message to ${fetchFromID(
            teamsArray[0].members[0]
          )}, please check if your DM'S aren't set to friends only.`
        );

      message.channel.send(errorEmbed);
      console.error(error);
    });

    message.guild.channels
      .create(`🔸Team-${teamsArray[0].name}-Game-${gameCount}`, {
        type: "voice",
        parent: message.channel.parentID,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: "CONNECT",
          },
          {
            id: teamsArray[0].members[0],
            allow: "CONNECT",
          },
          {
            id: teamsArray[0].members[1],
            allow: "CONNECT",
          },
          {
            id: teamsArray[0].members[2],
            allow: "CONNECT",
          },
        ],
      })
      .catch((error) => {
        const errorEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_ERROR)
          .setTitle(":x: You shouldn't be getting this message, if you do tag tweeno");

        message.channel.send(errorEmbed);
        console.error(error);
      });

    message.guild.channels
      .create(`🔹Team-${teamsArray[1].name}-Game-${gameCount}`, {
        type: "voice",
        parent: message.channel.parentID,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: "CONNECT",
          },
          {
            id: teamsArray[1].members[0],
            allow: "CONNECT",
          },
          {
            id: teamsArray[1].members[1],
            allow: "CONNECT",
          },
          {
            id: teamsArray[1].members[2],
            allow: "CONNECT",
          },
        ],
      })
      .catch((error) => {
        const errorEmbed = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_ERROR)
          .setTitle(":x: You shouldn't be getting this message, if you do tag tweeno");

        message.channel.send(errorEmbed);
        console.error(error);
      });

    teamsArray.splice(0, teamsArray.length);
  }
};

module.exports = {
  name: "q",
  description: "6man bot",
  execute,
};
