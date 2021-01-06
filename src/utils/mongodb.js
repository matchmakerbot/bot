const mongoose = require("mongoose");

const url = process.env.mongodb;

let _db;

const connectdb = async (callback) => {
  mongoose.connect(url, (err, db) => {
    _db = db;
    return callback(err);
  });
};

const getDB = () => _db;

module.exports = { connectdb, getDB };
