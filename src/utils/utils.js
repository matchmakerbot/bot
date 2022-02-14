// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable promise/no-nesting */
const client = require("./createClientInstance.js");

const sendMessage = async (message, messageType) => {
  await message.channel.send(messageType).catch(async () => {
    const user = await client.users.fetch(message.author.id).catch(() => {});
    await user.send("Unable to send messages in channel, bot likely does not have permissions").catch(() => {});
  });
};

const EMBED_COLOR_ERROR = "#F8534F";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#B78727";

const gameCount = {
  value: 0,
};

const fetchFromId = async (id, wrongEmbedParam, messageParam) => {
  const user = await client.users.fetch(id).catch(() => {
    wrongEmbedParam.setTitle("Please tag the user");
    messageParam.channel.send(wrongEmbedParam);
  });
  return user;
};

const messageEndswith = (message) => {
  const split = message.content.split(" ");
  return split[split.length - 1];
};

const getQueueArray = (channelQueues, queueSize, channelId, guildId) => {
  const channelQueue = channelQueues.find((e) => e.channelId === channelId);

  if (channelQueue != null) {
    return channelQueue.players;
  }

  channelQueues.push({
    channelId,
    guildId,
    queueSize,
    players: [],
  });

  return channelQueues[channelQueues.length - 1].players;
};

const balanceTeamsByMmr = (players, queueSize) => {
  const playersArr = players;
  for (let i = 0; i < playersArr.length; i++) {
    if (!playersArr[i].mmr) {
      playersArr[i].mmr = 1000;
    }
  }
  const pointers = [];
  const recordpointers = [];
  let record = Infinity;
  const nextPossible = (index) => {
    if (index >= queueSize) {
      return false;
    }
    if (pointers[index]) {
      pointers[index] = false;
      return nextPossible(index + 1);
    }
    pointers[index] = true;
    if (pointers.filter((e) => e === true).length !== queueSize / 2) {
      return nextPossible(0);
    }
    return true;
  };

  for (let i = 0; i < queueSize; i++) {
    pointers[i] = false;
  }
  while (nextPossible(0)) {
    let mmrA = 0;
    let mmrB = 0;
    for (let i = 0; i < queueSize; i++) {
      if (pointers[i]) {
        mmrA += playersArr[i].mmr;
      } else {
        mmrB += playersArr[i].mmr;
      }
    }
    const diff = Math.abs(mmrA - mmrB);
    if (record > diff) {
      record = diff;
      recordpointers.splice(0, recordpointers.length);
      recordpointers.push(...pointers);
    }
  }

  const playersArrA = [];
  const playersArrB = [];
  for (let i = 0; i < queueSize; i++) {
    if (recordpointers[i]) {
      playersArrA.push(playersArr[i]);
    } else {
      playersArrB.push(playersArr[i]);
    }
  }
  return { team1: playersArrA, team2: playersArrB };
};

const messageArgs = (message) => {
  return message.content.split(" ").slice(1).join(" ");
};

const shuffle = (array) => {
  const arrayToShuffle = array;
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);

    currentIndex--;

    temporaryValue = array[currentIndex];

    arrayToShuffle[currentIndex] = array[randomIndex];

    arrayToShuffle[randomIndex] = temporaryValue;
  }

  return arrayToShuffle;
};

module.exports = {
  fetchFromId,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  getQueueArray,
  messageEndswith,
  EMBED_COLOR_WARNING,
  gameCount,
  messageArgs,
  shuffle,
  balanceTeamsByMmr,
  sendMessage,
};
