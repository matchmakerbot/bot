/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs");

const Discord = require("discord.js");

const client = require("./createClientInstance.js");

const { channelMode } = require("./cache");

const teamsCollection = require("./schemas/teamsSchema");

const guildsCollection = require("./schemas/guildsSchema");

const fivevfivesingles = require("../scripts/5v5.js");

const fivevfiveteams = require("../scripts/5v5teams.js");

const threevthreesingles = require("../scripts/3v3.js");

const threevthreeteams = require("../scripts/3v3teams.js");

const { prefix } = process.env;

const commandFiles = fs.readdirSync("./src/scripts/").filter((file) => file.endsWith(".js"));

const queueCommands = [
  "q",
  "status",
  "leave",
  "report",
  "score",
  "cancel",
  "reset",
  "game",
  "ongoinggames",
  "createteam",
  "invite",
  "disband",
  "jointeam",
  "pendinginvites",
  "leaveteam",
  "whois",
  "kickplayer",
  "r",
  "c",
  "revertgame",
  "giveownership",
];

client.commands = new Discord.Collection();

const bigBoiiSwitch = (gamemode, messageParam, args) => {
  const embed = new Discord.MessageEmbed().setColor("#F8534F");
  switch (gamemode) {
    case undefined: {
      embed.setTitle(
        ":x: You must first select your prefered gamemode in this channel using !channelmode 3v3solos, 3v3teams, 5v5solos or 5v5teams"
      );

      return messageParam.channel.send(embed);
    }

    case "5v5solos": {
      return fivevfivesingles.execute(messageParam, args);
    }
    case "5v5teams": {
      return fivevfiveteams.execute(messageParam, args);
    }
    case "3v3solos": {
      return threevthreesingles.execute(messageParam, args);
    }
    case "3v3teams": {
      return threevthreeteams.execute(messageParam, args);
    }
    default: {
      embed.setTitle(":x: Wtf is going on? Message Tweeno #8687");

      return messageParam.channel.send(embed);
    }
  }
};

const NewTeamGuild = (guildId) => {
  this.newTeamGuild = guildId;
  this.teams = [];
};

const NewGuild = (guildId) => {
  this.newTeamGuild = guildId;
  this.game = "";
  this.teams = [];
  this.whitelists = [];
  this.channels = {};
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
const createBotInstance = async () => {
  try {
    client.once("ready", async () => {
      const guilds = client.guilds.cache.map((a) => a.id);
      guilds.forEach(async (guildId) => {
        const guildsInfo = (await guildsCollection.findOne({ id: guildId })).toObject();

        if (guildsInfo.length === 0) {
          const guildInfo = new NewGuild(guildId);
          const teamsInfo = new NewTeamGuild(guildId);

          guildsCollection.insert(guildInfo);
          teamsCollection.insert(teamsInfo);
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

      if (queueCommands.includes(command)) {
        if (channelMode[message.channel.id] == null) {
          const guildsInfo = await guildsCollection.findOne({ id: message.guild.id });

          bigBoiiSwitch(guildsInfo.channels[message.channel.id], message, args);

          channelMode[message.channel.id] = guildsInfo.channels[message.channel.id];

          return;
        }

        bigBoiiSwitch(channelMode[message.channel.id], message, args);

        return;
      }

      await client.commands.get(command).execute(message, args);
    });
    console.log("Successfully created socket Client.on -> Message");
  } catch (e) {
    console.log("Error creating event listener Client.on -> Message");

    console.error(e);
  }
  try {
    client.on("guildCreate", async (guild) => {
      console.log(`Joined ${guild.name}`);
      const guildsInfo = (await guildsCollection.find({ id: guild.id })).toObject();

      if (guildsInfo.length === 0) {
        const guildInfo = new NewGuild(guild.id);
        const teamsInfo = new NewTeamGuild(guild.id);

        guildsCollection.insert(guildInfo);
        teamsCollection.insert(teamsInfo);
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

module.exports = { channelMode, createBotInstance };
