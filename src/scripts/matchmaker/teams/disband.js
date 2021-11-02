const Discord = require("discord.js");

const {
  messageArgs,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  fetchTeamByGuildAndUserId,
  fetchTeamByGuildIdAndName,
  fetchGamesTeams,
  channelQueues,
  invites,
} = require("../utils");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (messageArgs(message) !== "") {
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      wrongEmbed.setTitle(":x: You do not have administrator permission to delete said team");

      sendMessage(message, wrongEmbed);
      return;
    }
    const team = await fetchTeamByGuildIdAndName(message.guild.id, messageArgs(message));

    if (team == null) {
      wrongEmbed.setTitle(":x: Team not found");

      sendMessage(message, wrongEmbed);
      return;
    }

    const ongoingGames = await fetchGamesTeams(null, message.guild.id);

    if (
      ongoingGames
        .map((e) => [e.team1, e.team2])
        .flat()
        .map((e) => e.name)
        .includes(messageArgs(message))
    ) {
      wrongEmbed.setTitle(":x: Team is in the middle of a game!");

      sendMessage(message, wrongEmbed);
      return;
    }

    const channels = channelQueues.filter((e) => e.guildId === message.guild.id && e.queueType === "teams");

    for (const channel of channels) {
      if (channel.players[0]?.name === messageArgs(message)) {
        channel.players.splice(0, channel.players.length);

        wrongEmbed.setTitle(`:x: ${messageArgs(message)} was kicked from the queue since they were disbanded`);

        sendMessage(message, wrongEmbed);
      }
    }

    await TeamsCollection.deleteOne({
      guildId: message.guild.id,
      name: messageArgs(message),
    });
    if (invites[messageArgs] != null) {
      invites[messageArgs(message)].splice(0, invites[messageArgs(message)].length);
    }

    correctEmbed.setTitle(`:white_check_mark: ${messageArgs(message)} Deleted!`);

    sendMessage(message, correctEmbed);
    return;
  }

  const ongoingGames = await fetchGamesTeams(null, message.guild.id);

  const fetchedTeam = await fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (fetchedTeam.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (
    ongoingGames
      .map((e) => [e.team1, e.team2])
      .flat()
      .map((e) => e.name)
      .includes(fetchedTeam.name)
  ) {
    wrongEmbed.setTitle(":x: Your team is in the middle of a game!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const channels = channelQueues.filter((e) => e.guildId === message.guild.id && e.queueType === "teams");

  for (const channel of channels) {
    if (channel.players[0]?.name === fetchedTeam.name) {
      channel.players.splice(0, channel.players.length);
      wrongEmbed.setTitle(`:x: ${fetchedTeam.name} was kicked from the queue since they were disbanded`);

      sendMessage(message, wrongEmbed);
    }
  }

  await TeamsCollection.deleteOne(fetchedTeam);

  if (invites[fetchedTeam.name] != null) {
    invites[fetchedTeam.name].splice(0, invites[fetchedTeam.name].length);
  }

  correctEmbed.setTitle(`:white_check_mark: ${fetchedTeam.name} Deleted!`);

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "disband",
  description: "Deletes your team, admins can also delete a team by typing !disband teamname",
  execute,
};
