const Discord = require("discord.js");

const MatchmakerUsersScoreCollection = require("../../../utils/schemas/matchmakerUsersScoreSchema");

const { sendMessage, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg, fourthArg] = message.content.split(" ");

  const channelId = message.channel.id;

  if (message.content.toLowerCase().includes("score")) {
    wrongEmbed.setTitle("This command is deprecated, please use !leaderboard channel or !leaderboard me instead!");

    sendMessage(message, wrongEmbed);
    return;
  }

  const userId = message.author.id;
  switch (secondArg) {
    case "me": {
      const user = await MatchmakerUsersScoreCollection.findOne({
        userId,
        channelId,
      });

      if (!user) {
        wrongEmbed.setTitle(":x: You haven't played any games yet!");

        sendMessage(message, wrongEmbed);
        return;
      }

      correctEmbed.addField("Wins:", user.wins);

      correctEmbed.addField("Losses:", user.losses);

      correctEmbed.addField(
        "Winrate:",
        Number.isNaN(Math.floor((user.wins / (user.wins + user.losses)) * 100))
          ? "0%"
          : `${Math.floor((user.wins / (user.wins + user.losses)) * 100)}%`
      );

      correctEmbed.addField("MMR:", user.mmr);

      sendMessage(message, correctEmbed);
      return;
    }
    case "channel": {
      let skipCount = thirdArg;

      if (Number.isNaN(Number(thirdArg)) || !thirdArg || thirdArg <= 1) {
        skipCount = 1;
      }

      if (
        fourthArg != null &&
        !message.guild.channels.cache
          .array()
          .map((e) => e.id)
          .includes(fourthArg)
      ) {
        wrongEmbed.setTitle(":x: That channel does not belong to this server!");

        sendMessage(message, wrongEmbed);
        return;
      }

      const storedUsersList = await MatchmakerUsersScoreCollection.find({
        channelId: fourthArg ?? channelId,
      })
        .sort({ mmr: -1 })
        .skip(10 * (skipCount - 1))
        .limit(10);

      if (storedUsersList.length === 0) {
        wrongEmbed.setTitle(`:x: No games have been played in ${skipCount !== 1 ? "this page" : "here"}!`);

        sendMessage(message, wrongEmbed);
        return;
      }

      const storedUsersCount = await MatchmakerUsersScoreCollection.countDocuments({
        channelId: fourthArg ?? channelId,
      });

      storedUsersList.forEach((user) => {
        const winrate = user.losses === 0 ? 100 : Math.floor((user.wins / (user.wins + user.losses)) * 100);
        correctEmbed.addField(
          user.username,
          `Wins: ${user.wins} | Losses: ${user.losses} | Winrate: ${winrate}% | MMR: ${user.mmr}`
        );
        correctEmbed.setFooter(`Showing page ${skipCount}/${Math.ceil(storedUsersCount / 10)}`);
      });

      sendMessage(message, correctEmbed);
      break;
    }
    default: {
      wrongEmbed.setTitle(
        "Invalid Parameters, please use !leaderboard <me/channel> <page>(optional) <channelId>(optional)"
      );

      sendMessage(message, wrongEmbed);
    }
  }
};

module.exports = {
  name: ["leaderboard", "score"],
  description:
    "Checks your current score. Usage: !leaderboard channel <page> (default is 1) to check score in the channel youre in, !leaderboard channel <page> <channelid> to check the score of another channel, or !leaderboard me to check your current score",
  execute,
};
