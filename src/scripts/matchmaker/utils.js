const client = require("../../utils/createClientInstance.js");

const OngoingGamesSolosCollection = require("../../utils/schemas/ongoingGamesSolosSchema.js");

const OngoingGamesTeamsCollection = require("../../utils/schemas/ongoingGamesTeamsSchema.js");

const MatchmakerCollection = require("../../utils/schemas/matchmakerUsersSchema");

const TeamsCollection = require("../../utils/schemas/teamsSchema");

const EMBED_COLOR_ERROR = "#F8534F";

const TEAM1 = "team1";

const TEAM2 = "team2";

const WINS = "wins";

const LOSSES = "losses";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#B78727";

const finishedGames = [];

const deletableChannels = [];

const channelQueues = [];

const cancelQueue = {};

const invites = {};

const gameCount = {
  value: 0,
};

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

const fetchGamesSolos = async (channelId) => {
  const games = await OngoingGamesSolosCollection.find(
    channelId != null
      ? {
          channelId,
        }
      : {}
  );
  return games;
};

const fetchGamesTeams = async (channelId, guildId) => {
  const obj = {};
  if (channelId != null) obj.channelId = channelId;
  if (guildId != null) obj.guildId = guildId;
  const games = await OngoingGamesTeamsCollection.find(obj);
  return games;
};

const messageEndswith = (message) => {
  const split = message.content.split(" ");
  return split[split.length - 1];
};

const getQueueArray = (queueSize, channelId, guildId, queueType) => {
  for (const item of channelQueues) {
    if (item.channelId === channelId && item.queueType === queueType) {
      return item.players;
    }
  }
  channelQueues.push({
    channelId,
    guildId,
    queueSize,
    queueType,
    players: [],
  });
  return channelQueues[channelQueues.length - 1].players;
};

const assignWinLoseDb = async (user, game) => {
  const storedDb =
    game.queueType === "solos"
      ? await MatchmakerCollection.findOne({
          id: user.id,
        })
      : await TeamsCollection.findOne({
          name: user.name,
          guildId: game.guildId,
        });

  const channelPos = storedDb.channels.map((e) => e.channelId).indexOf(game.channelId);

  const score = game.winningTeam === 1 ? WINS : LOSSES;

  const sort = `channels.${channelPos}.${score}`;

  const mmr = `channels.${channelPos}.mmr`;

  const set = {
    $set: {
      [sort]: storedDb.channels[channelPos][score] + 1,
      [mmr]: score === WINS ? storedDb.channels[channelPos].mmr + 10 : storedDb.channels[channelPos].mmr - 10,
    },
  };

  if (game.queueType === "solos") {
    await MatchmakerCollection.update(
      {
        id: user.id,
      },
      set
    );
  } else {
    await TeamsCollection.update(
      {
        name: user.name,
        guildId: game.guildId,
      },
      set
    );
  }
};

const revertGame = async (user, game, param, team) => {
  const storedDb =
    game.queueType === "solos"
      ? await MatchmakerCollection.findOne({
          id: user.id,
        })
      : await TeamsCollection.findOne({
          name: user.name,
          guildId: game.guildId,
        });

  const channelPos = storedDb.channels.map((e) => e.channelId).indexOf(game.channelId);

  const win = `channels.${channelPos}.wins`;

  const lose = `channels.${channelPos}.losses`;

  const winsOrLosses =
    (game.winningTeam === 0 && team === TEAM1) || (game.winningTeam === 1 && team === TEAM2) ? "wins" : "losses";

  const sort = `channels.${channelPos}.${winsOrLosses}`;

  const mmr = `channels.${channelPos}.mmr`;

  switch (param) {
    case "revert": {
      const set = {
        $set: {
          [win]:
            winsOrLosses === "wins" ? storedDb.channels[channelPos].wins - 1 : storedDb.channels[channelPos].wins + 1,

          [lose]:
            winsOrLosses === "wins"
              ? storedDb.channels[channelPos].losses + 1
              : storedDb.channels[channelPos].losses - 1,

          [mmr]:
            winsOrLosses === "wins" ? storedDb.channels[channelPos].mmr - 20 : storedDb.channels[channelPos].mmr + 20,
        },
      };
      if (game.queueType === "solos") {
        await MatchmakerCollection.update(
          {
            id: user.id,
          },
          set
        );
      } else {
        await TeamsCollection.update(
          {
            name: user.name,
            guildId: game.guildId,
          },
          set
        );
      }
      break;
    }
    case "cancel": {
      const set = {
        $set: {
          [sort]: storedDb.channels[channelPos][winsOrLosses] - 1,

          [mmr]:
            winsOrLosses === "wins" ? storedDb.channels[channelPos].mmr - 10 : storedDb.channels[channelPos].mmr + 10,
        },
      };
      if (game.queueType === "solos") {
        await MatchmakerCollection.update(
          {
            id: user.id,
          },
          set
        );
      } else {
        await TeamsCollection.update(
          {
            name: user.name,
            guildId: game.guildId,
          },
          set
        );
      }
      break;
    }
    default:
      console.log("Invalid param");
  }
};

const includesUserId = (array, userId) => {
  return array.map((e) => e.id).includes(userId);
};

const fetchTeamByGuildAndUserId = async (guildId, userId) => {
  const team = await TeamsCollection.findOne({
    guildId,
    $or: [{ captain: userId }, { members: userId }],
  });
  return team;
};

const fetchTeamsByGuildId = async (guildId) => {
  const team = await TeamsCollection.find({
    guildId,
  });
  return team;
};

const fetchTeamByGuildIdAndName = async (guildId, name) => {
  const team = await TeamsCollection.findOne({
    guildId,
    name,
  });
  return team;
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
  fetchGamesTeams,
  fetchTeamByGuildIdAndName,
  fetchTeamsByGuildId,
  fetchTeamByGuildAndUserId,
  fetchFromId,
  fetchGamesSolos,
  EMBED_COLOR_CHECK,
  EMBED_COLOR_ERROR,
  getQueueArray,
  messageEndswith,
  assignWinLoseDb,
  finishedGames,
  deletableChannels,
  cancelQueue,
  revertGame,
  EMBED_COLOR_WARNING,
  channelQueues,
  includesUserId,
  joinTeam1And2,
  gameCount,
  invites,
  messageArgs,
  shuffle,
};
