const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, messageArgs, fetchTeamsByGuildId } = require("../utils");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (messageArgs(message).length > 31) {
    wrongEmbed.setTitle(":x: Name too big! Maximum characters allowed are 32.");

    return message.channel.send(wrongEmbed);
  }

  if (messageArgs(message).length < 2) {
    wrongEmbed.setTitle(":x: Name too short! Minimum characters allowed are 3.");

    return message.channel.send(wrongEmbed);
  }

  const guildTeams = await fetchTeamsByGuildId(message.guild.id);

  if (guildTeams.map((e) => e.name).includes(messageArgs(message))) {
    wrongEmbed.setTitle(":x: Name already in use");

    return message.channel.send(wrongEmbed);
  }

  if (
    guildTeams
      .map((e) => e.members)
      .flat()
      .includes(message.author.id) ||
    guildTeams.map((e) => e.captains).includes(message.author.id)
  ) {
    wrongEmbed.setTitle(":x: You already belong to a team!");

    return message.channel.send(wrongEmbed);
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

  return message.channel.send(correctEmbed);
};

module.exports = {
  name: "createteam",
  description: "6man bot",
  execute,
};
