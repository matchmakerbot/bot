const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    guildId: String,
    name: String,
    captain: String,
    members: [
      {
        type: String,
      },
    ],
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
  { collection: "matchmakerTeams", versionKey: false, minimize: false }
);

module.exports = mongoose.model("matchmakerTeams", schema);
