const Discord = require("discord.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, channelQueues, sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    guildId: message.guild.id,
    memberIds: { $in: message.author.id },
  });

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    sendMessage(message, wrongEmbed);
    return;
  }

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
    { $pull: { memberIds: message.author.id } }
  );

  correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just left ${fetchedTeam.name}`);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "leaveteam",
  description: "Leave your team",
  execute,
};
