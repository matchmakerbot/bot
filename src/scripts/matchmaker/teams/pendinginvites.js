const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (interaction) => {
  const invites = await redisInstance.getObject("invites");

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const pendingInvites = Object.keys(invites).filter((e) => invites[e].includes(interaction.member.id));

  if (pendingInvites.length === 0) {
    wrongEmbed.setTitle(":x: You have no pending invites.");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  correctEmbed.setTitle("Pending Invites:");

  correctEmbed.setDescription(pendingInvites.join(", "), "Show what you can do in order to get more invites!");

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "pendinginvites",
  description: "Check who invited you!",
  execute,
};
