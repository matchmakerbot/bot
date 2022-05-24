// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable promise/no-nesting */
const logger = require("pino")();

const Discord = require("discord.js");

const client = require("../../utils/createClientInstance.js");

const { EMBED_COLOR_WARNING } = require("../../utils/utils");

const { redisInstance } = require("../../utils/createRedisInstance.js");

const OngoingGamesSolosCollection = require("../../utils/schemas/ongoingGamesSolosSchema.js");

const OngoingGamesTeamsCollection = require("../../utils/schemas/ongoingGamesTeamsSchema.js");

const MAX_USER_IDLE_TIME_MS = 45 * 60 * 1000;

const MAX_GAME_LENGTH_MS = 3 * 60 * 60 * 1000;

const UPDATE_INTERVAL_MS = 60 * 1000;

const warnNonDeletableChannel = async (channel, errorId) => {
  await client.channels
    .fetch(channel)
    .then(async (e) => {
      const embedRemove = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_WARNING)
        .setTitle(
          `Unable to delete channel/voiceChannel in this guild: ${
            errorId === 1
              ? "Channel not found"
              : "Maybe the bot doesn't have permissions to do so? Please delete channel manually."
          }`
        );
      await e.send({ embeds: [embedRemove] }).catch(() => {
        logger.error("Cannot send unable to delete channel message");
      });
    })
    .catch(() => {
      logger.error("Cannot find notifyChannel");
    });
};

const updateUsers = async () => {
  const promises = [];
  const currentTimeMS = Date.now();

  const channelQueues = await redisInstance.getObject("channelQueues");

  const filteredChannels = channelQueues.filter((queue) => queue.players.length < queue.queueSize);

  filteredChannels.forEach((filteredChannel) => {
    const filteredUsers = filteredChannel.players.filter(
      (user) => currentTimeMS - new Date(user.date).getTime() > MAX_USER_IDLE_TIME_MS
    );

    filteredUsers.forEach((filteredUser) => {
      const channel = filteredChannel.channelId;

      const notifyChannel = client.channels
        .fetch(channel)
        .then(async (e) => {
          const embedRemove = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("You were removed from the queue after no game has been made in 45 minutes!");

          await e.send(`<@${filteredUser.captain != null ? filteredUser.captain : filteredUser.userId}>`);
          await e.send({ embeds: [embedRemove] });
          filteredChannel.players.splice(filteredChannel.players.indexOf(filteredUser), 1);
        })
        .catch(() => {
          channelQueues.splice(channelQueues.indexOf(filteredChannel), 1);
        });
      promises.push(notifyChannel);
    });
  });
  await Promise.all(promises);

  await redisInstance.setObject("channelQueues", channelQueues);
};

const updateOngoingGames = async () => {
  const promises = [];

  const currentTimeMS = Date.now();

  const ongoingGamesSolos = await OngoingGamesSolosCollection.find({
    date: { $lt: -MAX_GAME_LENGTH_MS + currentTimeMS },
  });

  const ongoingGamesTeams = await OngoingGamesTeamsCollection.find({
    date: { $lt: -MAX_GAME_LENGTH_MS + currentTimeMS },
  });

  const games = [...ongoingGamesSolos, ...ongoingGamesTeams];

  if ([...ongoingGamesSolos, ...ongoingGamesTeams].length === 0) {
    return;
  }

  ongoingGamesSolos.forEach((e) => {
    e.queueMode = "solos";
  });
  ongoingGamesTeams.forEach((e) => {
    e.queueMode = "teams";
  });

  games.forEach((game) => {
    const channelNotif = client.channels
      .fetch(game.channelId)
      .then(async (e) => {
        const embedRemove = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .setTitle(`:white_check_mark: Game ${game.gameId} Cancelled due to not being finished in 3 Hours!`);

        await e.send({ embeds: [embedRemove] }).catch((err) => {
          logger.error(err);
        });
      })
      .catch(async () => {})
      .finally(async () => {
        const deletableChannels = await redisInstance.getObject("deletableChannels");

        const deletableChannel = { originalChannelId: game.channelId, channelIds: [...game.channelIds] };

        deletableChannels.push(deletableChannel);

        await redisInstance.setObject("deletableChannels", deletableChannels);

        if (game.queueMode === "solos") {
          await OngoingGamesSolosCollection.deleteOne({
            gameId: game.gameId,
          });
        } else {
          await OngoingGamesTeamsCollection.deleteOne({
            gameId: game.gameId,
          });
        }
      });
    promises.push(channelNotif);
  });
  await Promise.all(promises);
};

const updateChannels = async () => {
  const promises = [];
  const deleteVC = [];

  const deletableChannels = await redisInstance.getObject("deletableChannels");

  deletableChannels.forEach((deletableChannel) => {
    deletableChannel.channelIds.forEach(async (channel) => {
      const channelToDelete = client.channels
        .fetch(channel)
        .then(async (e) => {
          if (e.type === "GUILD_TEXT" || e.members?.size === 0) {
            await e
              .delete()
              .catch(async (err) => {
                logger.error(err);
                warnNonDeletableChannel(deletableChannel.originalChannelId, 0);
              })
              .finally(() => {
                deleteVC.push(channel);
              });
          }
        })
        .catch((err) => {
          logger.error(err);
          deleteVC.push(channel);
          warnNonDeletableChannel(deletableChannel.originalChannelId, 1);
        });
      promises.push(channelToDelete);
    });
  });
  await Promise.all(promises);

  [...deletableChannels].forEach((deletableChannel) => {
    if (deletableChannel.channelIds.length === 0) {
      deletableChannels.splice(deletableChannels.indexOf(deletableChannel), 1);
      return;
    }
    deleteVC.forEach((channelToDelete) => {
      const ids = deletableChannel.channelIds;
      if (ids.includes(channelToDelete)) {
        ids.splice(ids.indexOf(channelToDelete), 1);
      }
    });
  });
  await redisInstance.setObject("deletableChannels", deletableChannels);
};

const evaluateUpdates = async () => {
  await updateUsers();

  await updateOngoingGames();

  await updateChannels();
};
const startIntervalMatchmakerBot = () => {
  setInterval(evaluateUpdates, UPDATE_INTERVAL_MS);
};

module.exports = { startIntervalMatchmakerBot };
