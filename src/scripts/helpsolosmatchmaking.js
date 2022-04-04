/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const Discord = require("discord.js");

const fs = require("fs");

const { sendReply } = require("../utils/utils");

const commandFilesMatchmakerSolos = fs
  .readdirSync("./src/scripts/matchmaker/solos")
  .filter((file) => file.endsWith(".js"));

const execute = async (interaction) => {
  const discordEmbed = new Discord.MessageEmbed()

    .setAuthor({ name: "Matchmaker Bot Help Page", iconURL: "https://i.ibb.co/4drZsvN/Screenshot-4.png" })
    .setColor("#F8534F")
    .setTitle("For teams matchmaking help, please type /helpteamsmatchmaking");
  commandFilesMatchmakerSolos.forEach((file) => {
    const command = require(`./matchmaker/solos/${file}`);
    if (command.name != null) {
      discordEmbed.addField(
        `/${command.name}`,
        command.helpDescription == null ? command.description : command.helpDescription
      );
    }
  });
  await sendReply(interaction, discordEmbed);
};

module.exports = {
  name: "helpsolosmatchmaking",
  description: "Gives you a nice command list",
  execute,
};
