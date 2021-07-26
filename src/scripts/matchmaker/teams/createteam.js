const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, messageArgs, fetchTeamsByGuildId } = require("../utils");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (messageArgs(message).length > 31) {
    wrongEmbed.setTitle(":x: Name too big! Maximum characters allowed are 32.");

    message.channel.send(wrongEmbed);
    return;
  }

  if (messageArgs(message).length < 2) {
    wrongEmbed.setTitle(":x: Name too short! Minimum characters allowed are 3.");

    message.channel.send(wrongEmbed);
    return;
  }

  const guildTeams = await fetchTeamsByGuildId(message.guild.id);

  if (guildTeams.map((e) => e.name).includes(messageArgs(message))) {
    wrongEmbed.setTitle(":x: Name already in use");

    message.channel.send(wrongEmbed);
    return;
  }

  if (
    guildTeams
      .map((e) => e.members)
      .flat()
      .includes(message.author.id) ||
    guildTeams.map((e) => e.captain).includes(message.author.id)
  ) {
    wrongEmbed.setTitle(":x: You already belong to a team!");

    message.channel.send(wrongEmbed);
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

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "createteam",
  description:
    "Creates a team, usage: !createteam Maniacs, the bot then creates a role with the teams name and assigns a Team Captain role to the person that created the team",
  execute,
};
