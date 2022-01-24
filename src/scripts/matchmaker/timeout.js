// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable promise/no-nesting */
const Discord = require("discord.js");

const client = require("../../utils/createClientInstance.js");

const { EMBED_COLOR_WARNING, channelQueues, deletableChannels } = require("../../utils/utils");

const OngoingGamesSolosCollection = require("../../utils/schemas/ongoingGamesSolosSchema.js");

const OngoingGamesTeamsCollection = require("../../utils/schemas/ongoingGamesTeamsSchema.js");

const MAX_USER_IDLE_TIME_MS = 45 * 60 * 1000;

const MAX_GAME_LENGTH_MS = 3 * 60 * 60 * 1000;

const UPDATE_INTERVAL_MS = 60 * 1000;

const warnNonDeletableChannel = async (channel, gameId, errorId) => {
  const notifyChannel = await client.channels.fetch(channel).catch(() => {
    return console.error("Cannot find notifyChannel");
  });
  const embedRemove = new Discord.MessageEmbed()
    .setColor(EMBED_COLOR_WARNING)
    .setTitle(
      `Unable to delete voice channel ${gameId}: ${
        errorId === 1
          ? "Channel not found"
          : "Maybe the bot doesn't have permissions to do so? Please delete channel manually."
      }`
    );
  await notifyChannel.send(embedRemove).catch(() => {
    console.error("Cannot send unable to delete channel message");
  });
};

const updateUsers = async () => {
  const promises = [];
  const currentTimeMS = Date.now();

  const filteredChannels = channelQueues.filter((queue) => queue.players.length < queue.queueSize);

  filteredChannels.forEach((filteredChannel) => {
    const filteredUsers = filteredChannel.players.filter((user) => currentTimeMS - user.date > MAX_USER_IDLE_TIME_MS);

    filteredUsers.forEach((filteredUser) => {
      const channel = filteredChannel.channelId;

      const notifyChannel = client.channels
        .fetch(channel)
        .then((e) => {
          const embedRemove = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("You were removed from the queue after no game has been made in 45 minutes!");

          e.send(`<@${filteredUser.captain != null ? filteredUser.captain : filteredUser.userId}>`, embedRemove);
          filteredChannel.players.splice(filteredChannel.players.indexOf(filteredUser), 1);
        })
        .catch(() => {
          channelQueues.splice(channelQueues.indexOf(filteredChannel.channelId), 1);
        });
      promises.push(notifyChannel);
    });
  });
  await Promise.all(promises);
};

const updateOngoingGames = async () => {
  const promises = [];

  const currentTimeMS = Date.now();

  const ongoingGamesSolos = await OngoingGamesSolosCollection.find({
    date: { $gt: -MAX_GAME_LENGTH_MS + currentTimeMS },
  });

  const ongoingGamesTeams = await OngoingGamesTeamsCollection.find({
    date: { $gt: -MAX_GAME_LENGTH_MS + currentTimeMS },
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
    const channelNotif = client.channels.fetch(game.channelId).then(async (e) => {
      game.channelIds.forEach((channel) => {
        deletableChannels.push(channel);
      });

      const embedRemove = new Discord.MessageEmbed()
        .setColor(EMBED_COLOR_WARNING)
        .setTitle(`:white_check_mark: Game ${game.gameId} Cancelled due to not being finished in 3 Hours!`);

      await e.send(embedRemove).catch(() => {
        console.error("Unable to send message 1");
      });
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
  deletableChannels.forEach((deletableChannel) => {
    const channel = client.channels
      .fetch(deletableChannel.channelId)
      .then(async (e) => {
        if (e.type === "text" || e.members?.array()?.length === 0) {
          deleteVC.push(deletableChannel);
          await e.delete().catch(async () => {
            warnNonDeletableChannel(deletableChannel.channel, deletableChannel.channelName, 0);
          });
        }
      })
      .catch(() => {
        deleteVC.push(deletableChannel);
        warnNonDeletableChannel(deletableChannel.channel, deletableChannel.channelName, 1);
      });
    promises.push(channel);
  });
  await Promise.all(promises);

  deleteVC.forEach((item) => {
    deletableChannels.splice(deletableChannels.indexOf(item), 1);
  });
};

const evaluateUpdates = async () => {
  if (Object.entries(channelQueues).length !== 0) {
    await updateUsers();
  }
  await updateOngoingGames();

  await updateChannels();
};
const startIntervalMatchmakerBot = () => {
  setInterval(evaluateUpdates, UPDATE_INTERVAL_MS);
};

module.exports = { startIntervalMatchmakerBot };
