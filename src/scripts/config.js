const Discord = require("discord.js");

const ChannelsCollection = require("../utils/schemas/channelsSchema");

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");

const { sendReply, getContent } = require("../utils/utils");

const execute = async (interaction) => {
  const [option, value] = getContent(interaction);

  const options = ["createVoiceChannels", "createTextChannels", "sendDirectMessage"];

  const channelInfo = await ChannelsCollection.findOne({ channelId: interaction.channel.id });

  if (!channelInfo) {
    wrongEmbed.setTitle(
      ":x: This channel is not a matchmaker channel, please set the queueMode and queueSize first, to do this check /help"
    );

    await sendReply(interaction, wrongEmbed);

    return;
  }

  if (!interaction.member.permissions.has("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    await sendReply(interaction, wrongEmbed);

    return;
  }

  if (!options.includes(option)) {
    wrongEmbed.setTitle(
      ":x: Invalid option. Available options are: createVoiceChannels, createTextChannels, sendDirectMessage"
    );
    await sendReply(interaction, wrongEmbed);

    return;
  }

  if (!["on", "off"].includes(value)) {
    wrongEmbed.setTitle(":x: Invalid value, please use either on or off");

    await sendReply(interaction, wrongEmbed);

    return;
  }

  await ChannelsCollection.updateOne(
    {
      channelId: interaction.channel.id,
    },
    {
      [option]: value === "on",
    }
  );

  correctEmbed.setTitle(`:white_check_mark: ${option} set to ${value}`);

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "config",
  description: "Configure the matchmaker channel, usage: /config createVoiceChannels on",
  args: [
    { name: "type", description: "createVoiceChannels, createTextChannels, sendDirectMessage", required: true },
    { name: "mode", description: "on/off", required: true },
  ],
  execute,
};
