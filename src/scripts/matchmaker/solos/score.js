const Discord = require("discord.js");

const MatchmakerUsersCollection = require("../../../utils/schemas/matchmakerUsersWithScoreSchema");

const { sendMessage, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg] = message.content.split(" ");

  const channelId = message.channel.id;

  const userId = message.author.id;
  switch (secondArg) {
    case "me": {
      const user = await MatchmakerUsersCollection.findOne({
        userId,
        channelId,
      });

      if (user == null) {
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

      if (Number.isNaN(Number(thirdArg)) || thirdArg == null || thirdArg < 1) {
        skipCount = 1;
      }

      const storedUsersList = (
        await MatchmakerUsersCollection.find({
          channelId,
        })
          .skip(10 * (skipCount - 1))
          .limit(10)
      ).filter((e) => e.wins + e.losses > 0);

      if (storedUsersList.length === 0) {
        wrongEmbed.setTitle(`:x: No games have been played in ${skipCount !== 1 ? "this page" : "here"}!`);

        sendMessage(message, wrongEmbed);
        return;
      }

      const storedUsersCount = await MatchmakerUsersCollection.count({});

      storedUsersList.sort((a, b) => b.mmr - a.mmr);

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
      wrongEmbed.setTitle("Invalid argument!");

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
