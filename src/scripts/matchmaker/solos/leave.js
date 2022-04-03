const Discord = require("discord.js");

const { sendReply, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const execute = async (interaction, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const channelQueues = await redisInstance.getObject("channelQueues");

  const queueArray = getQueueArray(channelQueues, queueSize, interaction.channel.id, interaction.guild.id);

  const index = queueArray.map((e) => e.userId).indexOf(interaction.member.id);

  if (queueArray.length === queueSize) {
    wrongEmbed.setTitle(":x: You can't leave now!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (index === -1) {
    wrongEmbed.setTitle(":x: You aren't in the queue!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  queueArray.splice(index, 1);

  await redisInstance.setObject("channelQueues", channelQueues);

  correctEmbed.setTitle(
    `:white_check_mark: ${interaction.member.user.username} left the queue! ${queueArray.length}/${queueSize}`
  );

  sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "leave",
  description: "Leave the queue",
  execute,
};
