const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const CONNECTION_URL = process.env.mongodb;
const DATABASE_NAME = "sixman";
const rateLimit = require("express-rate-limit");
 
 
var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection5v5, collectionTeams;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2 
  });
 
app.listen(3101, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection5v5 = database.collection("sixman");
        collectionTeams = database.collection("teams");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.use(limiter)

app.get("/5v5/channelId=:id", (request, response) => {
  collection5v5.find({["servers.$.channelID"]:request.params.id}).toArray((error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(result);
  });
});

app.get("/5v5/id=:id", (request, response) => {
    collection5v5.find({id:request.params.id}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
  });

app.get("/teams", (request, response) => {
  collectionTeams.find({id:"641229728564379658"}).toArray((error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(result);
  });
});

app.get("/teams/teamname=:id", (request, response) => {
    collectionTeams.find({["teams.name"]:request.params.id,},{id:"641229728564379658"}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
  });
