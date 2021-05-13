const Discord = require("discord.js");

const client = require("../../../utils/createClientInstance.js");

const { EMBED_COLOR_WARNING, channelQueues, deletableChannels, fetchGames } = require("../utils");

const OngoingGamesCollection = require("../../../utils/schemas/ongoingGamesSchema.js");

const MAX_USER_IDLE_TIME_MS = 45 * 60 * 1000;

const MAX_GAME_LENGTH_MS = 3 * 60 * 60 * 1000;

const UPDATE_INTERVAL_MS = 60 * 1000;
// test timeouts for ending games and kicking people
const warnNonDeletableChannel = async (channel, gameID, errorId) => {
  const notifyChannel = await client.channels.fetch(channel).catch(() => {
    return console.log("Cannot find notifyChannel");
  });
  const embedRemove = new Discord.MessageEmbed()
    .setColor(EMBED_COLOR_WARNING)
    .setTitle(
      `Unable to delete voice channel ${gameID}: ${
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
  let promises = [];
  const currentTimeMS = Date.now();
  for (const channelUsers of Object.values(Object.values(channelQueues)).filter((channel) => channel.length < 6)) {
    for (const user of channelUsers.filter((user1) => currentTimeMS - user1.date > MAX_USER_IDLE_TIME_MS)) {
      const channel = Object.keys(channelQueues).find((key) => channelQueues[key] === channelUsers);
      const notifyChannel = client.channels
        .fetch(channel)
        .then((e) => {
          const embedRemove = new Discord.MessageEmbed()
            .setColor(EMBED_COLOR_WARNING)
            .setTitle("You were removed from the queue after no game has been made in 45 minutes!");

          e.send(`<@${user.id}>`, embedRemove);
        })
        .catch(() => {
          delete channelQueues[channel];
        });
      promises.push(notifyChannel);
    }
  }
  await Promise.all(promises);

  promises = [];
};

const updateOngoingGames = async () => {
  let promises = [];
  const ongoingGames = await fetchGames();
  if (ongoingGames.length === 0) {
    return;
  }

  const currentTimeMS = Date.now();

  for (const game of ongoingGames.filter((game1) => currentTimeMS - game1.time > MAX_GAME_LENGTH_MS)) {
    const channelNotif = client.channels
      .fetch(game.channelID)
      .then(async (e) => {
        for (const channel of game.voiceChannelIds) {
          deletableChannels.push({
            channelName: channel.name,
            id: channel.id,
            channel: channel.channel,
          });
        }
        // remove those 3v3 and replace with the actual size
        const embedRemove = new Discord.MessageEmbed()
          .setColor(EMBED_COLOR_WARNING)
          .setTitle(`:white_check_mark: Game ${game.gameID} Cancelled due to not being finished in 3 Hours!`);

        await e.send(embedRemove).catch(() => {
          console.log("Unable to send message 1");
        });
        await OngoingGamesCollection.deleteOne({
          queueSize: game.queueSize,
          gameID: game.gameID,
        });
        return null;
      })
      .catch(async () => {
        await OngoingGamesCollection.deleteOne({
          queueSize: game.queueSize,
          gameID: game.gameID,
        });
      });
    promises.push(channelNotif);
  }
  await Promise.all(promises);

  promises = [];
};

const updateVoiceChannels = async () => {
  let promises = [];
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

  promises = [];
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
