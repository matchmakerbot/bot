const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendReply, getContent } = require("../../../utils/utils");

const { redisInstance } = require("../../../utils/createRedisInstance");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const guildTeams = await MatchmakerTeamsCollection.find({ guildId: interaction.guild.id });

  const teamName = getContent(interaction)[0];

  if (
    guildTeams
      .map((e) => e.members)
      .flat()
      .includes(interaction.member.id) ||
    guildTeams.map((e) => e.captains).includes(interaction.member.id)
  ) {
    wrongEmbed.setTitle(":x: You already belong to a team!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  if (!guildTeams.map((e) => e.name).includes(teamName)) {
    wrongEmbed.setTitle(":x: This team doesn't exist");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const invites = await redisInstance.getObject("invites");

  if (!Object.keys(invites).includes(teamName)) {
    wrongEmbed.setTitle(":x: This team didn't invite anyone!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  const invitePath = invites[teamName];

  if (!invitePath.includes(interaction.member.id)) {
    wrongEmbed.setTitle(":x: This team didn't invite you!");

    await sendReply(interaction, wrongEmbed);
    return;
  }

  await MatchmakerTeamsCollection.updateOne(
    {
      guildId: interaction.guild.id,
      name: teamName,
    },
    { $push: { memberIds: interaction.member.id } }
  );

  if (invitePath.length === 1) {
    delete invites[teamName];
  } else {
    invitePath.splice(invitePath.indexOf(teamName), 1);
  }

  await redisInstance.setObject("invites", invites);

  correctEmbed.setTitle(`:white_check_mark: ${interaction.member.user.username} joined ${teamName}!`);

  await sendReply(interaction, correctEmbed);
};

module.exports = {
  name: "jointeam",
  description: "Join a team that invited you, usage: /jointeam Maniacs",
  args: [{ name: "teamname", description: "Team Name", required: true, type: "string" }],
  execute,
};
