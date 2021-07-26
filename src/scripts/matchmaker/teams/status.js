const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, getQueueArray } = require("../utils");

const execute = (message, queueSize) => {
  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id, "teams");

  correctEmbed.setTitle(`Teams in queue: ${queueArray.length}/2`);

  correctEmbed.setDescription(queueArray.map((e) => e.name).join(", "));

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "status",
  description: "6man bot",
  execute,
};
