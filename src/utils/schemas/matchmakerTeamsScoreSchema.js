const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: String,
    guildId: String,
    channelId: String,
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    mmr: { type: Number, default: 1000 },
  },
  { collection: "matchmakerTeamsScore", versionKey: false, minimize: false }
);

module.exports = mongoose.model("matchmakerTeamsScore", schema);
