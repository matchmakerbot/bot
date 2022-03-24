/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable consistent-return */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const logger = require("pino")();

const fs = require("fs");

const Discord = require("discord.js");

const fastify = require("fastify")();

const client = require("./createClientInstance.js");

const { redisInstance } = require("./createRedisInstance");

const ChannelsCollection = require("./schemas/channelsSchema");

const { startIntervalMatchmakerBot } = require("../scripts/matchmaker/timeout");

const { sendMessage, EMBED_COLOR_WARNING } = require("./utils");

const prefix = process.env.PREFIX;

const paths = ["", "/matchmaker/solos", "/matchmaker/teams"];

const [commandFiles, commandFilesMatchmakerSolos, commandFilesMatchmakerTeams] = paths.map((e) =>
  fs
    .readdirSync(`./src/scripts${e}`)
    .filter((file) => file.endsWith(".js"))
    .map((ee) => ee.replace(".js", ""))
);

client.commands = new Discord.Collection();

paths.forEach((e, i) => {
  let commands;
  switch (i) {
    case 1: {
      commands = commandFilesMatchmakerSolos;
      break;
    }
    case 2: {
      commands = commandFilesMatchmakerTeams;
      break;
    }
    default: {
      commands = commandFiles;
    }
  }
  commands.forEach((ee) => {
    const command = require(`../scripts${e}/${ee}.js`);
    if (typeof command.name === "string") {
      client.commands.set(command.name, command);
    } else if (command.name instanceof Array) {
      command.name.forEach((name) => {
        client.commands.set(name, command);
      });
    }
  });
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
      logger.info(
        `Guilds: ${client.guilds.cache.map((a) => a.name).join(" || ")}\nNumber of Guilds: ${
          client.guilds.cache.map((a) => a.name).length
        }`
      );

      client.user.setActivity("!help", {
        type: "STREAMING",
        url: "https://www.twitch.tv/tweenoTV",
      });
    });
    logger.info(`Scripts loaded: ${[...client.commands].length}`);

    logger.info("Successfully created socket Client.Once -> Ready");
  } catch (e) {
    logger.error("Error creating event listener Client.once -> Ready");

    logger.error(e);
  }
  try {
    client.on("message", async (message) => {
      const args = message.content.slice(prefix.length).split(/ +/);

      const command = args.shift().toLowerCase();

      if (!message.guild) return;

      if (!message.content.startsWith(prefix) || message.author.bot) return;

      if (!client.commands.has(command)) return;

      if (message.guild === undefined) return;

      const redisChannels = await redisInstance.getObject("channels");

      if (!redisChannels.includes(message.guild.id)) {
        const embed = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING);

        embed.setTitle(
          "The prefix for this bot will change from ! to / starting 30th of April, because of discord's new message content policy, which does not allow users to track message content anymore."
        );

        sendMessage(message, embed);

        redisChannels.push(message.guild.id);

        await redisInstance.setObject("channels", redisChannels);
      }

      if (commandFilesMatchmakerSolos.includes(command) || commandFilesMatchmakerTeams.includes(command)) {
        const queueTypeObject = await redisInstance.getObject("queueTypeObject");
        if (!queueTypeObject[message.channel.id]) {
          const guildsInfo = await ChannelsCollection.findOne({ channelId: message.channel.id });
          if (!guildsInfo) {
            const embed = new Discord.MessageEmbed().setColor("#F8534F");
            embed.setTitle(
              ":x:You need to set the Queue Type for this channel! For example !queueType 6 solos for 3v3 solo games, or !queueType 4 teams for 2v2 teams games. For list of commands do !help"
            );

            sendMessage(message, embed);
            return;
          }
          queueTypeObject[message.channel.id] = guildsInfo;
        }

        if (
          (!commandFilesMatchmakerSolos.includes(command) &&
            queueTypeObject[message.channel.id].queueMode === "solos") ||
          (!commandFilesMatchmakerTeams.includes(command) && queueTypeObject[message.channel.id].queueMode === "teams")
        )
          return;

        require(`../scripts/matchmaker/${queueTypeObject[message.channel.id].queueMode}/${command}.js`).execute(
          message,
          queueTypeObject[message.channel.id].queueSize
        );

        return;
      }
      client.commands.get(command).execute(message);
    });
    logger.info("Successfully created socket Client.on -> Message");
  } catch (e) {
    logger.error("Error creating event listener Client.on -> Message");

    logger.error(e);
  }
  try {
    client.on("guildCreate", async (guild) => {
      logger.info(`Joined ${guild.name}`);
    });
    logger.info("Successfully created socket Client.on -> guildCreate");
  } catch (e) {
    logger.error("Error creating event listener Client.on -> guildCreate");

    logger.error(e);
  }
  try {
    await client.login(process.env.TOKEN);
    logger.info("Successfully logged in");
  } catch (e) {
    logger.error("Error logging in");
    logger.error(e);
  }
};

module.exports = { createBotInstance };
