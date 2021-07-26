const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamByGuildAndUserId, fetchFromId, invites } = require("../utils");
// send pm to user
const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (message.mentions.members.first() == null) {
    wrongEmbed.setTitle(":x: Please mention the user");

    message.channel.send(wrongEmbed);
    return;
  }

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  const pingedUser = message.mentions.members.first().user.id;

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (fetchedTeam.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (!Object.keys(invites).includes(fetchedTeam.name)) {
    invites[fetchedTeam.name] = [];
  }

  if (invites[fetchedTeam.name].includes(pingedUser)) {
    wrongEmbed.setTitle(`:x: ${(await fetchFromId(pingedUser)).username} was already invited`);

    message.channel.send(wrongEmbed);
    return;
  }

  const userTeam = await fetchTeamByGuildAndUserId(message.guild.id, pingedUser);

  if (userTeam != null) {
    wrongEmbed.setTitle(":x: User already belongs to a team!");

    message.channel.send(wrongEmbed);
    return;
  }

  correctEmbed.setTitle(
    `:white_check_mark: Invited ${message.mentions.members.first().user.username} to ${fetchedTeam.name}!`
  );

  invites[fetchedTeam.name].push(pingedUser);

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "invite",
  description: "Invites an user, usage: !invite @dany",
  execute,
};
