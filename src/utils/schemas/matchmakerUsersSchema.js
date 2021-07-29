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
  { collection: "solos", versionKey: false, minimize: false }
);

module.exports = mongoose.model("solos", schema);
