const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendMessage } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, skip] = message.content.split(" ");

  let skipCount = skip;

  if (Number.isNaN(Number(skip)) || skip == null || skip < 1) {
    skipCount = 1;
  }

  const teams = await MatchmakerTeamsCollection.findOne({
    guildId: message.guild.id,
  })
    .skip(10 * (skipCount - 1))
    .limit(10);

  if (teams.length === 0) {
    wrongEmbed.setTitle(":x: There are no teams on this page!");

    return sendMessage(message, wrongEmbed);
  }

  const teamsCount = await MatchmakerTeamsCollection.countDocuments();

  teams.forEach((team) => {
    correctEmbed.addField(`Name: ${team.name}`, `Captain: <@${team.captain}>`);

    correctEmbed.setFooter(`Showing page ${skipCount}/${Math.ceil(teamsCount / 10)}`);
  });

  return sendMessage(message, correctEmbed);
};

module.exports = {
  name: "listteams",
  description: "Lists all the team in a guild. Usage: !listteam 1 for the first page, and so on",
  execute,
};
