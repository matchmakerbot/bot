const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: String,
    channels: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { collection: "guilds", versionKey: false, minimize: false }
);

module.exports = mongoose.model("guilds", schema);
