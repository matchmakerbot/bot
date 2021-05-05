const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: String,
    teams: [],
  },
  { collection: "teams", versionKey: false }
);

module.exports = mongoose.model("teams", schema);
