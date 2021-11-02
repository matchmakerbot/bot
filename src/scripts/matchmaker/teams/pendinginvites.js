const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, invites } = require("../utils");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const pendingInvites = Object.keys(invites).filter((e) => invites[e].includes(message.author.id));

  if (pendingInvites.length === 0) {
    wrongEmbed.setTitle(":x: You have no pending invites.");

    sendMessage(message, wrongEmbed);
    return;
  }

  correctEmbed.setTitle("Pending Invites:");

  correctEmbed.setDescription(pendingInvites.join(", "), "Show what you can do in order to get more invites!");

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "pendinginvites",
  description: "Check who invited you!",
  execute,
};
