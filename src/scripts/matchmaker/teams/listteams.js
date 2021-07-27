const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamsByGuildId, fetchFromId } = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const teams = await fetchTeamsByGuildId(message.guild.id);

  let [, secondArg] = message.content.split(" ");

  if (teams.length === 0) {
    wrongEmbed.setTitle(":x: No games are currently having place!");

    return message.channel.send(wrongEmbed);
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

    // eslint-disable-next-line no-await-in-loop
    correctEmbed.addField(`Name: ${teams[i].name}`, `Captain: ${(await fetchFromId(teams[i].captain))?.username}`);

    correctEmbed.setFooter(`Showing page ${secondArg}/${Math.ceil(teams.length / 10)}`);
  }
  return message.channel.send(correctEmbed);
};

module.exports = {
  name: "listteams",
  description: "Lists all the team in a guild. Usage: !listteam 1 for the first page, and so on",
  execute,
};
