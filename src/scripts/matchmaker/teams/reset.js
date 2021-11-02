const Discord = require("discord.js");

const { EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, finishedGames, getQueueArray, fetchGamesTeams } = require("../utils");

const { sendMessage } = require("../../../utils/utils");

const OngoingGamesTeamsCollection = require("../../../utils/schemas/ongoingGamesTeamsSchema");

const TeamsCollection = require("../../../utils/schemas/teamsSchema");

const execute = async (message, queueSize) => {
  const channelId = message.channel.id;

  const [, secondArg] = message.content.split(" ");

  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const queueArray = getQueueArray(queueSize, message.channel.id, message.guild.id, "teams");

  if (queueArray.length === queueSize) {
    wrongEmbed.setTitle(":x: You can't reset the channel now!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (message.content.split(" ").length === 1) {
    wrongEmbed.setTitle(":x: Invalid Parameters!");

    sendMessage(message, wrongEmbed);
    return;
  }

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    sendMessage(message, wrongEmbed);
    return;
  }

  switch (secondArg) {
    case "channel": {
      const fetchGamesByChannelId = await OngoingGamesTeamsCollection.find({
        channelId,
      });

      if (fetchGamesByChannelId.length !== 0) {
        wrongEmbed.setTitle(":x: There are users in game!");

        sendMessage(message, wrongEmbed);
        return;
      }

      if (message.content.split(" ").length !== 2) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        sendMessage(message, wrongEmbed);
        return;
      }
      const promises = [];
      await TeamsCollection.find({
        channels: {
          $elemMatch: {
            channelId,
          },
        },
      }).then(async (storedTeams) => {
        for (const team of storedTeams) {
          const channelPos = team.channels
            .map((e) => e)
            .map((e) => e.channelId)
            .indexOf(channelId);

          if (channelPos !== -1) {
            const updatePromise = TeamsCollection.update(
              {
                name: team.name,
                guildId: team.guildId,
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

      sendMessage(message, correctEmbed);
      break;
    }

    case "team": {
      let teamName = message.content.split(" ");
      teamName.splice(0, 2);
      teamName = teamName.join(" ");

      const ongoingGames = await fetchGamesTeams(null, message.guild.id);

      if (
        ongoingGames
          .map((e) => [e.team1.name, e.team2.name])
          .flat()
          .includes(teamName)
      ) {
        wrongEmbed.setTitle(":x: Team is in the middle of a game!");

        sendMessage(wrongEmbed);
        return;
      }
      if (message.content.split(" ").length !== 3) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        sendMessage(wrongEmbed);
        return;
      }

      const player = await TeamsCollection.findOne({
        name: teamName,
        guildId: message.guild.id,
      });

      if (player == null) {
        wrongEmbed.setTitle(":x: This team hasn't played any games in this channel!");

        sendMessage(wrongEmbed);
        return;
      }

      await TeamsCollection.update(
        {
          name: teamName,
          guildId: message.guild.id,
        },
        {
          $pull: {
            channels: {
              channelId,
            },
          },
        }
      );

      correctEmbed.setTitle(":white_check_mark: Team's score reset!");

      sendMessage(correctEmbed);
      break;
    }
    default: {
      wrongEmbed.setTitle(":x: Invalid Parameters!");

      sendMessage(wrongEmbed);
    }
  }
};

module.exports = {
  name: "reset",
  description:
    "Resets the score of an individual team (!reset team teamName) or the whole channel where this command is inserted (!reset channel)",
  execute,
};
