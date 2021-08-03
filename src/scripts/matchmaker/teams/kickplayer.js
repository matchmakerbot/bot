const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchTeamByGuildAndUserId, channelQueues } = require("../utils");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const execute = async (message) => {
  let isUsingDiscordId = false;

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  const [, secondArg] = message.content.split(" ");

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team");

    message.channel.send(wrongEmbed);
    return;
  }

  if (message.mentions.members.first() == null) {
    isUsingDiscordId = true;
  }

  const kickedUser = isUsingDiscordId ? secondArg : message.mentions.members.first().user.id;

  if (fetchedTeam.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (!fetchedTeam.members.includes(kickedUser)) {
    wrongEmbed.setTitle(":x: User does not belong to your team!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (kickedUser === message.author.id) {
    wrongEmbed.setTitle(":x: You cannot kick yourself dummy!");

    message.channel.send(wrongEmbed);
    return;
  }

  const channels = channelQueues.filter((e) => e.guildId === message.guild.id && e.queueType === "teams");

  for (const channel of channels) {
    if (channel.players[0]?.name === fetchedTeam.name) {
      channel.players.splice(0, channel.players.length);

      wrongEmbed.setTitle(`:x: ${fetchedTeam.name} was kicked from the queue since one of their members left`);

      message.channel.send(wrongEmbed);
    }
  }

  await TeamsCollection.update(
    {
      guildId: message.guild.id,
      name: fetchedTeam.name,
    },
    { $pull: { members: kickedUser } }
  );

  correctEmbed.setTitle(
    `:white_check_mark: ${message.author.username} just kicked ${
      isUsingDiscordId ? secondArg : message.mentions.members.first().user.id
    } from ${fetchedTeam.name}`
  );

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "kickplayer",
  description: "Kicks a player from your team, usage:!kickplayer @dany or !kickplayer discordid",
  execute,
};
