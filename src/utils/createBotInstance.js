/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable consistent-return */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const logger = require("pino")();

const fs = require("fs");

const Discord = require("discord.js");

const fastify = require("fastify")();

const { SlashCommandBuilder } = require("@discordjs/builders");

const { REST } = require("@discordjs/rest");

const { Routes } = require("discord-api-types/v9");

const { handleMesssageError } = require("./utils");

const client = require("./createClientInstance.js");

const { redisInstance } = require("./createRedisInstance");

const ChannelsCollection = require("./schemas/channelsSchema");

const { startIntervalMatchmakerBot } = require("../scripts/matchmaker/timeout");

const { sendReply } = require("./utils");

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
      logger.info(`People: ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}`);
      logger.info(
        `Guilds: ${client.guilds.cache.map((a) => a.name).join(" || ")}\nNumber of Guilds: ${
          client.guilds.cache.map((a) => a.name).length
        }`
      );
      client.user.setActivity("/help", {
        type: "STREAMING",
        url: "https://www.twitch.tv/tweenoTV",
      });
    });

    logger.info(`Scripts loaded: ${[...client.commands].length}`);

    logger.info("Successfully created socket Client.Once -> Ready");
  } catch (err) {
    logger.error("Error creating event listener Client.once -> Ready");

    logger.error(err);
  }

  try {
    const commands = Array.from(client.commands, (e) => {
      return { name: e[0], ...e[1] };
    })
      .filter((e, i, arr) => arr.map((ee) => ee.name).indexOf(e.name) === i)
      .map((e) => {
        const builder = new SlashCommandBuilder()
          .setName(typeof e.name === "string" ? e.name : e.name[0])
          .setDescription(e.description);

        if (e.args) {
          e.args.forEach((arg) => {
            switch (arg.type) {
              case "mention": {
                builder.addUserOption((option) => {
                  return option.setName(arg.name).setRequired(arg.required).setDescription(arg.description);
                });
                break;
              }
              case "string": {
                builder.addStringOption((option) => {
                  return option.setName(arg.name).setRequired(arg.required).setDescription(arg.description);
                });
                break;
              }
              default:
                break;
            }
          });
        }
        builder.toJSON();
        return builder;
      });

    const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

    logger.info("Successfully registered application commands.");
  } catch (err) {
    logger.error("Error registering application commands.");

    logger.error(err);
  }

  client.on("messageCreate", async (message) => {
    if (message.content.startsWith(process.env.PREFIX) && client.commands.has(message.content.slice(1).split(" ")[0])) {
      await message.channel
        .send(
          "The prefix for this bot has changed from ! to / (slash command) , because of discord's new message content policy, which does not allow bots to track message content anymore without discord validation \nIf you can't see the slash interactions, please re-invite the bot in this link https://discord.com/api/oauth2/authorize?client_id=571839826744180736&permissions=2147486800&scope=applications.commands%20bot\nIf you still have issues, toss me a dm Tweeno#8687"
        )
        .catch(async () => {
          await handleMesssageError(message.member.id);
        });
    }
  });

  try {
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand() || !interaction.member) return;

      const { commandName } = interaction;

      const warnedChannels = await redisInstance.getObject("warnedChannels");

      if (!warnedChannels.includes(interaction.channel.id)) {
        interaction.channel.send(
          "A new website for the bot has been released where you can see all commands and check the leaderboard! (It is still in development, so a few bugs may occur) https://matchmakerbot.net"
        );

        warnedChannels.push(interaction.channel.id);

        await redisInstance.setObject("warnedChannels", warnedChannels);
      }

      if (commandFilesMatchmakerSolos.includes(commandName) || commandFilesMatchmakerTeams.includes(commandName)) {
        const queueTypeObject = await redisInstance.getObject("queueTypeObject");
        if (!queueTypeObject[interaction.channel.id]) {
          const guildsInfo = await ChannelsCollection.findOne({ channelId: interaction.channel.id });
          if (!guildsInfo) {
            const embed = new Discord.MessageEmbed().setColor("#F8534F");
            embed.setTitle(
              ":x:You need to set the Queue Type for this channel! For example /queueType 6 solos for 3v3 solo games, or /queueType 4 teams for 2v2 teams games. For list of commands do /help"
            );

            await sendReply(interaction, embed);
            return;
          }
          queueTypeObject[interaction.channel.id] = guildsInfo;
        }

        if (
          (!commandFilesMatchmakerSolos.includes(commandName) &&
            queueTypeObject[interaction.channel.id].queueMode === "solos") ||
          (!commandFilesMatchmakerTeams.includes(commandName) &&
            queueTypeObject[interaction.channel.id].queueMode === "teams")
        )
          return;

        await require(`../scripts/matchmaker/${queueTypeObject[interaction.channel.id].queueMode}/${commandName}.js`)
          .execute(interaction, queueTypeObject[interaction.channel.id].queueSize)
          .catch((err) => {
            interaction.channel.send(
              "An error occured while executing the command, please contact Tweeno#8687, so they can try and fix it as soon as possible!"
            );
            logger.error(err);
          });

        return;
      }
      await client.commands
        .get(commandName)
        .execute(interaction)
        .catch((err) => {
          interaction.channel.send(
            "An error occured while executing the command, please contact Tweeno#8687, so they can try and fix it as soon as possible!"
          );
          logger.error(err);
        });
    });
    logger.info("Successfully created socket Client.on -> interactionCreate");
  } catch (err) {
    logger.error("Error creating event listener Client.on -> interactionCreate");

    logger.error(err);
  }
  try {
    client.on("guildCreate", async (guild) => {
      logger.info(`Joined ${guild.name}`);
    });
    logger.info("Successfully created socket Client.on -> guildCreate");
  } catch (err) {
    logger.error("Error creating event listener Client.on -> guildCreate");

    logger.error(err);
  }
  try {
    await client.login(process.env.TOKEN);
    logger.info("Successfully logged in");
  } catch (err) {
    logger.error("Error logging in");
    logger.error(err);
  }
};

module.exports = { createBotInstance };
