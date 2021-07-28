const Discord = require("discord.js");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamByGuildAndUserId, channelQueues } = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    message.channel.send(wrongEmbed);
    return;
  }

  if (fetchedTeam.captain === message.author.id) {
    wrongEmbed.setTitle(":x: You are the captain, to delete the team do !disband");

    message.channel.send(wrongEmbed);
    return;
  }

  const channels = channelQueues.filter((e) => e.guildId === message.guild.id && e.queueType === "teams");

  for (const channel of channels) {
    if (channel.players[0].name === fetchedTeam.name) {
      channel.players.splice(0, channel.players.length);

      wrongEmbed.setTitle(`:x: ${fetchedTeam.name} was kicked from the queue since one of their members left`);

      message.channel.send(wrongEmbed);
    }
  }

  await TeamsCollection.update(
    {
      guildId: message.guild.id,
      name: fetchedTeam.name,
    },
    { $pull: { members: message.author.id } }
  );

  correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just left ${fetchedTeam.name}`);

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "leaveteam",
  description: "Leave your team",
  execute,
};
