const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { sendMessage } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance.js");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: message.author.id,
    guildId: message.guild.id,
  });

  const [, secondArg] = message.content.split(" ");

  if (!fetchedTeam) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const kickedUser = !message.mentions.members.first() ? secondArg : message.mentions.members.first().user.id;

  if (!fetchedTeam.memberIds.includes(kickedUser)) {
    wrongEmbed.setTitle(":x: User does not belong to your team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (kickedUser === message.author.id) {
    wrongEmbed.setTitle(":x: You cannot kick yourself dummy!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const channelQueues = await redisInstance.getObject("channelQueues");

  const channels = channelQueues.filter((e) => e.guildId === message.guild.id);

  const inQueue = channels.find((e) => e.players[0]?.name === fetchedTeam.name);

  if (inQueue != null) {
    inQueue.players.splice(0, inQueue.players.length);

    wrongEmbed.setTitle(`:x: ${fetchedTeam.name} was kicked from the queue since one of their members was kicked`);

    sendMessage(message, wrongEmbed);
  }

  await MatchmakerTeamsCollection.updateOne(
    {
      guildId: message.guild.id,
      name: fetchedTeam.name,
    },
    { $pull: { memberIds: kickedUser } }
  );

  correctEmbed.setTitle(
    `:white_check_mark: ${message.author.username} just kicked ${kickedUser} from ${fetchedTeam.name}`
  );

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "kickplayer",
  description: "Kicks a player from your team, usage:!kickplayer @dany or !kickplayer discordid",
  execute,
};
