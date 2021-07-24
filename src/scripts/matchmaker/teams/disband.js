const Discord = require("discord.js");

const {
  messageArgs,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  fetchTeamByGuildAndUserId,
  fetchTeamsByGuildIdAndName,
  fetchGamesTeams,
  includesUserId,
  joinTeam1And2,
} = require("../utils");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (messageArgs(message) !== "") {
    if (message.member.hasPermission("ADMINISTRATOR")) {
      wrongEmbed.setTitle(":x: You do not have administrator permission to delete said team");

      message.channel.send(wrongEmbed);
      return;
    }
    const team = await fetchTeamsByGuildIdAndName(message.guild.id, messageArgs(message));

    if (team == null) {
      wrongEmbed.setTitle(":x: Team not found");

      message.channel.send(wrongEmbed);
      return;
    }

    const gamesList = fetchGamesTeams(message.channel.id);

    if (gamesList.find((game) => includesUserId(joinTeam1And2(game), message.author.id)) == null) {
      wrongEmbed.setTitle(":x: Team is in the middle of a game!");

      message.channel.send(wrongEmbed);
      return;
    }

    // remove from queue

    await TeamsCollection.deleteOne({
      guildId: message.guild.id,
      name: messageArgs(message),
    });

    correctEmbed.setTitle(`:white_check_mark: ${messageArgs(message)} Deleted!`);

    message.channel.send(correctEmbed);
    return;
  }

  const gamesList = fetchGamesTeams(message.channel.id);

  if (gamesList.find((game) => includesUserId(joinTeam1And2(game), message.author.id)) == null) {
    wrongEmbed.setTitle(":x: Team is in the middle of a game!");

    message.channel.send(wrongEmbed);
    return;
  }

  const team = fetchTeamByGuildAndUserId(message.guild.id, message.author.id);

  if (team == null) {
    wrongEmbed.setTitle(":x: You do not belong to a team!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (team.captain !== message.author.id) {
    wrongEmbed.setTitle(":x: You are not the captain!");

    message.channel.send(wrongEmbed);
    return;
  }
  // remove from queue

  await TeamsCollection.deleteOne(team);

  correctEmbed.setTitle(`:white_check_mark: ${team.name} Deleted!`);

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "disband",
  description: "6man bot",
  execute,
};
