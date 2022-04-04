const Discord = require("discord.js");

const client = require("../../../utils/createClientInstance.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { redisInstance } = require("../../../utils/createRedisInstance");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  EMBED_COLOR_WARNING,
  sendReply,
  getContent,
  sendFollowUp,
} = require("../../../utils/utils");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const pingedUser = getContent(interaction)[0];

  if (!pingedUser) {
    wrongEmbed.setTitle(":x: Please mention the user");

    await sendReply(interaction, wrongEmbed);
    return;
  }

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

  if (invites[fetchedTeam.name].includes(pingedUser)) {
    wrongEmbed.setTitle(`:x: <@${pingedUser}> was already invited`);

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const userTeam = await MatchmakerTeamsCollection.findOne({
    guildId: interaction.guild.id,
    $or: [
      {
        captain: pingedUser,
        memberIds: { $in: pingedUser },
      },
    ],
  });

  if (userTeam != null) {
    wrongEmbed.setTitle(":x: User already belongs to a team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  invites[fetchedTeam.name].push(pingedUser);

  await redisInstance.setObject("invites", invites);

  correctEmbed.setTitle(`:white_check_mark: Invited <@${pingedUser}> to ${fetchedTeam.name}!`);

  await sendReply(interaction, correctEmbed);

  try {
    const pmEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

    const fetchedUser = await client.users.fetch(pingedUser);

    pmEmbed.setTitle(
      `You have been invited to join ${fetchedTeam.name}. Please do !jointeam ${fetchedTeam.name} in the server to join the team`
    );

    await fetchedUser.send(pmEmbed);
  } catch (error) {
    const errorEmbed = new Discord.MessageEmbed()
      .setColor(EMBED_COLOR_WARNING)
      .setTitle(`:x: Couldn't sent message to <@${pingedUser}>, please check if your DM'S aren't set to friends only.`);

    sendFollowUp(interaction, errorEmbed);
  }
};

module.exports = {
  name: "invite",
  description: "Invites an user, usage: /invite @dany",
  args: [{ name: "user", description: "user", required: true, type: "mention" }],
  execute,
};
