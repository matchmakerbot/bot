const Discord = require("discord.js");

const {
  EMBED_COLOR_CHECK,
  messageArgs,
  fetchTeamByGuildIdAndName,
  EMBED_COLOR_ERROR,
  fetchTeamByGuildAndUserId,
} = require("../utils");

const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg] = message.content.split(" ");

  if (messageArgs(message) == null) {
    wrongEmbed.setTitle(":x: Please specify the team.");

    sendMessage(message, wrongEmbed);
    return;
  }

  const fetchedTeam =
    secondArg == null
      ? await fetchTeamByGuildAndUserId(message.guild.id, message.author.id)
      : await fetchTeamByGuildIdAndName(message.guild.id, messageArgs(message));

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(":x: This team doesn't exist");

    sendMessage(message, wrongEmbed);
    return;
  }

  correctEmbed.setTitle(fetchedTeam.name);

  correctEmbed.addField(
    "Members:",
    `<@${fetchedTeam.captain}> (Captain), ${fetchedTeam.members.reduce((acc, curr) => `${acc}<@${curr}>, `, "")}`
  );

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "whois",
  description: "Check for team members, usage: !whois Maniacs, or !whois to check your team",
  execute,
};
