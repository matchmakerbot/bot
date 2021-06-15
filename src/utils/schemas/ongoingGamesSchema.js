const mongoose = require("mongoose");

const playerObject = {
  id: String,
  name: String,
  date: Date,
  _id: false,
};

const teamObject = {
  name: String,
  captain: String,
  players: [{
    type: String
  }]
}

const schema = new mongoose.Schema(
  {
    queueSize: Number,
    gameId: Number,
    gamemode: String,
    time: Date,
    channelId: String,
    team1: [playerObject || teamObject],
    team2: [playerObject || teamObject],
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
