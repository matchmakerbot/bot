const mongoose = require("mongoose");

const playerObject = {
  userId: String,
  username: String,
  date: Date,
  mmr: Number,
  _id: false,
};

const schema = new mongoose.Schema(
  {
    queueSize: Number,
    gameId: Number,
    date: Date,
    channelId: String,
    guildId: String,
    team1: [playerObject],
    team2: [playerObject],
    channelIds: [
      {
        type: String,
      },
    ],
  },
  { collection: "ongoingGamesSolos", versionKey: false }
);

module.exports = mongoose.model("ongoingGamesSolos", schema);
