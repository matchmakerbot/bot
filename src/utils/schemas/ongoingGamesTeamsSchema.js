const mongoose = require("mongoose");

const teamObject = {
  name: String,
  captain: String,
  members: [
    {
      type: String,
    },
  ],
};

const schema = new mongoose.Schema(
  {
    queueSize: Number,
    gameId: Number,
    gamemode: String,
    time: Date,
    channelId: String,
    team1: teamObject,
    team2: teamObject,
    voiceChannelIds: [
      {
        channelName: String,
        id: String,
        channel: String,
        _id: false,
      },
    ],
  },
  { collection: "ongoing_games_teams", versionKey: false }
);

module.exports = mongoose.model("ongoing_games_teams", schema);
