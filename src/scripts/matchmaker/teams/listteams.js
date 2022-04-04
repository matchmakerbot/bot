const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply, getContent } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [skip] = getContent(interaction);

  let skipCount = skip;

  if (Number.isNaN(Number(skip)) || !skip || skip < 1) {
    skipCount = 1;
  }

  const teams = await MatchmakerTeamsCollection.find({
    guildId: interaction.guild.id,
  })
    .skip(10 * (skipCount - 1))
    .limit(10);

  if (teams.length === 0) {
    wrongEmbed.setTitle(":x: There are no teams on this page!");

    return sendReply(interaction, wrongEmbed);
  }

  const teamsCount = await MatchmakerTeamsCollection.countDocuments({ guildId: interaction.guild.id });

  teams.forEach((team) => {
    correctEmbed.addField(`Name: ${team.name}`, `Captain: <@${team.captain}>`);

    correctEmbed.setFooter(`Showing page ${skipCount}/${Math.ceil(teamsCount / 10)}`);
  });

  return sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "listteams",
  description: "Lists all the team in a guild. Usage: /listteam 1 for the first page, and so on",
  execute,
};
