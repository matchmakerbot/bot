const mongoose = require("mongoose");

const playerObject = {
  id: String,
  name: String,
  date: Date,
  _id: false,
};

const schema = new mongoose.Schema(
  {
    queueSize: Number,
    gameId: Number,
    gamemode: String,
    time: Date,
    channelId: String,
    guildId: String,
    team1: [playerObject],
    team2: [playerObject],
    voiceChannelIds: [
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
