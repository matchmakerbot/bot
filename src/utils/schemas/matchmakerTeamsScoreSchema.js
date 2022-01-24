const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    teamId: mongoose.ObjectId,
    channelId: String,
    wins: Number,
    losses: Number,
    mmr: Number,
  },
  { collection: "matchmakerTeamsScore", versionKey: false, minimize: false }
);

module.exports = mongoose.model("matchmakerTeamsScore", schema);
