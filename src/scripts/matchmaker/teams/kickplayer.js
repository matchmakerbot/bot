const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getContent } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { sendReply } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: interaction.member.id,
    guildId: interaction.guild.id,
  });

  const kickedUser = getContent(interaction);

  if (!fetchedTeam) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (!fetchedTeam.memberIds.includes(kickedUser.id)) {
    wrongEmbed.setTitle(":x: User does not belong to your team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (kickedUser.id === interaction.member.id) {
    wrongEmbed.setTitle(":x: You cannot kick yourself dummy!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const channelQueues = await redisInstance.getObject("channelQueues");

  const channels = channelQueues.filter((e) => e.guildId === interaction.guild.id);

  const inQueue = channels.find((e) => e.players[0]?.name === fetchedTeam.name);

  if (inQueue != null) {
    inQueue.players.splice(0, inQueue.players.length);

    wrongEmbed.setTitle(`:x: ${fetchedTeam.name} was kicked from the queue since one of their members was kicked`);

    await sendReply(interaction, wrongEmbed);
  }

  await MatchmakerTeamsCollection.updateOne(
    {
      guildId: interaction.guild.id,
      name: fetchedTeam.name,
    },
    { $pull: { memberIds: kickedUser.id } }
  );

  correctEmbed.setTitle(
    `:white_check_mark: ${interaction.member.user.username} just kicked ${kickedUser.username} from ${fetchedTeam.name}`
  );

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "kickplayer",
  description: "Kicks a player from your team, usage: /kickplayer @dany or /kickplayer discordid",
  args: [
    { name: "user", description: "user", required: false, type: "mention" },
    { name: "userdiscordid", description: "Users Discord Id", required: false },
  ],
  execute,
};
