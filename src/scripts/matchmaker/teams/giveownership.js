const Discord = require("discord.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const OngoingGamesMatchmakerTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray, sendMessage } = require("../../../utils/utils");

const execute = async (message, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: message.author.id,
    guildId: message.guild.id,
  });

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (message.mentions.members.first() == null) {
    wrongEmbed.setTitle(":x: Please tag the user");

    sendMessage(message, wrongEmbed);
    return;
  }

  const pingedUser = message.mentions.members.first().user.id;

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id);

  if (queueArray[0]?.name === fetchedTeam.name) {
    wrongEmbed.setTitle(":x: Please leave the queue first!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const ongoingGames = await OngoingGamesMatchmakerTeamsCollection.findOne({
    guildId: message.guild.id,
    $or: [
      {
        "team1.name": fetchedTeam.name,
      },
      {
        "team2.name": fetchedTeam.name,
      },
    ],
  });

  if (ongoingGames != null) {
    wrongEmbed.setTitle(":x: You are in the middle of a game!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!fetchedTeam.memberIds.includes(pingedUser)) {
    wrongEmbed.setTitle(":x: User does not belong to your team!");

    sendMessage(message, wrongEmbed);
    return;
  }

  fetchedTeam.memberIds.push(message.author.id);

  fetchedTeam.memberIds.splice(fetchedTeam.memberIds.indexOf(pingedUser), 1);

  correctEmbed.setTitle(`:white_check_mark: Given ownership to ${message.mentions.members.first().user.username}`);

  await MatchmakerTeamsCollection.updateOne(
    {
      guildId: message.guild.id,
      name: fetchedTeam.name,
    },
    {
      captain: pingedUser,
      memberIds: fetchedTeam.memberIds,
    }
  );

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "giveownership",
  description: "Gives team ownership to a specific user. Usage: !giveownership @dany or !giveownership",
  execute,
};
