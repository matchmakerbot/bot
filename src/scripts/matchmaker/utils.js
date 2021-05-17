const client = require("../../utils/createClientInstance.js");

const OngoingGamesCollection = require("../../utils/schemas/ongoingGamesSchema.js");

const MatchmakerCollection = require("../../utils/schemas/matchmakerUsersSchema");

const EMBED_COLOR_ERROR = "#F8534F";

const TEAM1 = "team1";

const TEAM2 = "team2";

const WINS = "wins";

const LOSSES = "losses";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#77B255";

const finishedGames = [];

const deletableChannels = [];

const channelQueues = [];

const cancelQueue = {};

const joinTeam1And2 = (object) => {
  return object.team1.concat(object.team2);
};

const fetchFromId = async (id, wrongEmbedParam, messageParam) => {
  const user = await client.users.fetch(id).catch((error) => {
    wrongEmbedParam.setTitle("Please tag the user");
    console.log(error);
    messageParam.channel.send(wrongEmbedParam);
  });
  return user;
};

const fetchGames = async (channelId) => {
  const games = await OngoingGamesCollection.find(
    channelId != null
      ? {
          channelId,
        }
      : {}
  );
  return games;
};

const messageEndswith = (message) => {
  const split = message.content.split(" ");
  return split[split.length - 1];
};

const getQueueArray = (queueSize, channelId) => {
  for (const item of channelQueues) {
    if (item.channelId === channelId) {
      return item.players;
    }
  }
  channelQueues.push({
    channelId,
    queueSize,
    game: null,
    players: [],
  });
  return channelQueues[channelQueues.length - 1].players;
};

const assignWinLoseDb = async (user, game, score) => {
  const storedUserDb = await MatchmakerCollection.findOne({
    id: user.id,
  });
  // not working for some reason look into it
  const channelPos = storedUserDb.servers.map((e) => e.channelId).indexOf(game.channelId);

  const sort = `servers.${channelPos}.${score}`;

  const mmr = `servers.${channelPos}.mmr`;

  await MatchmakerCollection.update(
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
  const storedUserDb = await MatchmakerCollection.findOne({
    id: user.id,
  });

  const channelPos = storedUserDb.servers.map((e) => e.channelId).indexOf(game.channelId);

  const win = `servers.${channelPos}.wins`;

  const lose = `servers.${channelPos}.losses`;

  const winsOrLosses =
    (game.winningTeam === 1 && team === TEAM1) || (game.winningTeam === 2 && team === TEAM2) ? "wins" : "losses";

  const sort = `servers.${channelPos}.${winsOrLosses}`;

  const mmr = `servers.${channelPos}.mmr`;

  switch (param) {
    case "revert": {
      await MatchmakerCollection.update(
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
      await MatchmakerCollection.update(
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

const includesUserId = (array, userIdParam) => {
  return array.map((e) => e.id).includes(userIdParam);
};

module.exports = {
  fetchFromId,
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
