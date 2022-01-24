const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, sendMessage } = require("../../../utils/utils");

const TeamsCollection = require("../../../utils/schemas/matchmakerTeamsSchema");

const TeamsScoreCollection = require("../../../utils/schemas/matchmakerTeamsScoreSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg] = message.content.split(" ");

  const channelId = message.channel.id;

  const userId = message.author.id;

  switch (secondArg) {
    case "me": {
      const team = TeamsCollection.findOne({
        channelId,
        $or: [{ captain: userId }, { memberIds: { $elemMatch: userId } }],
      });

      const teamScore = TeamsScoreCollection.findOne({ channelId, teamId: team._id });

      if (teamScore == null) {
        wrongEmbed.setTitle(":x: You haven't played any games yet!");

        sendMessage(message, wrongEmbed);
        return;
      }

      const scoreDirectory = teamScore.channels[teamScore.channels.map((e) => e.channelId).indexOf(channelId)];

      if (scoreDirectory == null) {
        wrongEmbed.setTitle(":x: You haven't played any games yet!");

        sendMessage(message, wrongEmbed);
        return;
      }

      correctEmbed.addField("Wins:", scoreDirectory.wins);

      correctEmbed.addField("Losses:", scoreDirectory.losses);

      correctEmbed.addField(
        "Winrate:",
        Number.isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100))
          ? "0%"
          : `${Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)}%`
      );

      correctEmbed.addField("MMR:", scoreDirectory.mmr);

      sendMessage(message, correctEmbed);
      return;
    }
    case "channel": {
      let skipCount = thirdArg;

      if (Number.isNaN(Number(thirdArg)) || thirdArg == null || thirdArg < 1) {
        skipCount = 1;
      }

      const storedTeamsList = await TeamsScoreCollection.find({
        channelId,
      })
        .skip(10 * (skipCount - 1))
        .limit(10);

      if (storedTeamsList.length === 0) {
        wrongEmbed.setTitle(`:x: No games have been played in ${skipCount !== 1 ? "this page" : "here"}!`);

        sendMessage(message, wrongEmbed);
        return;
      }

      const storedTeamsCount = await TeamsScoreCollection.count({});

      storedTeamsList.sort((a, b) => b.mmr - a.mmr);

      storedTeamsList.forEach((team) => {
        const winrate = team.losses === 0 ? 100 : Math.floor((team.wins / (team.wins + team.losses)) * 100);

        correctEmbed.addField(
          team.name,
          `Wins: ${team.wins} | Losses: ${team.losses} | Winrate: ${winrate}% | MMR: ${team.mmr}`
        );
        correctEmbed.setFooter(`Showing page ${skipCount}/${Math.ceil(storedTeamsCount / 10)}`);
      });

      sendMessage(message, correctEmbed);

      return;
    }
    default: {
      wrongEmbed.setTitle("Invalid Parameters");

      sendMessage(message, wrongEmbed);
    }
  }
};

module.exports = {
  name: "score",
  description:
    "Checks your current score. Usage: !score channel to check score in the channel youre in, or !score me to check your current score",
  execute,
};
