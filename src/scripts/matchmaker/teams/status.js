const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, getQueueArray, sendReply } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (interaction, queueSize) => {
  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const channelQueues = await redisInstance.getObject("channelQueues");

  const queueArray = getQueueArray(channelQueues, queueSize, interaction.channel.id, interaction.guild.id);

  correctEmbed.setTitle(`Teams in queue: ${queueArray.length}/2`);

  correctEmbed.setDescription(queueArray.map((e) => e.name).join(", "));

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "status",
  description: "Check the queue status",
  execute,
};
