const { createBotInstance } = require("./utils/createBotInstance");

const { createDbConnection } = require("./utils/connectMongoDBServer");

(async () => {
  try {
    await createDbConnection();
    console.log("Estabilished MongoDB connection");

    await createBotInstance();
    console.log("Started MatchmakerBot Instance");
  } catch (e) {
    console.log("Error creating a Bot Instance/Db Connection");

    console.error(e);

    // process.exit(1);
  }
})();
