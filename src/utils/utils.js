// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable promise/no-nesting */
const client = require("./createClientInstance.js");

const EMBED_COLOR_ERROR = "#F8534F";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#B78727";

const gameCount = {
  value: 0,
};

// shits dumb, but cant be arsed to do it the right way, because im lazy
const getContent = (interaction) => interaction.options._hoistedOptions.map((e) => e.value);

const handleMesssageError = async (memberId) => {
  await client.users
    .fetch(memberId)
    .then(async (fetchedUser) => {
      await fetchedUser
        .send("Unable to send messages in channel, bot likely does not have permissions")
        .catch(() => {});
    })
    .catch(() => {});
};

const sendReply = async (interaction, messageType) => {
  return interaction.reply(messageType.type ? { embeds: [messageType] } : messageType).catch(async () => {
    await handleMesssageError(interaction.member.id);
  });
};

const sendFollowUp = async (interaction, messageType) => {
  return interaction.followUp(messageType.type ? { embeds: [messageType] } : messageType).catch(async () => {
    await handleMesssageError(interaction.member.id);
  });
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
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  getQueueArray,
  EMBED_COLOR_WARNING,
  gameCount,
  shuffle,
  balanceTeamsByMmr,
  sendReply,
  sendFollowUp,
  getContent,
};
