const Discord = require("discord.js");

const {
  EMBED_COLOR_CHECK,
  messageArgs,
  fetchTeamByGuildIdAndName,
  fetchFromId,
  EMBED_COLOR_ERROR,
} = require("../utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (messageArgs(message) == null) {
    wrongEmbed.setTitle(":x: Please specify the team.");

    message.channel.send(wrongEmbed);
    return;
  }

  const fetchedTeam = await fetchTeamByGuildIdAndName(message.guild.id, messageArgs(message));

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: This team doesn't exist");

    message.channel.send(wrongEmbed);
    return;
  }

  correctEmbed.setTitle(fetchedTeam.name);

  correctEmbed.addField(
    "Members:",
    `${(await fetchFromId(fetchedTeam.captain))?.username} (Captain), ${await fetchedTeam.members.reduce(
      async (acc, curr) => `${acc}${(await fetchFromId(curr))?.username}, `,
      ""
    )}`
  );

  message.channel.send(correctEmbed);
};

module.exports = {
  name: "whois",
  description: "Check for team members, usage: !whois Maniacs",
  execute,
};
