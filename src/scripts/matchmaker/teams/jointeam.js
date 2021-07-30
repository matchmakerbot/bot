const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamsByGuildId, messageArgs, invites } = require("../utils");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const guildTeams = await fetchTeamsByGuildId(message.guild.id);

  if (
    guildTeams
      .map((e) => e.members)
      .flat()
      .includes(message.author.id) ||
    guildTeams.map((e) => e.captains).includes(message.author.id)
  ) {
    wrongEmbed.setTitle(":x: You already belong to a team!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (!guildTeams.map((e) => e.name).includes(messageArgs(message))) {
    wrongEmbed.setTitle(":x: This team doesn't exist");

    message.channel.send(wrongEmbed);
    return;
  }

  if (!Object.keys(invites).includes(messageArgs(message))) {
    wrongEmbed.setTitle(":x: This team didn't invite anyone!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (!invites[messageArgs(message)].includes(message.author.id)) {
    wrongEmbed.setTitle(":x: This team didn't invite you!");

    message.channel.send(wrongEmbed);
    return;
  }

  await TeamsCollection.update(
    {
      guildId: message.guild.id,
      name: messageArgs(message),
    },
    { $push: { members: message.author.id } }
  );

  invites[messageArgs(message)].splice(invites[messageArgs(message)].indexOf(message.author.id), 1);

  correctEmbed.setTitle(`:white_check_mark: ${message.author.username} joined ${messageArgs(message)}!`);

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "jointeam",
  description: "Join a team that invited you, usage: !jointeam Maniacs",
  execute,
};
