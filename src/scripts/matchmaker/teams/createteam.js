const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, messageArgs, sendMessage } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const teamName = messageArgs(message);

  if (teamName.length > 31) {
    wrongEmbed.setTitle(":x: Name too big! Maximum characters allowed are 32.");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (teamName.length < 2) {
    wrongEmbed.setTitle(":x: Name too short! Minimum characters allowed are 3.");

    sendMessage(message, wrongEmbed);
    return;
  }

  const teamByName = await MatchmakerTeamsCollection.findOne({ name: teamName, guildId: message.guild.id });

  if (teamByName != null) {
    wrongEmbed.setTitle(":x: Name already in use");

    sendMessage(message, wrongEmbed);
    return;
  }

  const teamByUser = await MatchmakerTeamsCollection.findOne({
    guildId: message.guild.id,
    $or: [{ captain: message.author.id }, { memberIds: { $in: message.author.id } }],
  });

  if (teamByUser != null) {
    wrongEmbed.setTitle(":x: You already belong to a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const teamsInsert = {
    guildId: message.guild.id,
    name: teamName,
    captain: message.author.id,
    memberIds: [],
  };

  const teamInsert = new MatchmakerTeamsCollection(teamsInsert);

  await teamInsert.save();

  correctEmbed.setTitle(`:white_check_mark: ${teamsInsert.name} Created!`);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "createteam",
  description: "Creates a team, usage: !createteam Maniacs",
  execute,
};
