const logger = require("pino")();

const { createBotInstance } = require("./utils/createBotInstance");

const { createDbConnection } = require("./utils/connectMongoDBServer");

(async () => {
  try {
    await createDbConnection();
    logger.info("Estabilished MongoDB connection");

    await createBotInstance();
    logger.info("Started MatchmakerBot Instance");
  } catch (e) {
    logger.error("Error creating a Bot Instance/Db Connection");

    logger.error(e);

    process.exit(1);
  }
})();
