const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, finishedGames, fetchGames, joinTeam1And2 } = require("../utils");

const OngoingGamesCollection = require("../../../utils/schemas/ongoingGamesSchema");

const SixmanCollection = require("../../../utils/schemas/matchmakerUsersSchema");

const execute = async (message, queueSize) => {
  const channelId = message.channel.id;

  const [, secondArg, thirdArg] = message.content.split(" ");

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  if (message.content.split(" ").length === 1) {
    wrongEmbed.setTitle(":x: Invalid Parameters!");

    return message.channel.send(wrongEmbed);
  }

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    return message.channel.send(wrongEmbed);
  }

  switch (secondArg) {
    case "channel": {
      const fetchGamesByChannelId = await OngoingGamesCollection.find({
        gamemode: "3v3",
        channelId,
      });

      if (fetchGamesByChannelId.length !== 0) {
        wrongEmbed.setTitle(":x: There are users in game!");

        return message.channel.send(wrongEmbed);
      }

      if (message.content.split(" ").length !== 2) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }
      let promises = [];
      await SixmanCollection.find({
        servers: {
          $elemMatch: {
            channelId,
          },
        },
      }).then(async (storedUsers) => {
        for (const user of storedUsers) {
          const channelPos = user.servers
            .map((e) => e)
            .map((e) => e.channelId)
            .indexOf(channelId);

          if (channelPos !== -1) {
            const updatePromise = SixmanCollection.update(
              {
                id: user.id,
              },
              {
                $pull: {
                  servers: {
                    channelId,
                  },
                },
              }
            );
            promises.push(updatePromise);
          }
        }
        await Promise.all(promises);
        promises = [];
      });

      for (const game of finishedGames) {
        if (game.channelId === channelId) {
          finishedGames.splice(finishedGames.indexOf(game), 1);
        }
      }
      correctEmbed.setTitle(":white_check_mark: Channel score reset!");

      return message.channel.send(correctEmbed);
    }

    case "player": {
      const findUserInGame = (await fetchGames(Number(queueSize)))
        .map((e) => joinTeam1And2(e))
        .flat()
        .map((e) => e.id)
        .includes(thirdArg);
      if (findUserInGame) {
        wrongEmbed.setTitle(":x: User is in the middle of a game!");

        return message.channel.send(wrongEmbed);
      }

      if (message.content.split(" ").length !== 3) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      const player = await SixmanCollection.findOne({
        id: thirdArg,
      });

      if (player.length === 0) {
        wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!");

        return message.channel.send(wrongEmbed);
      }

      await SixmanCollection.update(
        {
          id: thirdArg,
        },
        {
          $pull: {
            servers: {
              channelId,
            },
          },
        }
      );

      correctEmbed.setTitle(":white_check_mark: Player's score reset!");

      return message.channel.send(correctEmbed);
    }
    default: {
      wrongEmbed.setTitle(":x: Invalid Parameters!");

      return message.channel.send(wrongEmbed);
    }
  }
};

module.exports = {
  name: "reset",
  description: "6man bot",
  execute,
};
