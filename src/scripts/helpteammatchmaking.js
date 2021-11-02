/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const Discord = require("discord.js");

const fs = require("fs");

const { sendMessage } = require("../utils/utils");

const commandFilesMatchmakerSolos = fs
  .readdirSync("./src/scripts/matchmaker/teams")
  .filter((file) => file.endsWith(".js"));
const execute = (message) => {
  const discordEmbed = new Discord.MessageEmbed()

    .setAuthor("MatchMaker Bot Help Page", "https://i.ibb.co/4drZsvN/Screenshot-4.png")
    .setColor("#F8534F")
    .setTitle("For solos matchmaking help, please type !helpsolosmatchmaking")
    .addField(
      "!queueType",
      "Sets the queuetype , for example !queuetype 6 solos for 3v3 solo games, or !queueType 4 teams for 2v2 teams games"
    );
  commandFilesMatchmakerSolos.forEach((file) => {
    const command = require(`./matchmaker/teams/${file}`);
    if (command.name != null) {
      discordEmbed.addField(`!${command.name}`, command.description);
    }
  });
  discordEmbed.addField(
    "Info for teams:",
    " ONLY the captain has acess to some commands like !q, !leave!, !cancel etc..."
  );
  sendMessage(message, discordEmbed);
};
module.exports = {
  name: "helpteamsmatchmaking",
  description: "Gives you a nice command list",
  execute,
};
