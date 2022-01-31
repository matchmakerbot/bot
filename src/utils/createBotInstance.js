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

const { sendMessage } = require("./utils");

const { prefix } = process.env;

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
    client.commands.set(command.name, command);
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
      // eslint-disable-next-line no-console
      console.log(
        ` ${message.author.username} | ${message.author.id}| ${message.guild?.name} | ${message.channel.id} | ${message.content}`
      );
      const args = message.content.slice(prefix.length).split(/ +/);

      const command = args.shift().toLowerCase();

      if (message.guild === null) return;

      if (!message.content.startsWith(prefix) || message.author.bot) return;

      if (!client.commands.has(command)) return;

      if (message.guild === undefined) return;

      if (commandFilesMatchmakerSolos.includes(command) || commandFilesMatchmakerTeams.includes(command)) {
        const queueTypeObject = await redisInstance.getObject("queueTypeObject");
        if (queueTypeObject[message.channel.id] == null) {
          const guildsInfo = await ChannelsCollection.findOne({ channelId: message.channel.id });
          if (guildsInfo == null) {
            const embed = new Discord.MessageEmbed().setColor("#F8534F");
            embed.setTitle(
              ":x:You need to set the Queue Type for this channel! For example !queueType 6 solos for 3v3 solo games, or !queueType 4 teams for 2v2 teams games. For list of commands do !helpsolosmatchmaking or !helpteamsmatchmaking"
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
    await client.login(process.env.token);
    logger.info("Successfully logged in");
  } catch (e) {
    logger.error("Error logging in");
    logger.error(e);
  }
};

module.exports = { createBotInstance };
