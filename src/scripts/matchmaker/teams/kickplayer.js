const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamByGuildAndUserId } = require("../utils");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    message.channel.send(wrongEmbed);
    return;
  }

  if (message.mentions.members.first() == null) {
    wrongEmbed.setTitle(":x: Please mention the user");

    message.channel.send(wrongEmbed);
    return;
  }

  const kickedUser = message.mentions.members.first().user;

  if (fetchedTeam.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (!fetchedTeam.members.includes(kickedUser.id)) {
    wrongEmbed.setTitle(":x: User does not belong to your team!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (kickedUser.id === message.author.id) {
    wrongEmbed.setTitle(":x: You cannot kick yourself dummy!");

    message.channel.send(wrongEmbed);
    return;
  }

  await TeamsCollection.update(
    {
      guildId: message.guild.id,
      name: fetchedTeam.name,
    },
    { $pull: { members: kickedUser.id } }
  );

  correctEmbed.setTitle(
    `:white_check_mark: ${message.author.username} just kicked ${kickedUser.username} from ${fetchedTeam.name}`
  );

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "kickplayer",
  description: "Kicks a player from your team, usage:!kickplayer @dany or !kickplayer discordid",
  execute,
};
