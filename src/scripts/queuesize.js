const Discord = require("discord.js");

const guildsCollection = require("../utils/schemas/guildsSchema");

const { queueSizeObject } = require("../utils/cache");

const { channelQueues } = require("./matchmaker/utils");

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");

const execute = async (message) => {
  const secondArg = message.content.split(" ")[1];

  const a = `channels.${message.channel.id}`;

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    return message.channel.send(wrongEmbed);
  }

  const intGamemode = Number(secondArg);

  if (Number.isNaN(intGamemode)) {
    wrongEmbed.setTitle("Invalid parameter");

    return message.channel.send(wrongEmbed);
  }

  if (intGamemode % 2 !== 0) {
    wrongEmbed.setTitle("Please choose an even number");

    return message.channel.send(wrongEmbed);
  }

  if (intGamemode < 2 || intGamemode > 14) {
    wrongEmbed.setTitle("QueueSize must range between 2 and 14");

    return message.channel.send(wrongEmbed);
  }

  const guildsInfo = await guildsCollection.findOne({ id: message.guild.id });

  const queueSize = guildsInfo.channels[message.channel.id];

  if (guildsInfo.channels[message.channel.id] != null) {
    if (channelQueues[queueSize] != null) {
      if (channelQueues[queueSize][message.channel.id] != null) {
        if (channelQueues[queueSize][message.channel.id].length === Number(queueSize)) {
          wrongEmbed.setTitle("Cannot change queue size once a game has been made");

          return message.channel.send(wrongEmbed);
        }
        delete channelQueues[queueSize][message.channel.id];
      }
    }
  }

  await guildsCollection.updateOne(
    {
      id: message.guild.id,
    },
    {
      $set: {
        [a]: secondArg,
      },
    }
  );

  queueSizeObject[message.channel.id] = secondArg;

  correctEmbed.setTitle(":white_check_mark: Done! Have fun :)");

  return message.channel.send(correctEmbed);
};

module.exports = {
  name: "queuesize",
  execute,
};
