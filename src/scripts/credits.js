const Discord = require("discord.js");

const client = require("../utils/createClientInstance");

const { sendReply } = require("../utils/utils");

const execute = async (interaction) => {
  const embed = new Discord.MessageEmbed()
    .setColor("#F8534F")
    .addField("Tweeno#8687", "Creator of this Bot")
    .setThumbnail((await client.users.fetch("215982178046181376")).displayAvatarURL())
    .addField("https://www.twitch.tv/tweenotv", "Feel free to follow me on twitch, i usually stream some random stuff.")
    .addField("https://tinyurl.com/y6zr773c", "Invite the bot to your server here ^^")
    .addField("https://github.com/iTweeno/MatchMaker-Bot/issues/new/choose", "To request bug fixes and new features");
  await sendReply(interaction, embed);
};

module.exports = {
  name: "credits",
  description: "Credits",
  execute,
};
