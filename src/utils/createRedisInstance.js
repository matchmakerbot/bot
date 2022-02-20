const { createClient } = require("redis");

const logger = require("pino")();

const cacheObject = {
  deletableChannels: [],
  queueTypeObject: {},
  finishedGames: [],
  channelQueues: [],
  cancelQueue: {},
  invites: {},
};

class RedisInstance {
  constructor() {
    this.client = createClient(
      process.env.NODE_ENV === "prod"
        ? { url: `redis://${process.env.REDIS_USERNAME_AND_PASSWORD}@redis-headless.redis.svc.cluster.local:6379` }
        : null
    );
    this.client.on("error", (err) => logger.error(err));
  }

  async connectAndInit() {
    await this.client.connect();

    Object.keys(cacheObject).forEach(async (key) => {
      const value = await this.getObject(key);
      if (!value) {
        await this.setObject(key, cacheObject[key]);
        return;
      }
      if (key === "channelQueues") {
        value.forEach(async (queue) => {
          if (queue.players.length >= queue.queueSize) {
            queue.players.splice(0, queue.players.length);
            await this.setObject(key, value);
          }
        });
      }
    });
  }

  async setObject(key, value) {
    const json = JSON.stringify(value);
    await this.client.set(key, json);
  }

  async getObject(key) {
    const json = await this.client.get(key);
    return JSON.parse(json);
  }
}

const redisInstance = new RedisInstance();

module.exports = {
  redisInstance,
};
