const mongoose = require("mongoose");

const teamObject = {
  name: String,
  captain: String,
  mmr: Number,
  memberIds: [
    {
      type: String,
    },
  ],
};

const schema = new mongoose.Schema(
  {
    queueSize: Number,
    gameId: Number,
    date: Date,
    channelId: String,
    guildId: String,
    team1: teamObject,
    team2: teamObject,
    channelIds: [
      {
        type: String,
      },
    ],
  },
  { collection: "ongoingGamesTeams", versionKey: false }
);

module.exports = mongoose.model("ongoingGamesTeams", schema);
