const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    guildId: String,
    channelId: String,
    queueMode: String,
    queueSize: Number,
    createVoiceChannels: { type: Boolean, default: true },
    createTextChannels: { type: Boolean, default: false },
    sendDirectMessage: { type: Boolean, default: true },
  },
  { collection: "channels", versionKey: false, minimize: false }
);

module.exports = mongoose.model("channels", schema);
