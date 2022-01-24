const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    guildId: String,
    name: String,
    captain: String,
    memberIds: [
      {
        type: String,
      },
    ],
  },
  { collection: "matchmakerTeams", versionKey: false, minimize: false }
);

module.exports = mongoose.model("matchmakerTeams", schema);
