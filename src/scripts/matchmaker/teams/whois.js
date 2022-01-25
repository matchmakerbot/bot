const Discord = require("discord.js");

const MatchmakerTeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const { EMBED_COLOR_CHECK, messageArgs, EMBED_COLOR_ERROR, sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg] = message.content.split(" ");

  const teamName = messageArgs(message);

  const fetchedTeam =
    secondArg != null
      ? await MatchmakerTeamsCollection.findOne({ guildId: message.guild.id, name: teamName })
      : await MatchmakerTeamsCollection.findOne({
          guildId: message.guild.id,
          $or: [{ captain: message.author.id }, { memberIds: { $in: message.author.id } }],
        });

  if (fetchedTeam == null) {
    wrongEmbed.setTitle(`:x: ${secondArg == null ? "You do not belong to a team!" : "This team doesn't exist!"}`);

    sendMessage(message, wrongEmbed);
    return;
  }

  correctEmbed.setTitle(fetchedTeam.name);

  correctEmbed.addField(
    "Members:",
    `<@${fetchedTeam.captain}> (Captain), ${fetchedTeam.memberIds.reduce((acc, curr) => `${acc}<@${curr}>, `, "")}`
  );

  sendMessage(message, correctEmbed);
};

module.exports = {
  name: "whois",
  description: "Check for team members, usage: !whois Maniacs, or !whois to check your team",
  execute,
};
