const Discord = require("discord.js");
const logger = require("pino")();

const ServerSettingsCollection = require("../utils/schemas/serverSettingsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply, getContent } = require("../utils/utils");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);
  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const guildId = interaction.guild.id;
  const isAdmin = interaction.member.permissions.has("ADMINISTRATOR");

  if (!isAdmin) {
    wrongEmbed.setTitle(":x: You need Administrator permission to use this command!");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  const content = getContent(interaction);
  const action = content[0];

  if (action === "clear") {
    await ServerSettingsCollection.updateOne({ guildId }, { $set: { adminChannelId: null } }, { upsert: true });

    correctEmbed.setTitle(":white_check_mark: Admin Channel Cleared!");
    correctEmbed.setDescription(
      "The admin notification channel has been removed.\n\n" +
        "⚠️ **Warning:** Players will not be able to queue until a new admin channel is set!"
    );
    await sendReply(interaction, correctEmbed);

    logger.info(`Admin ${interaction.user.tag} cleared admin channel in guild ${guildId}`);
    return;
  }

  const channelId = interaction.channel.id;

  await ServerSettingsCollection.updateOne({ guildId }, { $set: { adminChannelId: channelId } }, { upsert: true });

  correctEmbed.setTitle(":white_check_mark: Admin Channel Set!");
  correctEmbed.setDescription(
    `This channel (<#${channelId}>) has been set as the admin notification channel.\n\n` +
      "**What this means:**\n" +
      "• Dispute notifications will be sent here\n" +
      "• Interactive buttons will allow quick resolution\n" +
      "• This is required for matchmaking to work\n\n" +
      "To clear: `/setadminchannel clear`"
  );
  await sendReply(interaction, correctEmbed);

  logger.info(`Admin ${interaction.user.tag} set admin channel to ${channelId} in guild ${guildId}`);
};

module.exports = {
  name: "setadminchannel",
  description: "Admin: Set this channel as the admin notification channel for disputes",
  args: [
    {
      name: "action",
      description: "Action to perform (leave empty to set current channel, or use 'clear')",
      required: false,
      type: "string",
    },
  ],
  execute,
};
