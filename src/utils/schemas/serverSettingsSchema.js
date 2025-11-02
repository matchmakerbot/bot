const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    guildId: String,
    defaultStartingMMR: { type: Number, default: 1000 },
    adminChannelId: { type: String, default: null },
    privateMessageTemplates: {
      createMatch: {
        type: String,
        default: "**You have to:** Create Custom Match\n**Name:** {name}\n**Password:** {password}",
      },
      joinMatch: {
        type: String,
        default: "**You have to:** Join match (Created by <@{captainId}>)\n**Name:** {name}\n**Password:** {password}",
      },
    },
  },
  { collection: "serverSettings", versionKey: false, minimize: false }
);

module.exports = mongoose.model("serverSettings", schema);
