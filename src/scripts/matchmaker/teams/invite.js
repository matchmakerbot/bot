const Discord = require("discord.js");

const client = require("../../../utils/createClientInstance.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { redisInstance } = require("../../../utils/createRedisInstance");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  EMBED_COLOR_WARNING,
  sendReply,
  sendFollowUp,
} = require("../../../utils/utils");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const pingedUser = interaction.options.getUser("user");

  const fetchedTeam = await MatchmakerTeamsCollection.findOne({
    captain: interaction.member.id,
    guildId: interaction.guild.id,
  });

  if (!fetchedTeam) {
    wrongEmbed.setTitle(":x: You are not the captain of a team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const invites = await redisInstance.getObject("invites");

  if (!Object.keys(invites).includes(fetchedTeam.name)) {
    invites[fetchedTeam.name] = [];
  }

  if (invites[fetchedTeam.name].includes(pingedUser.id)) {
    wrongEmbed.setTitle(`:x: ${pingedUser.username} was already invited`);

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const userTeam = await MatchmakerTeamsCollection.findOne({
    guildId: interaction.guild.id,
    $or: [
      {
        captain: pingedUser.id,
        memberIds: { $in: pingedUser.id },
      },
    ],
  });

  if (userTeam != null) {
    wrongEmbed.setTitle(":x: User already belongs to a team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  invites[fetchedTeam.name].push(pingedUser.id);

  await redisInstance.setObject("invites", invites);

  correctEmbed.setTitle(`:white_check_mark: Invited ${pingedUser.username} to ${fetchedTeam.name}!`);

  await sendReply(interaction, correctEmbed);

  try {
    const pmEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

    const fetchedUser = await client.users.fetch(pingedUser.id);

    pmEmbed.setTitle(
      `You have been invited to join ${fetchedTeam.name}. Please do /jointeam ${fetchedTeam.name} in the server to join the team`
    );

    await fetchedUser.send({ embeds: [pmEmbed] });
  } catch (error) {
    const errorEmbed = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_WARNING)
      .setTitle(
        `:x: Couldn't sent message to ${pingedUser.username}, please check if your DM'S aren't set to friends only.`
      );

    sendFollowUp(interaction, errorEmbed);
  }
};

module.exports = {
  name: "invite",
  description: "Invites an user, usage: /invite @dany",
  args: [{ name: "user", description: "User", required: true, type: "mention" }],
  execute,
};
