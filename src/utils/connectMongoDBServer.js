const mongoose = require("mongoose");

const MONGO_URI = process.env.mongodb;

const createDbConnection = async () => {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = { createDbConnection };
