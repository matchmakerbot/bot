const Discord = require("discord.js");

const { sendReply } = require("../utils/utils");

const discordEmbed = new Discord.MessageEmbed()

  .setAuthor("Matchmaker Bot Help Page", "https://i.ibb.co/4drZsvN/Screenshot-4.png")
  .setColor("#F8534F")
  .setTitle("For MatchMaking related commands, please use the command !helpsolosmatchmaking or !helpteamsmatchmaking")
  .addField("!credits", "Just some credits :p")
  .addField(
    "!queueType",
    "Sets the queuetype , for example '!queuetype 6 solos' for 3v3 solo games, or '!queueType 4 teams' for 2v2 teams games"
  )
  .addField(
    "!config",
    "Configures some definitions on a given channel, for example !config createVoiceChannels on/off, !config createTextChannel on/off, !config sendDirectMessage on/off"
  )
  .addField("!examplesolos", "An example of how the bot should be used in solos mode")
  .addField(
    "Privacy policy",
    "This bot has access to the message content of messages sent in channels that the bot has access to. This bot is not allowed to send or see messages in channels that it does not have access to."
  )
  .setTimestamp();

module.exports = {
  name: "help",
  description: "Command to check the bot commands",
  execute(interaction) {
    sendReply(interaction, discordEmbed);
  },
};
