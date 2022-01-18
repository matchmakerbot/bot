const Discord = require("discord.js");

const GuildsCollection = require("../utils/schemas/guildsSchema");

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");

const { sendMessage } = require("../utils/utils");

const execute = async (message) => {
  const [, option, value] = message.content.split(" ");
  const options = ["createVoiceChannels", "createTextChannels", "sendDirectMessage"];
  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    return sendMessage(message, wrongEmbed);
  }

  const channelPath = `channels.${message.channel.id}.${option}`;

  if (!options.includes(option)) {
    wrongEmbed.setTitle(
      "Invalid option. Available options are: createVoiceChannels, createTextChannels, sendDirectMessage"
    );
    return sendMessage(message, wrongEmbed);
  }

  if (!["on", "off"].includes(value)) {
    wrongEmbed.setTitle("Invalid value, please use either on or off");
    return sendMessage(message, wrongEmbed);
  }

  await GuildsCollection.updateOne(
    {
      id: message.guild.id,
    },
    {
      $set: {
        [channelPath]: value === "on",
      },
    }
  );

  correctEmbed.setTitle(`${option} set to ${value}`);

  return sendMessage(message, correctEmbed);
};

module.exports = {
  name: "config",
  execute,
};
