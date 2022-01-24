const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, messageArgs, invites, sendMessage } = require("../../../utils/utils");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const guildTeams = await MatchmakerTeamsCollection.findMany({ guildId: message.guild.id });

  const teamName = messageArgs(message);

  if (
    guildTeams
      .map((e) => e.members)
      .flat()
      .includes(message.author.id) ||
    guildTeams.map((e) => e.captains).includes(message.author.id)
  ) {
    wrongEmbed.setTitle(":x: You already belong to a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!guildTeams.map((e) => e.name).includes(teamName)) {
    wrongEmbed.setTitle(":x: This team doesn't exist");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!Object.keys(invites).includes(teamName)) {
    wrongEmbed.setTitle(":x: This team didn't invite anyone!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const invitePath = invites[teamName];

  if (!invitePath.includes(message.author.id)) {
    wrongEmbed.setTitle(":x: This team didn't invite you!");

    sendMessage(message, wrongEmbed);
    return;
  }

  await MatchmakerTeamsCollection.updateOne(
    {
      guildId: message.guild.id,
      name: teamName,
    },
    { $push: { memberIds: message.author.id } }
  );

  if (invitePath.length === 1) {
    delete invites[teamName];
  } else {
    invitePath.splice(invitePath.indexOf(teamName), 1);
  }

  correctEmbed.setTitle(`:white_check_mark: ${message.author.username} joined ${teamName}!`);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "jointeam",
  description: "Join a team that invited you, usage: !jointeam Maniacs",
  execute,
};
