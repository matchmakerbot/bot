const Discord = require("discord.js");

const ChannelsCollection = require("../utils/schemas/channelsSchema");

const { redisInstance } = require("../utils/createRedisInstance");

const { sendReply } = require("../utils/utils");

const availableQueueModes = ["solos", "teams"];

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");

const execute = async (interaction) => {
  const queueSize = interaction.options.getString("queue_size");

  const queueMode = interaction.options.getString("queue_mode");

  if (!interaction.member.permissions.has("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    await sendReply(interaction, wrongEmbed);

    return;
  }

  const intGamemode = Number(queueSize);

  if (Number.isNaN(intGamemode)) {
    wrongEmbed.setTitle(":x: Invalid parameter");

    await sendReply(interaction, wrongEmbed);

    return;
  }

  if (intGamemode % 2 !== 0) {
    wrongEmbed.setTitle(":x: Please choose an even number");

    await sendReply(interaction, wrongEmbed);

    return;
  }

  if (intGamemode < 2 || intGamemode > 12) {
    wrongEmbed.setTitle(":x: QueueSize must range between 2 and 12");

    await sendReply(interaction, wrongEmbed);

    return;
  }

  if (!availableQueueModes.includes(queueMode)) {
    wrongEmbed.setTitle(":x: Invalid Queue Mode, please use either solos or teams");

    await sendReply(interaction, wrongEmbed);

    return;
  }

  const channelInfo = await ChannelsCollection.findOne({ channelId: interaction.channel.id });

  if (channelInfo != null) {
    const channelQueues = await redisInstance.getObject("channelQueues");

    const isInGame =
      channelQueues.find((e) => e.channelId === interaction.channel.id && e.players.length === e.queueSize) != null;

    if (isInGame) {
      wrongEmbed.setTitle(":x: Cannot change queue type once a game has been made");

      await sendReply(interaction, wrongEmbed);

      return;
    }

    const channelInQueue = channelQueues.find((e) => e.channelId === interaction.channel.id);

    if (channelInQueue != null) {
      channelInQueue.queueType = queueMode;
      channelInQueue.queueSize = intGamemode;
      channelInQueue.players.splice(0, channelInQueue.players.length);
      await redisInstance.setObject("channelQueues", channelQueues);
    }

    await ChannelsCollection.updateOne(
      {
        channelId: interaction.channel.id,
      },
      {
        $set: {
          queueMode,
          queueSize: Number(queueSize),
        },
      }
    );
  } else {
    await ChannelsCollection.create({
      channelId: interaction.channel.id,
      guildId: interaction.guild.id,
      queueSize: intGamemode,
      queueMode,
    });
  }

  const queueTypeObject = await redisInstance.getObject("queueTypeObject");

  if (queueTypeObject[interaction.channel.id] != null) {
    queueTypeObject[interaction.channel.id] = { queueMode, queueSize: intGamemode };
  }

  await redisInstance.setObject("queueTypeObject", queueTypeObject);

  correctEmbed.setTitle(`:white_check_mark: QueueType set to ${queueSize} ${queueMode}`);

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "queuetype",
  description: "Set the queue type for a channel, usage: /queuetype <queueSize> <queueMode>",
  args: [
    { name: "queue_size", description: "queue size, from 2 to 12", required: true },
    { name: "queue_mode", description: "queue mode, solos or teams", required: true },
  ],
  execute,
};
