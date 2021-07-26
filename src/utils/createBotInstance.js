/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs");

const Discord = require("discord.js");

const fastify = require("fastify")({
  logger: true,
});

const client = require("./createClientInstance.js");

const { queueSizeObject: queueTypeObject } = require("./cache");

const GuildsCollection = require("./schemas/guildsSchema");

const { startIntervalMatchmakerBot } = require("../scripts/matchmaker/solos/timeout");

const { prefix } = process.env;

const commandFiles = fs.readdirSync("./src/scripts/").filter((file) => file.endsWith(".js"));

const commandFilesMatchmakerSolos = fs
  .readdirSync("./src/scripts/matchmaker/solos/")
  .filter((file) => file.endsWith(".js"));

const commandFilesMatchmakerTeams = fs
  .readdirSync("./src/scripts/matchmaker/teams/")
  .filter((file) => file.endsWith(".js"));

const queueCommandsSolos = [
  "q",
  "status",
  "leave",
  "report",
  "score",
  "cancel",
  "reset",
  "game",
  "ongoinggames",
  "revertgame",
];

const queueCommandsTeams = [
  ...queueCommandsSolos,
  "createteam",
  "invite",
  "disband",
  "jointeam",
  "pendinginvites",
  "leaveteam",
  "whois",
  "kickplayer",
  "giveownership",
  "listteams",
];

client.commands = new Discord.Collection();

const NewGuild = (guildId) => {
  return {
    id: guildId,
    channels: {},
    teams: [],
  };
};

commandFiles.forEach((file) => {
  const command = require(`../scripts/${file}`);
  if (typeof command.name === "string") {
    client.commands.set(command.name, command);
  } else if (command.name instanceof Array) {
    command.name.forEach((name) => {
      client.commands.set(name, command);
    });
  }
});

commandFilesMatchmakerSolos.forEach((file) => {
  const command = require(`../scripts/matchmaker/solos/${file}`);
  client.commands.set(command.name, command);
});

commandFilesMatchmakerTeams.forEach((file) => {
  const command = require(`../scripts/matchmaker/teams/${file}`);
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

      client.user.setActivity("!helpsolosmatchmaking", {
        type: "STREAMING",
        url: "https://www.twitch.tv/tweenoTV",
      });
    });
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

      if (queueCommandsTeams.includes(command) || queueCommandsSolos.includes(command)) {
        if (queueTypeObject[message.channel.id] == null) {
          const guildsInfo = await GuildsCollection.findOne({ id: message.guild.id });

          if (typeof guildsInfo.channels[message.channel.id].queueSize !== "number") {
            const embed = new Discord.MessageEmbed().setColor("#F8534F");
            embed.setTitle(
              ":x: You must select your queue size and gamemode in this channel !queueType number gamemode, for example !queueType 6 solos or !queueType 8 teams\n Please read the following pastebin for changelog https://pastebin.com/N9kq20LS"
            );

            message.channel.send(embed);
            return;
          }
          if (
            (!queueCommandsSolos.includes(command) && guildsInfo.channels[message.channel.id].queueType === "solos") ||
            (!queueCommandsTeams.includes(command) && guildsInfo.channels[message.channel.id].queueType === "teams")
          )
            return;
          await require(`../scripts/matchmaker/${
            guildsInfo.channels[message.channel.id].queueType
          }/${command}`).execute(message, guildsInfo.channels[message.channel.id].queueSize);

          queueTypeObject[message.channel.id] = guildsInfo.channels[message.channel.id];

          return;
        }

        if (
          (!queueCommandsSolos.includes(command) && queueTypeObject[message.channel.id].queueType === "solos") ||
          (!queueCommandsTeams.includes(command) && queueTypeObject[message.channel.id].queueType === "teams")
        )
          return;

        await require(`../scripts/matchmaker/${queueTypeObject[message.channel.id].queueType}/${command}.js`).execute(
          message,
          queueTypeObject[message.channel.id].queueSize
        );

        return;
      }

      await client.commands.get(command).execute(message);
    });
    console.log("Successfully created socket Client.on -> Message");
  } catch (e) {
    console.log("Error creating event listener Client.on -> Message");

    console.error(e);
  }
  try {
    client.on("guildCreate", async (guild) => {
      console.log(`Joined ${guild.name}`);
      const guildsInfo = await GuildsCollection.find({ id: guild.id });

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
