const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: String,
    name: String,
    channels: [
      {
        channelId: String,
        wins: Number,
        losses: Number,
        mmr: Number,
        _id: false,
      },
    ],
  },
  { collection: "matchmaking", versionKey: false, minimize: false }
);

module.exports = mongoose.model("matchmaking", schema);
