const Discord = require("discord.js");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamByGuildAndUserId /* getQueueArray */ } = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  // const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id, "teams");

  // check if is in queue

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    return message.channel.send(wrongEmbed);
  }

  if (fetchedTeam.captain === message.author.id) {
    wrongEmbed.setTitle(":x: You are the captain, to delete the team do !disband");

    return message.channel.send(wrongEmbed);
  }

  await TeamsCollection.update(
    {
      guildId: message.guild.id,
      name: fetchedTeam.name,
    },
    { $pull: { members: message.author.id } }
  );

  correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just left ${fetchedTeam.name}`);

  return message.channel.send(correctEmbed);
};

module.exports = {
  name: "leaveteam",
  description: "Leave your team",
  execute,
};
