const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    guildId: String,
    defaultStartingMMR: { type: Number, default: 1000 },
  },
  { collection: "serverSettings", versionKey: false, minimize: false }
);

module.exports = mongoose.model("serverSettings", schema);
