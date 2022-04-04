const Discord = require("discord.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { EMBED_COLOR_CHECK, messageArgs, EMBED_COLOR_ERROR, sendReply, getContent } = require("../../../utils/utils");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [secondArg] = getContent(interaction);

  const teamName = messageArgs(interaction);

  const fetchedTeam =
    secondArg != null
      ? await MatchmakerTeamsCollection.findOne({ guildId: interaction.guild.id, name: teamName })
      : await MatchmakerTeamsCollection.findOne({
          guildId: interaction.guild.id,
          $or: [{ captain: interaction.member.id }, { memberIds: { $in: interaction.member.id } }],
        });

  if (!fetchedTeam) {
    wrongEmbed.setTitle(`:x: ${!secondArg ? "You do not belong to a team!" : "This team doesn't exist!"}`);

    sendReply(interaction, wrongEmbed);
    return;
  }

  correctEmbed.setTitle(fetchedTeam.name);

  correctEmbed.addField(
    "Members:",
    `<@${fetchedTeam.captain}> (Captain), ${fetchedTeam.memberIds.reduce((acc, curr) => `${acc}<@${curr}>, `, "")}`
  );

  sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "whois",
  description: "Check for team members, usage: /whois Maniacs, or /whois to check your team",
  args: [{ name: "team_name", description: "team_name", required: false }],
  execute,
};
