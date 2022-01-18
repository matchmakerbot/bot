const Discord = require("discord.js");

const GuildsCollection = require("../utils/schemas/guildsSchema");

const { queueTypeObject } = require("../utils/cache");

const { channelQueues } = require("./matchmaker/utils");

const queueTypes = ["solos", "teams"];

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");

const { sendMessage } = require("../utils/utils");

const execute = async (message) => {
  const [, queueSize, queueType] = message.content.split(" ");

  const channelPath = `channels.${message.channel.id}`;

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    return sendMessage(message, wrongEmbed);
  }

  const intGamemode = Number(queueSize);

  if (Number.isNaN(intGamemode)) {
    wrongEmbed.setTitle("Invalid parameter");

    return sendMessage(message, wrongEmbed);
  }

  if (intGamemode % 2 !== 0) {
    wrongEmbed.setTitle("Please choose an even number");

    return sendMessage(message, wrongEmbed);
  }

  if (intGamemode < 2 || intGamemode > 12) {
    wrongEmbed.setTitle("QueueSize must range between 2 and 12");

    return sendMessage(message, wrongEmbed);
  }

  if (!queueTypes.includes(queueType)) {
    wrongEmbed.setTitle("Invalid queueType, please use either solos or teams");

    return sendMessage(message, wrongEmbed);
  }

  const guildsInfo = await GuildsCollection.findOne({ id: message.guild.id });

  if (guildsInfo.channels[message.channel.id] != null) {
    for (const queue of channelQueues) {
      if (queue.players.length === queue.queueSize) {
        wrongEmbed.setTitle("Cannot change queue size once a game has been made");

        return sendMessage(message, wrongEmbed);
      }
      if (queue.channelId === message.channel.id) {
        queue.queueSize = intGamemode;
        queue.queueType = queueType;
        queue.players.splice(0, queue.players.length);
      }
    }
  }

  await GuildsCollection.updateOne(
    {
      id: message.guild.id,
    },
    {
      $set: {
        [`${channelPath}.queueType`]: queueType,
        [`${channelPath}.queueSize`]: Number(queueSize),
      },
    }
  );

  if (queueTypeObject[message.channel.id] != null) {
    queueTypeObject[message.channel.id] = { queueType, queueSize: intGamemode };
  }
  correctEmbed.setTitle(`QueueType set to ${queueSize} ${queueType}`);

  return sendMessage(message, correctEmbed);
};

module.exports = {
  name: "queuetype",
  execute,
};
