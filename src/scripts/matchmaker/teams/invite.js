const Discord = require("discord.js");

const client = require("../../../utils/createClientInstance.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  invites,
  EMBED_COLOR_WARNING,
  sendMessage,
} = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (message.mentions.members.first() == null) {
    wrongEmbed.setTitle(":x: Please mention the user");

    sendMessage(message, wrongEmbed);
    return;
  }

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: message.author.id,
    guildId: message.guild.id,
  });

  const pingedUser = message.mentions.members.first().user;

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!Object.keys(invites).includes(fetchedTeam.name)) {
    invites[fetchedTeam.name] = [];
  }

  if (invites[fetchedTeam.name].includes(pingedUser.id)) {
    wrongEmbed.setTitle(`:x: ${pingedUser.username} was already invited`);

    sendMessage(message, wrongEmbed);
    return;
  }

  const userTeam = await MatchmakerTeamsCollection.findOne({
    guildId: message.guild.id,
    $or: [
      {
        captain: pingedUser.id,
        memberIds: { $elemMatch: pingedUser.id },
      },
    ],
  });

  if (userTeam != null) {
    wrongEmbed.setTitle(":x: User already belongs to a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  correctEmbed.setTitle(
    `:white_check_mark: Invited ${message.mentions.members.first().user.username} to ${fetchedTeam.name}!`
  );

  const pmEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  try {
    const fetchedUser = await client.users.fetch(pingedUser.id);

    pmEmbed.setTitle(
      `You have been invited to join ${fetchedTeam.name}. Please do !jointeam ${fetchedTeam.name} in the server to join the team`
    );

    await fetchedUser.send(pmEmbed);
  } catch (error) {
    const errorEmbed = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_WARNING)
      .setTitle(
        `:x: Couldn't sent message to <@${pingedUser.id}>, please check if your DM'S aren't set to friends only.`
      );

    console.error(error);

    sendMessage(message, errorEmbed);
  }

  invites[fetchedTeam.name].push(pingedUser.id);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "invite",
  description: "Invites an user, usage: !invite @dany",
  execute,
};
