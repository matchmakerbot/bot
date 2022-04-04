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

  const [secondArg] = getContent(interaction);

  if (!fetchedTeam) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  const kickedUser = !interaction.mentions.members.first() ? secondArg : interaction.mentions.members.first().user.id;

  if (!fetchedTeam.memberIds.includes(kickedUser)) {
    wrongEmbed.setTitle(":x: User does not belong to your team!");

    sendReply(interaction, wrongEmbed);
    return;
  }

  if (kickedUser === interaction.member.id) {
    wrongEmbed.setTitle(":x: You cannot kick yourself dummy!");

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
    { $pull: { memberIds: kickedUser } }
  );

  correctEmbed.setTitle(
    `:white_check_mark: ${interaction.member.user.username} just kicked ${kickedUser} from ${fetchedTeam.name}`
  );

  sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "kickplayer",
  description: "Kicks a player from your team, usage: /kickplayer @dany or /kickplayer discordid",
  execute,
};
