const Discord = require("discord.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  finishedGames,
  fetchGamesSolos,
  joinTeam1And2,
  getQueueArray,
} = require("../utils");

const OngoingGamesSolosCollection = require("../../../utils/schemas/ongoingGamesSolosSchema");

const MatchmakerCollection = require("../../../utils/schemas/matchmakerUsersSchema");

const execute = async (message, queueSize) => {
  const channelId = message.channel.id;

  const [, secondArg, thirdArg] = message.content.split(" ");

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id, "solos");

  if (queueArray.length === queueSize) {
    wrongEmbed.setTitle(":x: You can't reset the channel now!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (message.content.split(" ").length === 1) {
    wrongEmbed.setTitle(":x: Invalid Parameters!");

    message.channel.send(wrongEmbed);
    return;
  }

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    message.channel.send(wrongEmbed);
    return;
  }

  switch (secondArg) {
    case "channel": {
      const fetchGamesByChannelId = await OngoingGamesSolosCollection.find({
        channelId,
      });

      if (fetchGamesByChannelId.length !== 0) {
        wrongEmbed.setTitle(":x: There are users in game!");

        message.channel.send(wrongEmbed);
        return;
      }

      if (message.content.split(" ").length !== 2) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        message.channel.send(wrongEmbed);
        return;
      }
      const promises = [];
      await MatchmakerCollection.find({
        channels: {
          $elemMatch: {
            channelId,
          },
        },
      }).then(async (storedUsers) => {
        for (const user of storedUsers) {
          const channelPos = user.channels
            .map((e) => e)
            .map((e) => e.channelId)
            .indexOf(channelId);

          if (channelPos !== -1) {
            const updatePromise = MatchmakerCollection.update(
              {
                id: user.id,
              },
              {
                $pull: {
                  channels: {
                    channelId,
                  },
                },
              }
            );
            promises.push(updatePromise);
          }
        }
        await Promise.all(promises);
      });

      for (const game of finishedGames) {
        if (game.channelId === channelId) {
          finishedGames.splice(finishedGames.indexOf(game), 1);
        }
      }
      correctEmbed.setTitle(":white_check_mark: Channel score reset!");

      message.channel.send(correctEmbed);
      return;
    }

    case "player": {
      const findUserInGame = (await fetchGamesSolos(queueSize))
        .map((e) => joinTeam1And2(e))
        .flat()
        .map((e) => e.id)
        .includes(thirdArg);
      if (findUserInGame) {
        wrongEmbed.setTitle(":x: User is in the middle of a game!");

        message.channel.send(wrongEmbed);
        return;
      }

      if (message.content.split(" ").length !== 3) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        message.channel.send(wrongEmbed);
        return;
      }

      const player = await MatchmakerCollection.findOne({
        id: thirdArg,
      });

      if (player.length === 0) {
        wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!");

        message.channel.send(wrongEmbed);
        return;
      }

      await MatchmakerCollection.update(
        {
          id: thirdArg,
        },
        {
          $pull: {
            channels: {
              channelId,
            },
          },
        }
      );

      correctEmbed.setTitle(":white_check_mark: Player's score reset!");

      message.channel.send(correctEmbed);
      break;
    }
    default: {
      wrongEmbed.setTitle(":x: Invalid Parameters!");

      message.channel.send(wrongEmbed);
    }
  }
};

module.exports = {
  name: "reset",
  description: "6man bot",
  execute,
};
