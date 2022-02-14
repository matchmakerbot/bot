const Discord = require("discord.js");

const ChannelsCollection = require("../utils/schemas/channelsSchema");

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");

const { sendMessage } = require("../utils/utils");

const execute = async (message) => {
  const [, option, value] = message.content.split(" ");

  const options = ["createVoiceChannels", "createTextChannels", "sendDirectMessage"];

  const channelInfo = await ChannelsCollection.findOne({ channelId: message.channel.id });

  if (!channelInfo) {
    wrongEmbed.setTitle(
      ":x: This channel is not a matchmaker channel, please set the queueMode and queueSize first, to do this check !help"
    );

    return sendMessage(message, wrongEmbed);
  }

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    return sendMessage(message, wrongEmbed);
  }

  if (!options.includes(option)) {
    wrongEmbed.setTitle(
      ":x: Invalid option. Available options are: createVoiceChannels, createTextChannels, sendDirectMessage"
    );
    return sendMessage(message, wrongEmbed);
  }

  if (!["on", "off"].includes(value)) {
    wrongEmbed.setTitle(":x: Invalid value, please use either on or off");
    return sendMessage(message, wrongEmbed);
  }

  await ChannelsCollection.updateOne(
    {
      channelId: message.channel.id,
    },
    {
      [option]: value === "on",
    }
  );

  correctEmbed.setTitle(`:white_check_mark: ${option} set to ${value}`);

  return sendMessage(message, correctEmbed);
};

module.exports = {
  name: "config",
  execute,
};
