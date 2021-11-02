const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamsByGuildId } = require("../utils");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const teams = await fetchTeamsByGuildId(message.guild.id);

  let [, secondArg] = message.content.split(" ");

  if (teams.length === 0) {
    wrongEmbed.setTitle(":x: No games are currently having place!");

    return sendMessage(message, wrongEmbed);
  }

  if (Number.isNaN(secondArg) || secondArg == null) {
    secondArg = 1;
  }
  let i = 10 * (secondArg - 1);
  for (i; i < 10 * secondArg; i++) {
    if (teams[i] == null) {
      correctEmbed.addField("No more teams to list ", "Encourage your friends to play!");
      break;
    }

    correctEmbed.addField(`Name: ${teams[i].name}`, `Captain: <@${teams[i].captain}>`);

    correctEmbed.setFooter(`Showing page ${secondArg}/${Math.ceil(teams.length / 10)}`);
  }
  return sendMessage(message, correctEmbed);
};

module.exports = {
  name: "listteams",
  description: "Lists all the team in a guild. Usage: !listteam 1 for the first page, and so on",
  execute,
};
