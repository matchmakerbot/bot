const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, getQueueArray } = require("../utils");

const execute = (message, queueSize) => {
  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const queueArray = getQueueArray(queueSize, message.channel.id);

  correctEmbed.setTitle(`Players in queue: ${queueArray.length}/${queueSize}`);

  correctEmbed.setDescription(queueArray.map((e) => e.name).join(", "));

  return message.channel.send(correctEmbed);
};

module.exports = {
  name: "status",
  description: "6man bot",
  execute,
};
