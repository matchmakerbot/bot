const Discord = require("discord.js");

const { sendMessage, EMBED_COLOR_CHECK, getQueueArray } = require("../../../utils/utils");

const execute = (message, queueSize) => {
  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id);

  correctEmbed.setTitle(`Players in queue: ${queueArray.length}/${queueSize}`);

  correctEmbed.setDescription(queueArray.map((e) => e.name).join(", "));

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "status",
  description: "Check the queue status",
  execute,
};
