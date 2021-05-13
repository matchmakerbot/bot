const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, fetchFromID } = require("../utils");

const SixmanCollection = require("../../../utils/schemas/matchmakerUsersSchema");

const execute = async (message) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [, secondArg, thirdArg, fourthArg] = message.content.split(" ");

  const channelID = message.channel.id;

  const userId = message.author.id;
  switch (secondArg) {
    case "me": {
      const user = await SixmanCollection.findOne({
        id: userId,
        servers: {
          $elemMatch: {
            channelID,
          },
        },
      });

      if (user == null) {
        wrongEmbed.setTitle(":x: You haven't played any games yet!");

        message.channel.send(wrongEmbed);
        return;
      }

      const scoreDirectory = user.servers[user.servers.map((e) => e.channelID).indexOf(channelID)];

      correctEmbed.addField("Wins:", scoreDirectory.wins);

      correctEmbed.addField("Losses:", scoreDirectory.losses);

      correctEmbed.addField(
        "Winrate:",
        Number.isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100))
          ? "0%"
          : `${Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)}%`
      );

      correctEmbed.addField("MMR:", scoreDirectory.mmr);

      message.channel.send(correctEmbed);
      return;
    }
    case "channel": {
      const getScore = async (id, arg) => {
        const storedUsers = await SixmanCollection.find({
          servers: {
            $elemMatch: {
              channelID: id,
            },
          },
        });
        const storedUsersList = storedUsers.filter(
          (a) =>
            a.servers.map((e) => e.channelID).indexOf(id) !== -1 &&
            a.servers[a.servers.map((e) => e.channelID).indexOf(id)].wins +
              a.servers[a.servers.map((e) => e.channelID).indexOf(id)].losses !==
              0
        );

        if (
          !message.guild.channels.cache
            .array()
            .map((e) => e.id)
            .includes(id)
        ) {
          wrongEmbed.setTitle(":x: This channel does not belong to this server!");

          message.channel.send(wrongEmbed);
          return;
        }

        if (storedUsersList.length === 0) {
          wrongEmbed.setTitle(":x: No games have been played in here!");

          message.channel.send(wrongEmbed);
          return;
        }

        storedUsersList.sort((a, b) => {
          const indexA = a.servers.map((e) => e.channelID).indexOf(id);

          const indexB = b.servers.map((e) => e.channelID).indexOf(id);

          return b.servers[indexB].mmr - a.servers[indexA].mmr;
        });

        if (!Number.isNaN(arg) && arg > 0) {
          let indexes = 10 * (arg - 1);
          for (indexes; indexes < 10 * arg; indexes++) {
            if (storedUsersList[indexes] == null) {
              correctEmbed.addField("No more members to list in this page!", "Encourage your friends to play!");

              break;
            }
            for (const servers of storedUsersList[indexes].servers) {
              if (servers.channelID === id) {
                correctEmbed.addField(
                  // eslint-disable-next-line no-await-in-loop
                  (await fetchFromID(storedUsersList[indexes].id, wrongEmbed, message)).username,
                  `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${
                    Number.isNaN(Math.floor((servers.wins / (servers.wins + servers.losses)) * 100))
                      ? "0"
                      : Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)
                  }% | MMR: ${servers.mmr}`
                );

                correctEmbed.setFooter(`Showing page ${arg}/${Math.ceil(storedUsersList.length / 10)}`);
              }
            }
          }
        } else {
          for (let i = 0; i < 10; i++) {
            if (storedUsersList[i] == null) {
              correctEmbed.addField("No more members to list in this page!", "Encourage your friends to play!");
              break;
            }
            for (const servers of storedUsersList[i].servers) {
              if (servers.channelID === id) {
                correctEmbed.addField(
                  // eslint-disable-next-line no-await-in-loop
                  (await fetchFromID(storedUsersList[i].id, wrongEmbed, message)).username,
                  `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${
                    Number.isNaN(Math.floor((servers.wins / (servers.wins + servers.losses)) * 100))
                      ? "0"
                      : Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)
                  }% | MMR: ${servers.mmr}`
                );

                correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(storedUsersList.length / 10)}`);
              }
            }
          }
        }
        message.channel.send(correctEmbed);
      };

      if (!Number.isNaN(thirdArg) && Number(thirdArg) > 10000) {
        getScore(thirdArg, fourthArg);
        return;
      }
      getScore(channelID, thirdArg);
      return;
    }
    default: {
      wrongEmbed.setTitle("Invalid Parameters");

      message.channel.send(wrongEmbed);
    }
  }
};

module.exports = {
  name: "score",
  description: "6man bot",
  execute,
};
