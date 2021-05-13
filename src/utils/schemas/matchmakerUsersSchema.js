const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: String,
    name: String,
    servers: [
      {
        channelID: String,
        wins: Number,
        losses: Number,
        mmr: Number,
        _id: false,
      },
    ],
  },
  { collection: "sixman", versionKey: false }
);

module.exports = mongoose.model("sixman", schema);
