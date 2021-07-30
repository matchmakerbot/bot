const Discord = require("discord.js");

const discordEmbed = new Discord.MessageEmbed()

  .setAuthor(
    "Matchmaker Bot Help Page",
    "https://media.discordapp.net/attachments/464556094728044564/619269142268215355/68884765_417923562160410_1636845361156849664_n.jpg?width=676&height=676"
  )
  .setColor("#F8534F")
  .setTitle("For MatchMaking related commands, please use the command !helpsolosmatchmaking or !helpteamsmatchmaking")
  .addField("!lpt", "`Gives you a nice life pro tip.`")
  .addField("!gayrandom", "`Tells you how gay you are`")
  .addField("!randomword", "`Says a random word from the oxford dictionary. Current count: 458570 words.`")
  .addField("!reddit", "`Allows you to search posts with images on any given subreddit (Example = !reddit memes)`")
  .addField("!credits", "`Just some credits :p`")
  .setTimestamp();

module.exports = {
  name: "help",
  description: "Gives you a nice command list",
  execute(message) {
    message.channel.send(discordEmbed);
  },
};
