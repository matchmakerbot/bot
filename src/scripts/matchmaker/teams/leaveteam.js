const Discord = require("discord.js");

const TeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamByGuildAndUserId, channelQueues } = require("../utils");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (fetchedTeam.captain === message.author.id) {
    wrongEmbed.setTitle(":x: You are the captain, to delete the team do !disband");

    sendMessage(message, wrongEmbed);
    return;
  }

  const channels = channelQueues.filter((e) => e.guildId === message.guild.id && e.queueMode === "teams");

  for (const channel of channels) {
    if (channel.players[0]?.name === fetchedTeam.name) {
      channel.players.splice(0, channel.players.length);

      wrongEmbed.setTitle(`:x: ${fetchedTeam.name} was kicked from the queue since one of their members left`);

      sendMessage(message, wrongEmbed);
    }
  }

  await TeamsCollection.updateOne(
    {
      guildId: message.guild.id,
      name: fetchedTeam.name,
    },
    { $pull: { members: message.author.id } }
  );

  correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just left ${fetchedTeam.name}`);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "leaveteam",
  description: "Leave your team",
  execute,
};
