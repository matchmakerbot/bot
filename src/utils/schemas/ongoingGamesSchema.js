const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    gamemode: String,
    gameID: Number,
    time: Date,
    channelID: String,
    players: [
      {
        id: String,
        name: String,
        date: Date,
        _id: false,
      },
    ],
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
