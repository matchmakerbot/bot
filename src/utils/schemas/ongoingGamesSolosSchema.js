const mongoose = require("mongoose");

const playerObject = {
  id: String,
  name: String,
  date: Date,
  mmr: Number,
  _id: false,
};

const schema = new mongoose.Schema(
  {
    queueSize: Number,
    gameId: Number,
    gamemode: String,
    date: Date,
    channelId: String,
    guildId: String,
    team1: [playerObject],
    team2: [playerObject],
    channelIds: [
      {
        channelName: String,
        id: String,
        channel: String,
        _id: false,
      },
    ],
  },
  { collection: "ongoing_games_solos", versionKey: false }
);

module.exports = mongoose.model("ongoing_games_solos", schema);
