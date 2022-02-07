const logger = require("pino")();

const { createBotInstance } = require("./utils/createBotInstance");

const { createDbConnection } = require("./utils/createMongoDBInstance");

const { redisInstance } = require("./utils/createRedisInstance");

(async () => {
  try {
    await createDbConnection();
    logger.info("Started MongoDB Instance");

    await redisInstance.connectAndInit();
    logger.info("Started Redis Instance");

    await createBotInstance();
    logger.info("Started MatchmakerBot Instance");
  } catch (e) {
    logger.error("Error creating a Bot Instance/Db Connection");

    logger.error(e);
  }
})();
