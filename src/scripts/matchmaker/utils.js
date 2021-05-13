const client = require("../../utils/createClientInstance.js");

const OngoingGamesCollection = require("../../utils/schemas/ongoingGamesSchema.js");

const SixmanCollection = require("../../utils/schemas/matchmakerUsersSchema");

const EMBED_COLOR_ERROR = "#F8534F";

const TEAM1 = "team1";

const TEAM2 = "team2";

const WINS = "wins";

const LOSSES = "losses";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#77B255";

const finishedGames = [];

const deletableChannels = [];

const channelQueues = {};

const cancelQueue = {};

const joinTeam1And2 = (object) => {
  return object.team1.concat(object.team2);
};

const fetchFromID = async (id, wrongEmbedParam, messageParam) => {
  const user = await client.users.fetch(id).catch((error) => {
    wrongEmbedParam.setTitle("Please tag the user");
    console.log(error);
    messageParam.channel.send(wrongEmbedParam);
  });
  return user;
};

const fetchGames = async (queueSize) => {
  const games = await OngoingGamesCollection.find({
    queueSize,
  });
  return games;
};

const messageEndswith = (message) => {
  const split = message.content.split(" ");
  return split[split.length - 1];
};

const getQueueArray = (queueSize, channelId) => {
  if (!Object.keys(channelQueues).includes(queueSize)) {
    channelQueues[queueSize] = {};
  }
  if (!Object.keys(channelQueues[queueSize]).includes(channelId)) {
    channelQueues[queueSize][channelId] = [];
  }

  return channelQueues[queueSize][channelId];
};

const assignWinLoseDb = async (user, game, score) => {
  const storedUserDb = await SixmanCollection.findOne({
    id: user.id,
  });

  const channelPos = storedUserDb.servers.map((e) => e.channelID).indexOf(game.channelID);

  const sort = `servers.${channelPos}.${score}`;

  const mmr = `servers.${channelPos}.mmr`;

  await SixmanCollection.update(
    {
      id: user.id,
    },
    {
      $set: {
        [sort]: storedUserDb.servers[channelPos][score] + 1,
        [mmr]: score === WINS ? storedUserDb.servers[channelPos].mmr + 13 : storedUserDb.servers[channelPos].mmr - 10,
      },
    }
  );
};

const revertGame = async (user, game, param, team) => {
  console.log(user);
  const storedUserDb = await SixmanCollection.findOne({
    id: user.id,
  });
  console.log(storedUserDb);
  const channelPos = storedUserDb.servers.map((e) => e.channelID).indexOf(game.channelID);

  const win = `servers.${channelPos}.wins`;

  const lose = `servers.${channelPos}.losses`;

  const winsOrLosses =
    (game.winningTeam === 1 && team === TEAM1) || (game.winningTeam === 2 && team === TEAM2) ? "wins" : "losses";

  const sort = `servers.${channelPos}.${winsOrLosses}`;

  const mmr = `servers.${channelPos}.mmr`;

  switch (param) {
    case "revert": {
      await SixmanCollection.update(
        {
          id: user.id,
        },
        {
          $set: {
            [win]:
              winsOrLosses === "wins"
                ? storedUserDb.servers[channelPos][winsOrLosses] + 1
                : storedUserDb.servers[channelPos][winsOrLosses] - 1,

            [lose]:
              winsOrLosses === "losses"
                ? storedUserDb.servers[channelPos][winsOrLosses] + 1
                : storedUserDb.servers[channelPos][winsOrLosses] - 1,

            [mmr]:
              winsOrLosses === "wins"
                ? storedUserDb.servers[channelPos].mmr + 23
                : storedUserDb.servers[channelPos].mmr - 23,
          },
        }
      );
      break;
    }
    case "cancel": {
      await SixmanCollection.update(
        {
          id: user.id,
        },
        {
          $set: {
            [sort]: storedUserDb.servers[channelPos][winsOrLosses] - 1,

            [mmr]:
              winsOrLosses === "wins"
                ? storedUserDb.servers[channelPos].mmr - 13
                : storedUserDb.servers[channelPos].mmr + 10,
          },
        }
      );
      break;
    }
    default:
      console.log("Invalid param");
  }
};

const assignWinLostOrRevert = async (game, param) => {
  let promises = [];
  for (const user of game.team1) {
    if (param === "Finished") {
      promises.push(assignWinLoseDb(user, game, game.winningTeam === 1 ? WINS : LOSSES));
    } else {
      promises.push(revertGame(game, param, TEAM1));
    }
  }
  for (const user of game.team2) {
    if (param === "Finished") {
      promises.push(assignWinLoseDb(user, game, game.winningTeam === 2 ? WINS : LOSSES));
    } else {
      promises.push(revertGame(user, game, param, TEAM2));
    }
  }
  await Promise.all(promises);
  promises = [];
};

const includesUserId = (array, userIdParam) => array.map((e) => e.id).includes(userIdParam);

module.exports = {
  fetchFromID,
  fetchGames,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  getQueueArray,
  messageEndswith,
  assignWinLoseDb,
  finishedGames,
  deletableChannels,
  cancelQueue,
  revertGame,
  assignWinLostOrRevert,
  EMBED_COLOR_WARNING,
  channelQueues,
  includesUserId,
  joinTeam1And2,
};
