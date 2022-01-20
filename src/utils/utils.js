// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable promise/no-nesting */
const client = require("./createClientInstance.js");

const sendMessage = async (message, messageType) => {
  await message.channel.send(messageType).catch(async () => {
    const user = await client.users.fetch(message.author.id).catch(() => {});
    await user.send("Unable to send messages in channel, bot likely does not have permissions").catch(() => {});
  });
};

module.exports = { sendMessage };
