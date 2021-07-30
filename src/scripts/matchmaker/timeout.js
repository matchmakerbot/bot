const Discord = require("discord.js");

const client = require("../../utils/createClientInstance.js");

const { EMBED_COLOR_WARNING, channelQueues, deletableChannels, fetchGamesSolos, fetchGamesTeams } = require("./utils");

const OngoingGamesSolosCollection = require("../../utils/schemas/ongoingGamesSolosSchema.js");

const OngoingGamesTeamsCollection = require("../../utils/schemas/ongoingGamesTeamsSchema.js");

const MAX_USER_IDLE_TIME_MS = 45 * 60 * 1000;

const MAX_GAME_LENGTH_MS = 3 * 60 * 60 * 1000;

const UPDATE_INTERVAL_MS = 60 * 1000;

const warnNonDeletableChannel = async (channel, gameId, errorId) => {
  const notifyChannel = await client.channels.fetch(channel).catch(() => {
    return console.log("Cannot find notifyChannel");
  });
  const embedRemove = new Discord.MessageEmbed()
    .setColor(EMBED_COLOR_WARNING)
    .setTitle(
      `Unable to delete voice channel ${gameId}: ${
        errorId === 1
          ? "Channel not found"
          : "Maybe the bot doesn't have permissions to do so? Please delete vc manually."
      }`
    );
  await notifyChannel.send(embedRemove).catch(() => {
    console.log("Cannot send unable to delete voice channel message");
  });
};

const updateUsers = async () => {
  const promises = [];
  const currentTimeMS = Date.now();

  for (const channelUsers of channelQueues.filter((queue) => queue.players.length < queue.queueSize)) {
    for (const userOrTeam of channelUsers.players.filter(
      (user1) => currentTimeMS - user1.date > MAX_USER_IDLE_TIME_MS
    )) {
      const channel = channelUsers.channelId;

      const notifyChannel = client.channels
        .fetch(channel)
        .then((e) => {
          const embedRemove = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("You were removed from the queue after no game has been made in 45 minutes!");

          e.send(`<@${userOrTeam.captain != null ? userOrTeam.captain : userOrTeam.id}>`, embedRemove);
          channelUsers.players.splice(channelUsers.players.indexOf(userOrTeam), 1);
        })
        .catch(() => {
          delete channelQueues[channel];
        });
      promises.push(notifyChannel);
    }
  }
  await Promise.all(promises);
};

const updateOngoingGames = async () => {
  const promises = [];
  // future: only fetch games that happenned more than 3 hours ago
  const ongoingGamesSolos = await fetchGamesSolos();
  const ongoingGamesTeams = await fetchGamesTeams();
  if (ongoingGamesSolos.length === 0 && ongoingGamesTeams.length === 0) {
    return;
  }

  const currentTimeMS = Date.now();

  for (const game of [
    ongoingGamesSolos.filter((game1) => currentTimeMS - game1.date > MAX_GAME_LENGTH_MS),
    ongoingGamesTeams.filter((game1) => currentTimeMS - game1.date > MAX_GAME_LENGTH_MS),
  ].flat()) {
    const channelNotif = client.channels
      .fetch(game.channelId)
      .then(async (e) => {
        game.voiceChannelIds.forEach((channel) => {
          deletableChannels.push(channel);
        });

        const embedRemove = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .setTitle(`:white_check_mark: Game ${game.gameId} Cancelled due to not being finished in 3 Hours!`);

        await e.send(embedRemove).catch(() => {
          console.log("Unable to send message 1");
        });
        if (game.queueType === "solos") {
          await OngoingGamesSolosCollection.deleteOne({
            gameId: game.gameId,
          });
        } else {
          await OngoingGamesTeamsCollection.deleteOne({
            gameId: game.gameId,
          });
        }
        return null;
      })
      .catch(async () => {
        if (game.queueType === "solos") {
          await OngoingGamesSolosCollection.deleteOne({
            gameId: game.gameId,
          });
        } else {
          await OngoingGamesTeamsCollection.deleteOne({
            gameId: game.gameId,
          });
        }
        return null;
      });
    promises.push(channelNotif);
  }
  await Promise.all(promises);
};

const updateVoiceChannels = async () => {
  const promises = [];
  const deleteVC = [];
  for (const deletableChannel of deletableChannels) {
    const voiceChannel = client.channels
      .fetch(deletableChannel.id)
      .then(async (e) => {
        if (e.members.array().length === 0) {
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
    promises.push(voiceChannel);
  }
  await Promise.all(promises);

  for (const item of deleteVC) {
    deletableChannels.splice(deletableChannels.indexOf(item), 1);
  }
};

const evaluateUpdates = async () => {
  if (Object.entries(channelQueues).length !== 0) {
    await updateUsers();
  }
  await updateOngoingGames();

  await updateVoiceChannels();
};
const startIntervalMatchmakerBot = () => {
  setInterval(evaluateUpdates, UPDATE_INTERVAL_MS);
};

module.exports = { startIntervalMatchmakerBot };
