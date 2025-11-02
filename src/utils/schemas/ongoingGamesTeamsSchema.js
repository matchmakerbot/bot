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
    team1Reports: [
      {
        userId: String,
        result: String,
        timestamp: Date,
      },
    ],
    team2Reports: [
      {
        userId: String,
        result: String,
        timestamp: Date,
      },
    ],
    dispute: { type: Boolean, default: false },
    disputeReason: String,
    winningTeam: Number,
  },
  { collection: "ongoingGamesTeams", versionKey: false }
);

module.exports = mongoose.model("ongoingGamesTeams", schema);
