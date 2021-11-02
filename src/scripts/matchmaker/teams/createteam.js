const Discord = require("discord.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  messageArgs,
  fetchTeamByGuildIdAndName,
  fetchTeamByGuildAndUserId,
} = require("../utils");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (messageArgs(message).length > 31) {
    wrongEmbed.setTitle(":x: Name too big! Maximum characters allowed are 32.");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (messageArgs(message).length < 2) {
    wrongEmbed.setTitle(":x: Name too short! Minimum characters allowed are 3.");

    sendMessage(message, wrongEmbed);
    return;
  }

  const teamByName = await fetchTeamByGuildIdAndName(message.guild.id, messageArgs(message));

  if (teamByName != null) {
    wrongEmbed.setTitle(":x: Name already in use");

    sendMessage(message, wrongEmbed);
    return;
  }

  const teamById = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  if (teamById != null) {
    wrongEmbed.setTitle(":x: You already belong to a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const teamsInsert = {
    guildId: message.guild.id,
    name: messageArgs(message),
    captain: message.author.id,
    members: [],
    channels: [],
  };

  const teamInsert = new TeamsCollection(teamsInsert);

  await teamInsert.save();

  correctEmbed.setTitle(`:white_check_mark: ${messageArgs(message)} Created!`);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "createteam",
  description:
    "Creates a team, usage: !createteam Maniacs, the bot then creates a role with the teams name and assigns a Team Captain role to the person that created the team",
  execute,
};
