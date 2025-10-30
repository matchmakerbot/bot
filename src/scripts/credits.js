const Discord = require("discord.js");

const client = require("../utils/createClientInstance");

const { sendReply } = require("../utils/utils");

const execute = async (interaction) => {
  const embed = new Discord.MessageEmbed()
    .setColor("#F8534F")
    .addField("thisDavid", "Creator of this Bot")
    .setThumbnail((await client.users.fetch("215982178046181376")).displayAvatarURL())
    .addField("https://www.twitch.tv/tweenotv", "Feel free to follow me on twitch, i usually stream some random stuff.")
    .addField("https://github.com/matchmakerbot/bot/issues/", "To request bug fixes and new features");
  await sendReply(interaction, embed);
};

module.exports = {
  name: "credits",
  description: "Credits",
  execute,
};
