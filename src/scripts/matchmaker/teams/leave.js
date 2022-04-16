const Discord = require("discord.js");

const { sendReply } = require("../../../utils/utils");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const execute = async (interaction, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: interaction.member.id,
    guildId: interaction.guild.id,
  });

  if (!fetchedTeam) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const channelQueues = await redisInstance.getObject("channelQueues");

  const queueArray = getQueueArray(channelQueues, queueSize, interaction.channel.id, interaction.guild.id);

  if (queueArray.length === 2) {
    wrongEmbed.setTitle(":x: You can't leave now!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (queueArray.length === 0) {
    wrongEmbed.setTitle(":x: You aren't in the queue!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (queueArray[0].name === fetchedTeam.name) {
    queueArray.splice(0, queueArray.length);

    await redisInstance.setObject("channelQueues", channelQueues);

    correctEmbed.setTitle(`:white_check_mark: ${fetchedTeam.name} left the queue! 0/2`);

    await sendReply(interaction, correctEmbed);
  } else {
    wrongEmbed.setTitle(":x: You aren't in the queue!");

    await sendReply(interaction, wrongEmbed);
  }
};

module.exports = {
  name: "leave",
  description: "Leave the queue",
  execute,
};
