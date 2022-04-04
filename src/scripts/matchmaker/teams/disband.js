const Discord = require("discord.js");

const { messageArgs, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const OngoingGames = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const disbandTeam = async (message, fetchedTeam) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (!fetchedTeam) {
    wrongEmbed.setTitle(`:x: ${messageArgs(message) !== "" ? "Team not found" : "You are not the captain of a team!"}`);

    sendReply(message, wrongEmbed);
    return;
  }

  const foundGame = await OngoingGames.findOne({
    guildId: message.channel.id,
    $or: [
      {
        "team1.name": fetchedTeam.name,
      },
      {
        "team2.name": fetchedTeam.name,
      },
    ],
  });

  if (foundGame != null) {
    wrongEmbed.setTitle(":x: Team is in the middle of a game!");

    sendReply(message, wrongEmbed);

    return;
  }

  const channelQueues = await redisInstance.getObject("channelQueues");

  const channels = channelQueues.filter((e) => e.guildId === message.guild.id);

  const inQueue = channels.find((e) => e.players[0]?.name === fetchedTeam.name);

  if (inQueue != null) {
    inQueue.players.splice(0, inQueue.players.length);

    wrongEmbed.setTitle(`:x: ${fetchedTeam.name} was kicked from the queue since they were disbanded`);

    sendReply(message, wrongEmbed);
  }

  await MatchmakerTeamsCollection.deleteOne({
    guildId: message.guild.id,
    name: fetchedTeam.name,
  });

  const invites = await redisInstance.getObject("invites");

  if (invites[fetchedTeam.name] != null) {
    invites[fetchedTeam.name].splice(0, invites[fetchedTeam.name].length);

    await redisInstance.setObject("invites", invites);
  }

  correctEmbed.setTitle(`:white_check_mark: ${fetchedTeam.name} Deleted!`);

  sendReply(message, correctEmbed);
};

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  if (messageArgs(interaction) !== "") {
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      wrongEmbed.setTitle(":x: You do not have administrator permission to delete said team");

      sendReply(interaction, wrongEmbed);
      return;
    }
    const fetchedTeam = await MatchmakerTeamsCollection.findOne({
      guildId: interaction.guild.id,
      name: messageArgs(interaction),
    });

    disbandTeam(interaction, fetchedTeam);

    return;
  }

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: interaction.member.id,
    guildId: interaction.guild.id,
  });

  disbandTeam(interaction, fetchedTeam);
};

module.exports = {
  name: "disband",
  description: "Deletes your team, admins can also delete a team by typing /disband teamname",
  args: [{ name: "team_name", description: "team_name", required: false }],
  execute,
};
