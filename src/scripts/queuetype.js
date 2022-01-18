const Discord = require("discord.js");

const ChannelsCollection = require("../utils/schemas/channelsSchema");

const { queueTypeObject } = require("../utils/cache");

const { channelQueues } = require("./matchmaker/utils");

const availableQueueModes = ["solos", "teams"];

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");

const { sendMessage } = require("../utils/utils");

const execute = async (message) => {
  const [, queueSize, queueMode] = message.content.split(" ");

  if (!message.member.hasPermission("ADMINISTRATOR")) {
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
    for (const queue of channelQueues) {
      if (queue.players.length === queue.queueSize && queue.channelId === message.channel.id) {
        wrongEmbed.setTitle(":x: Cannot change queue type once a game has been made");

        return sendMessage(message, wrongEmbed);
      }

      if (queue.channelId === message.channel.id) {
        queue.queueSize = intGamemode;
        queue.queueMode = queueMode;
        queue.players.splice(0, queue.players.length);
      }
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

  if (queueTypeObject[message.channel.id] != null) {
    queueTypeObject[message.channel.id] = { queueMode, queueSize: intGamemode };
  }
  correctEmbed.setTitle(`:white_check_mark: QueueType set to ${queueSize} ${queueMode}`);

  return sendMessage(message, correctEmbed);
};

module.exports = {
  name: "queuetype",
  execute,
};
