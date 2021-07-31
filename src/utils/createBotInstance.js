/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs");

const Discord = require("discord.js");

const fastify = require("fastify")();

const client = require("./createClientInstance.js");

const { queueTypeObject } = require("./cache");

const GuildsCollection = require("./schemas/guildsSchema");

const { startIntervalMatchmakerBot } = require("../scripts/matchmaker/timeout");

const { prefix } = process.env;

const commandFiles = fs
  .readdirSync("./src/scripts/")
  .filter((file) => file.endsWith(".js"))
  .map((e) => e.replace(".js", ""));

const commandFilesMatchmakerSolos = fs
  .readdirSync("./src/scripts/matchmaker/solos/")
  .filter((file) => file.endsWith(".js"))
  .map((e) => e.replace(".js", ""));

const commandFilesMatchmakerTeams = fs
  .readdirSync("./src/scripts/matchmaker/teams/")
  .filter((file) => file.endsWith(".js"))
  .map((e) => e.replace(".js", ""));

client.commands = new Discord.Collection();

const NewGuild = (guildId) => {
  return {
    id: guildId,
    channels: {},
    teams: [],
  };
};

commandFiles.forEach((file) => {
  const command = require(`../scripts/${file}.js`);
  if (typeof command.name === "string") {
    client.commands.set(command.name, command);
  } else if (command.name instanceof Array) {
    command.name.forEach((name) => {
      client.commands.set(name, command);
    });
  }
});

commandFilesMatchmakerSolos.forEach((file) => {
  const command = require(`../scripts/matchmaker/solos/${file}.js`);
  client.commands.set(command.name, command);
});

commandFilesMatchmakerTeams.forEach((file) => {
  const command = require(`../scripts/matchmaker/teams/${file}.js`);
  client.commands.set(command.name, command);
});

const createBotInstance = async () => {
  fastify.get("/healthz", (request, reply) => {
    reply.send("alive");
  });

  fastify.listen(3000, "0.0.0.0", (err) => {
    if (err) throw err;
  });
  startIntervalMatchmakerBot();
  try {
    client.once("ready", async () => {
      const guilds = client.guilds.cache.map((a) => a.id);
      guilds.forEach(async (guildId) => {
        const guildsInfo = await GuildsCollection.findOne({ id: guildId });

        if (guildsInfo == null) {
          const insertedGuild = new GuildsCollection(NewGuild(guildId));

          await insertedGuild.save();
        }
      });

      console.log(
        `Guilds: ${client.guilds.cache.map((a) => a.name).join(" || ")}\nNumber of Guilds: ${
          client.guilds.cache.map((a) => a.name).length
        }`
      );

      client.user.setActivity("!help", {
        type: "STREAMING",
        url: "https://www.twitch.tv/tweenoTV",
      });
    });
    console.log(`Scripts loaded: ${[...client.commands].length}`);

    console.log("Successfully created socket Client.Once -> Ready");
  } catch (e) {
    console.log("Error creating event listener Client.once -> Ready");

    console.error(e);
  }
  try {
    client.on("message", async (message) => {
      // console.log(` ${(await client.users.fetch(message.author.id)).username} | ${message.channel.id} + ${message.content}`);
      const args = message.content.slice(prefix.length).split(/ +/);

      const command = args.shift().toLowerCase();

      if (message.guild === null) return;

      if (!message.content.startsWith(prefix) || message.author.bot) return;

      if (!client.commands.has(command)) return;

      if (message.guild === undefined) return;

      if (commandFilesMatchmakerSolos.includes(command) || commandFilesMatchmakerTeams.includes(command)) {
        if (queueTypeObject[message.channel.id] == null) {
          const guildsInfo = await GuildsCollection.findOne({ id: message.guild.id });

          if (guildsInfo?.channels[message.channel.id]?.queueType == null) {
            const embed = new Discord.MessageEmbed().setColor("#F8534F");
            embed.setTitle(
              ":x:You need to set the queueType for this channel! For example !queueType 6 solos for 3v3 solo games, or !queueType 4 teams for 2v2 teams games. For list of commands do !helpsolosmatchmaking or !helpteamsmatchmaking"
            );

            message.channel.send(embed);
            return;
          }
          queueTypeObject[message.channel.id] = guildsInfo.channels[message.channel.id];
        }

        if (
          (!commandFilesMatchmakerSolos.includes(command) &&
            queueTypeObject[message.channel.id].queueType === "solos") ||
          (!commandFilesMatchmakerTeams.includes(command) && queueTypeObject[message.channel.id].queueType === "teams")
        )
          return;

        require(`../scripts/matchmaker/${queueTypeObject[message.channel.id].queueType}/${command}.js`).execute(
          message,
          queueTypeObject[message.channel.id].queueSize
        );

        return;
      }

      client.commands.get(command).execute(message);
    });
    console.log("Successfully created socket Client.on -> Message");
  } catch (e) {
    console.log("Error creating event listener Client.on -> Message");

    console.error(e);
  }
  try {
    client.on("guildCreate", async (guild) => {
      console.log(`Joined ${guild.name}`);
      const guildsInfo = await GuildsCollection.findOne({ id: guild.id });

      if (guildsInfo == null) {
        const insertedGuild = new GuildsCollection(NewGuild(guild.id));

        await insertedGuild.save();
      }
    });
    console.log("Successfully created socket Client.on -> guildCreate");
  } catch (e) {
    console.log("Error creating event listener Client.on -> guildCreate");

    console.error(e);
  }
  try {
    await client.login(process.env.token);
    console.log("Sucessfully logged in");
  } catch (e) {
    console.log("Error logging in");
    console.error(e);
  }
};

module.exports = { createBotInstance };
