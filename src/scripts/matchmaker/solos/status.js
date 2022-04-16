const Discord = require("discord.js");

const { sendReply, EMBED_COLOR_CHECK, getQueueArray } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (interaction, queueSize) => {
  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const channelQueues = await redisInstance.getObject("channelQueues");

  const queueArray = getQueueArray(channelQueues, queueSize, interaction.channel.id, interaction.guild.id);

  correctEmbed.setTitle(`Players in queue: ${queueArray.length}/${queueSize}`);

  correctEmbed.setDescription(queueArray.map((e) => e.username).join(", "));

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "status",
  description: "Check the queue status",
  execute,
};
