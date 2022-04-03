const Discord = require("discord.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    guildId: interaction.guild.id,
    memberIds: { $in: interaction.member.id },
  });

  if (!fetchedTeam) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    sendReply(interaction, wrongEmbed);
    return;
  }

  const channelQueues = await redisInstance.getObject("channelQueues");

  const channels = channelQueues.filter((e) => e.guildId === interaction.guild.id);

  const inQueue = channels.find((e) => e.players[0]?.name === fetchedTeam.name);

  if (inQueue != null) {
    inQueue.players.splice(0, inQueue.players.length);

    wrongEmbed.setTitle(`:x: ${fetchedTeam.name} was kicked from the queue since one of their members was kicked`);

    sendReply(interaction, wrongEmbed);
  }

  await MatchmakerTeamsCollection.updateOne(
    {
      guildId: interaction.guild.id,
      name: fetchedTeam.name,
    },
    { $pull: { memberIds: interaction.member.id } }
  );

  correctEmbed.setTitle(`:white_check_mark: ${interaction.member.user.username} just left ${fetchedTeam.name}`);

  sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "leaveteam",
  description: "Leave your team",
  execute,
};
