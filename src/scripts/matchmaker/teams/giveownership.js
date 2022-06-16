const Discord = require("discord.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const OngoingGamesMatchmakerTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getQueueArray, sendReply } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const execute = async (interaction, queueSize) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: interaction.member.id,
    guildId: interaction.guild.id,
  });

  if (!fetchedTeam) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const pingedUser = interaction.options.getUser("user");

  if (!pingedUser) {
    wrongEmbed.setTitle(":x: Please tag the user");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const channelQueues = await redisInstance.getObject("channelQueues");

  const queueArray = getQueueArray(channelQueues, queueSize, interaction.channel.id, interaction.guild.id);

  if (queueArray[0]?.name === fetchedTeam.name) {
    wrongEmbed.setTitle(":x: Please leave the queue first!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const ongoingGames = await OngoingGamesMatchmakerTeamsCollection.findOne({
    guildId: interaction.guild.id,
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

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (!fetchedTeam.memberIds.includes(pingedUser.id)) {
    wrongEmbed.setTitle(":x: User does not belong to your team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  fetchedTeam.memberIds.push(interaction.member.id);

  fetchedTeam.memberIds.splice(fetchedTeam.memberIds.indexOf(pingedUser.id), 1);

  correctEmbed.setTitle(`:white_check_mark: Given ownership to ${pingedUser.username}`);

  await MatchmakerTeamsCollection.updateOne(
    {
      guildId: interaction.guild.id,
      name: fetchedTeam.name,
    },
    {
      captain: pingedUser.id,
      memberIds: fetchedTeam.memberIds,
    }
  );

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "giveownership",
  description: "Gives team ownership to a specific user. Usage: /giveownership @dany",
  args: [{ name: "user", description: "User", required: true, type: "mention" }],
  execute,
};
