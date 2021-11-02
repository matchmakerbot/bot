const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchFromId } = require("../utils");

const MatchmakerCollection = require("../../../utils/schemas/matchmakerUsersSchema");
const { sendMessage } = require("../../../utils/utils");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg] = message.content.split(" ");

  const channelId = message.channel.id;

  const userId = message.author.id;
  switch (secondArg) {
    case "me": {
      const user = await MatchmakerCollection.findOne({
        id: userId,
        channels: {
          $elemMatch: {
            channelId,
          },
        },
      });

      if (user == null) {
        wrongEmbed.setTitle(":x: You haven't played any games yet!");

        sendMessage(message, wrongEmbed);
        return;
      }

      const scoreDirectory = user.channels[user.channels.map((e) => e.channelId).indexOf(channelId)];

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
      let funcArg = thirdArg;
      const storedUsers = await MatchmakerCollection.find({
        channels: {
          $elemMatch: {
            channelId,
          },
        },
      });
      const storedUsersList = storedUsers.filter(
        (a) =>
          a.channels.map((e) => e.channelId).indexOf(channelId) !== -1 &&
          a.channels[a.channels.map((e) => e.channelId).indexOf(channelId)].wins +
            a.channels[a.channels.map((e) => e.channelId).indexOf(channelId)].losses !==
            0
      );

      if (
        !message.guild.channels.cache
          .array()
          .map((e) => e.id)
          .includes(channelId)
      ) {
        wrongEmbed.setTitle(":x: This channel does not belong to this server!");

        sendMessage(message, wrongEmbed);
        return;
      }

      if (storedUsersList.length === 0) {
        wrongEmbed.setTitle(":x: No games have been played in here!");

        sendMessage(message, wrongEmbed);
        return;
      }

      storedUsersList.sort((a, b) => {
        const indexA = a.channels.map((e) => e.channelId).indexOf(channelId);

        const indexB = b.channels.map((e) => e.channelId).indexOf(channelId);

        return b.channels[indexB].mmr - a.channels[indexA].mmr;
      });

      if (Number.isNaN(Number(thirdArg)) || thirdArg == null || thirdArg < 1) {
        funcArg = 1;
      }

      let indexes = 10 * (funcArg - 1);
      for (indexes; indexes < 10 * funcArg; indexes++) {
        if (storedUsersList[indexes] == null) {
          correctEmbed.addField("No more members to list in this page!", "Encourage your friends to play!");

          break;
        }
        for (const channels of storedUsersList[indexes].channels) {
          if (channels.channelId === channelId) {
            correctEmbed.addField(
              // eslint-disable-next-line no-await-in-loop
              (await fetchFromId(storedUsersList[indexes].id, wrongEmbed, message))?.username,
              `Wins: ${channels.wins} | Losses: ${channels.losses} | Winrate: ${
                Number.isNaN(Math.floor((channels.wins / (channels.wins + channels.losses)) * 100))
                  ? "0"
                  : Math.floor((channels.wins / (channels.wins + channels.losses)) * 100)
              }% | MMR: ${channels.mmr}`
            );

            correctEmbed.setFooter(`Showing page ${funcArg}/${Math.ceil(storedUsersList.length / 10)}`);
          }
        }
      }

      sendMessage(message, correctEmbed);
      break;
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
