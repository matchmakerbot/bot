const Discord = require("discord.js");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamByGuildAndUserId /* getQueueArray */ } = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchTeam = fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  // const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id, "solos");

  // check if is in queue

  if (fetchTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    return message.channel.send(wrongEmbed);
  }

  if (fetchTeam.captain === message.author.id) {
    wrongEmbed.setTitle(":x: You are the captain, to delete the team do !disband");

    return message.channel.send(wrongEmbed);
  }

  fetchTeam.members.splice(fetchTeam.members.indexOf(message.author.id), 1);

  await TeamsCollection.update(
    {
      id: message.guild.id,
      name: fetchTeam.name,
    },
    {
      fetchTeam,
    }
  );

  correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just left ${fetchTeam.name}`);

  return message.channel.send(correctEmbed);
};

module.exports = {
  name: "leaveteam",
  description: "6man bot",
  execute,
};
