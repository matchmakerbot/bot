const Discord = require("discord.js");

const {
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  finishedGames,
  joinTeam1And2,
  getQueueArray,
  fetchGamesTeams,
} = require("../utils");

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

    return message.channel.send(wrongEmbed);
  }

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
      const fetchGamesByChannelId = await OngoingGamesTeamsCollection.find({
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

      return message.channel.send(correctEmbed);
    }

    case "team": {
      const teamName = message.content.split(" ").splice(0, 2).join(" ");
      const findUserInGame = (await fetchGamesTeams(queueSize))
        .map((e) => joinTeam1And2(e))
        .flat()
        .map((e) => e.name)
        .includes(teamName);
      if (findUserInGame) {
        wrongEmbed.setTitle(":x: User is in the middle of a game!");

        return message.channel.send(wrongEmbed);
      }

      if (message.content.split(" ").length !== 3) {
        wrongEmbed.setTitle(":x: Invalid Parameters!");

        return message.channel.send(wrongEmbed);
      }

      const player = await TeamsCollection.findOne({
        name: teamName,
        guildId: message.guild.id,
      });

      if (player.length === 0) {
        wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!");

        return message.channel.send(wrongEmbed);
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
  description:
    "Resets the score of an individual team (!reset team teamName) or the whole channel where this command is inserted (!reset channel)",
  execute,
};
