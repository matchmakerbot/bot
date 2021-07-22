const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamByGuildAndUserId, fetchFromId } = require("../utils");

const invites = {};

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  const pingedUser = message.mentions.members.first().user.id;

  if (message.mentions.members.first() == null) {
    wrongEmbed.setTitle(":x: Please mention the user");

    return message.channel.send(wrongEmbed);
  }

  if (fetchedTeam.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    return message.channel.send(wrongEmbed);
  }

  if (!Object.keys(invites).includes(fetchedTeam.name)) {
    invites[fetchedTeam.name] = [];
  }

  if (invites[fetchedTeam.name].includes(pingedUser)) {
    wrongEmbed.setTitle(`:x: ${(await fetchFromId(pingedUser)).username} was already invited`);

    return message.channel.send(wrongEmbed);
  }

  const userTeam = fetchTeamByGuildAndUserId(message.guild.id, pingedUser);

  if (userTeam != null) {
    wrongEmbed.setTitle(":x: User already belongs to a team!");

    return message.channel.send(wrongEmbed);
  }

  correctEmbed.setTitle(
    `:white_check_mark: Invited ${message.mentions.members.first().user.username} to ${fetchedTeam.name}!`
  );

  invites[fetchedTeam.name].push(pingedUser);

  return message.channel.send(correctEmbed);
};

module.exports = {
  name: "invite",
  description: "6man bot",
  execute,
};
