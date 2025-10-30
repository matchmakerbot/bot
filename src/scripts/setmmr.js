const Discord = require("discord.js");
const logger = require("pino")();

const MatchmakerUsersScoreCollection = require("../utils/schemas/matchmakerUsersScoreSchema");
const ServerSettingsCollection = require("../utils/schemas/serverSettingsSchema");
const ChannelsCollection = require("../utils/schemas/channelsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, EMBED_COLOR_WARNING, sendReply, getContent } = require("../utils/utils");

const execute = async (interaction) => {
  const content = getContent(interaction);
  const mmrValue = content[0];
  const targetUser = interaction.options.getUser("user");
  const isGlobal = interaction.options.getBoolean("global") || false;

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);
  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);
  const warningEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING);

  const guildId = interaction.guild.id;
  const channelId = interaction.channel.id;
  const isAdmin = interaction.member.permissions.has("ADMINISTRATOR");

  if (!isAdmin) {
    wrongEmbed.setTitle(":x: You need Administrator permission to use this command!");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (mmrValue < 0) {
    wrongEmbed.setTitle(":x: MMR value must be 0 or greater!");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (mmrValue > 10000) {
    wrongEmbed.setTitle(":x: MMR value cannot exceed 10,000!");
    await sendReply(interaction, wrongEmbed);
    return;
  }

  const channelInfo = await ChannelsCollection.findOne({ channelId });

  if (!channelInfo) {
    wrongEmbed.setTitle(
      ":x: This channel is not a matchmaker channel! Please set the queueMode and queueSize first using /queuetype. Check /help for details."
    );
    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (isGlobal) {
    if (!isAdmin) {
      wrongEmbed.setTitle(":x: You need Administrator permission to set the global default MMR!");
      await sendReply(interaction, wrongEmbed);
      return;
    }

    await ServerSettingsCollection.updateOne({ guildId }, { $set: { defaultStartingMMR: mmrValue } }, { upsert: true });

    correctEmbed.setTitle(`:white_check_mark: Server-wide default starting MMR set to ${mmrValue}!`);
    correctEmbed.setDescription("All new users will start with this MMR value.");
    await sendReply(interaction, correctEmbed);

    logger.info(`Admin ${interaction.user.tag} set global MMR to ${mmrValue} in guild ${guildId}`);
    return;
  }

  const userId = targetUser ? targetUser.id : interaction.user.id;
  const username = targetUser ? targetUser.username : interaction.user.username;

  const existingUser = await MatchmakerUsersScoreCollection.findOne({
    userId,
    channelId,
  });

  if (existingUser) {
    await MatchmakerUsersScoreCollection.updateOne({ userId, channelId }, { $set: { mmr: mmrValue } });

    correctEmbed.setTitle(`:white_check_mark: MMR updated successfully!`);
    correctEmbed.addField("User", targetUser ? `<@${userId}>` : "You", true);
    correctEmbed.addField("Previous MMR", existingUser.mmr.toString(), true);
    correctEmbed.addField("New MMR", mmrValue.toString(), true);

    if (mmrValue < 1000 && !targetUser) {
      warningEmbed.setTitle(":warning: Low MMR Warning");
      warningEmbed.setDescription(
        `You've set your MMR to ${mmrValue}, which is below the default of 1000. This is a great way to grind from scratch! Good luck!`
      );
      await sendReply(interaction, warningEmbed);
      await interaction.followUp({ embeds: [correctEmbed] });
    } else {
      await sendReply(interaction, correctEmbed);
    }

    logger.info(
      `${
        isAdmin && targetUser ? `Admin ${interaction.user.tag} set` : "User"
      } MMR for ${username} (${userId}) to ${mmrValue} in channel ${channelId}`
    );
  } else {
    await MatchmakerUsersScoreCollection.create({
      userId,
      username,
      guildId,
      channelId,
      mmr: mmrValue,
      wins: 0,
      losses: 0,
    });

    correctEmbed.setTitle(`:white_check_mark: MMR set successfully!`);
    correctEmbed.addField("User", targetUser ? `<@${userId}>` : "You", true);
    correctEmbed.addField("Starting MMR", mmrValue.toString(), true);
    correctEmbed.setDescription("Your matchmaker profile has been created!");

    if (mmrValue < 1000 && !targetUser) {
      warningEmbed.setTitle(":warning: Low MMR Start");
      warningEmbed.setDescription(
        `You're starting with ${mmrValue} MMR, which is below the default of 1000. Time to grind! Good luck!`
      );
      await sendReply(interaction, warningEmbed);
      await interaction.followUp({ embeds: [correctEmbed] });
    } else {
      await sendReply(interaction, correctEmbed);
    }

    logger.info(
      `${
        isAdmin && targetUser ? `Admin ${interaction.user.tag} created profile for` : "User"
      } ${username} (${userId}) with MMR ${mmrValue} in channel ${channelId}`
    );
  }
};

module.exports = {
  name: "setmmr",
  description: "Admin: Set MMR for users or configure server-wide default starting MMR",
  args: [
    {
      name: "mmr",
      description: "The MMR value to set (0-10000)",
      required: true,
      type: "integer",
    },
    {
      name: "user",
      description: "Target user (Admin only)",
      required: false,
      type: "mention",
    },
    {
      name: "global",
      description: "Set server-wide default MMR (Admin only)",
      required: false,
      type: "boolean",
    },
  ],
  execute,
};
