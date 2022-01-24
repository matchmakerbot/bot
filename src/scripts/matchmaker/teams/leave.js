const Discord = require("discord.js");

const { sendMessage } = require("../../../utils/utils");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: message.author.id,
    guildId: message.guild.id,
  });

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id);

  if (queueArray.length === 2) {
    wrongEmbed.setTitle(":x: You can't leave now!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (queueArray.length === 0) {
    wrongEmbed.setTitle(":x: You aren't in the queue!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (queueArray[0].name === fetchedTeam.name) {
    queueArray.splice(0, queueArray.length);

    correctEmbed.setTitle(`:white_check_mark: ${fetchedTeam.name} left the queue! 0/2`);

    sendMessage(message, correctEmbed);
  } else {
    wrongEmbed.setTitle(":x: You aren't in the queue!");

    sendMessage(message, wrongEmbed);
  }
};

module.exports = {
  name: "leave",
  description: "Leave the queue",
  execute,
};
