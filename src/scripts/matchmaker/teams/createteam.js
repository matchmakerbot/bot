const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, messageArgs, sendReply } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const teamName = messageArgs(interaction);

  if (teamName.length > 31) {
    wrongEmbed.setTitle(":x: Name too big! Maximum characters allowed are 32.");

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (teamName.length < 2) {
    wrongEmbed.setTitle(":x: Name too short! Minimum characters allowed are 3.");

    sendReply(interaction, wrongEmbed);
    return;
  }

  const teamByName = await MatchmakerTeamsCollection.findOne({ name: teamName, guildId: interaction.guild.id });

  if (teamByName != null) {
    wrongEmbed.setTitle(":x: Name already in use");

    sendReply(interaction, wrongEmbed);
    return;
  }

  const teamByUser = await MatchmakerTeamsCollection.findOne({
    guildId: interaction.guild.id,
    $or: [{ captain: interaction.member.id }, { memberIds: { $in: interaction.member.id } }],
  });

  if (teamByUser != null) {
    wrongEmbed.setTitle(":x: You already belong to a team!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  const teamsInsert = {
    guildId: interaction.guild.id,
    name: teamName,
    captain: interaction.member.id,
    memberIds: [],
  };

  const teamInsert = new MatchmakerTeamsCollection(teamsInsert);

  await teamInsert.save();

  correctEmbed.setTitle(`:white_check_mark: ${teamsInsert.name} Created!`);

  sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "createteam",
  description: "Creates a team, usage: !createteam Maniacs",
  execute,
};
