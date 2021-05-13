const Discord = require("discord.js");

const guildsCollection = require("../utils/schemas/guildsSchema");

const { queueSizeObject } = require("../utils/cache");

const wrongEmbed = new Discord.MessageEmbed().setColor("#F8534F");

const correctEmbed = new Discord.MessageEmbed().setColor("#77B255");
// make it so that it resets the queue/checks for ongoinggames
const execute = async (message) => {
  const secondArg = message.content.split(" ")[1];

  const a = `channels.${message.channel.id}`;

  if (!message.member.hasPermission("ADMINISTRATOR")) {
    wrongEmbed.setTitle(":x: You do not have Administrator permission!");

    return message.channel.send(wrongEmbed);
  }

  const intGamemode = Number(secondArg);

  if (Number.isNaN(intGamemode)) {
    wrongEmbed.setTitle("Invalid parameter");

    return message.channel.send(wrongEmbed);
  }

  if (intGamemode % 2 !== 0) {
    wrongEmbed.setTitle("Please choose an even number");

    return message.channel.send(wrongEmbed);
  }

  await guildsCollection.updateOne(
    {
      id: message.guild.id,
    },
    {
      $set: {
        [a]: secondArg,
      },
    }
  );

  queueSizeObject[message.channel.id] = secondArg;

  correctEmbed.setTitle(":white_check_mark: Done! Have fun :)");

  return message.channel.send(correctEmbed);
};

module.exports = {
  name: "queuesize",
  execute,
};
