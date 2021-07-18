const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    guildId: String,
    name: String,
    captain: String,
    players: [
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
  { collection: "guilds", versionKey: false, minimize: false }
);

module.exports = mongoose.model("teams", schema);
