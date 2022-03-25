const Discord = require("discord.js");

const ChannelsCollection = require("../utils/schemas/channelsSchema");

const { redisInstance } = require("../utils/createRedisInstance");

const { sendMessage } = require("../utils/utils");

const availableQueueModes = ["solos", "teams"];

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");

const execute = async (message) => {
  const [, queueSize, queueMode] = message.content.split(" ");

  if (!message.member.permissions.has("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    return sendMessage(message, wrongEmbed);
  }

  const intGamemode = Number(queueSize);

  if (Number.isNaN(intGamemode)) {
    wrongEmbed.setTitle(":x: Invalid parameter");

    return sendMessage(message, wrongEmbed);
  }

  if (intGamemode % 2 !== 0) {
    wrongEmbed.setTitle(":x: Please choose an even number");

    return sendMessage(message, wrongEmbed);
  }

  if (intGamemode < 2 || intGamemode > 12) {
    wrongEmbed.setTitle(":x: QueueSize must range between 2 and 12");

    return sendMessage(message, wrongEmbed);
  }

  if (!availableQueueModes.includes(queueMode)) {
    wrongEmbed.setTitle(":x: Invalid Queue Mode, please use either solos or teams");

    return sendMessage(message, wrongEmbed);
  }

  const channelInfo = await ChannelsCollection.findOne({ channelId: message.channel.id });

  if (channelInfo != null) {
    const channelQueues = await redisInstance.getObject("channelQueues");

    const isInGame =
      channelQueues.find((e) => e.channelId === message.channel.id && e.players.length === e.queueSize) != null;

    if (isInGame) {
      wrongEmbed.setTitle(":x: Cannot change queue type once a game has been made");

      return sendMessage(message, wrongEmbed);
    }

    const channelInQueue = channelQueues.find((e) => e.channelId === message.channel.id);

    if (channelInQueue != null) {
      channelInQueue.queueType = queueMode;
      channelInQueue.queueSize = intGamemode;
      channelInQueue.players.splice(0, channelInQueue.players.length);
      await redisInstance.setObject("channelQueues", channelQueues);
    }

    await ChannelsCollection.updateOne(
      {
        channelId: message.channel.id,
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
      channelId: message.channel.id,
      guildId: message.guild.id,
      queueSize: intGamemode,
      queueMode,
    });
  }

  const queueTypeObject = await redisInstance.getObject("queueTypeObject");

  if (queueTypeObject[message.channel.id] != null) {
    queueTypeObject[message.channel.id] = { queueMode, queueSize: intGamemode };
  }

  await redisInstance.setObject("queueTypeObject", queueTypeObject);

  correctEmbed.setTitle(`:white_check_mark: QueueType set to ${queueSize} ${queueMode}`);

  return sendMessage(message, correctEmbed);
};

module.exports = {
  name: "queuetype",
  description: "Set the queue type for a channel, usage: !queuetype <queueSize> <queueMode>",
  execute,
};
