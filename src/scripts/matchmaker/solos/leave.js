const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray } = require("../utils");

const execute = (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id, "solos");

  const index = queueArray.map((e) => e.id).indexOf(message.author.id);

  if (queueArray.length === queueSize) {
    wrongEmbed.setTitle(":x: You can't leave now!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (index === -1) {
    wrongEmbed.setTitle(":x: You aren't in the queue!");

    message.channel.send(wrongEmbed);
    return;
  }

  queueArray.splice(index, 1);

  correctEmbed.setTitle(
    `:white_check_mark: ${message.author.username} left the queue! ${queueArray.length}/${queueSize}`
  );

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "Leave the queue",
  description: "6man bot",
  execute,
};
