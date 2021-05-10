const mongoose = require("mongoose");

const playerObject = {
  id: String,
  name: String,
  date: Date,
  _id: false,
};

const schema = new mongoose.Schema(
  {
    gamemode: String,
    gameID: Number,
    time: Date,
    channelID: String,
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
  { collection: "ongoing_games", versionKey: false }
);

module.exports = mongoose.model("ongoing_games", schema);
