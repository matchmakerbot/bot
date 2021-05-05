const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: String,
    game: String,
    channels: {
      type: mongoose.Schema.Types.Mixed,
      of: String,
      _id: false,
    },
  },
  { collection: "guilds", versionKey: false }
);

module.exports = mongoose.model("guilds", schema);
