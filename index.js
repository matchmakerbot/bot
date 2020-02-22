"use strict";

const config = require("./config.json");

const fs = require('fs');

const Discord = require('discord.js')

const prefix = require("./config.json").prefix;

const client = require("./client.js");

const MongoDB = require("./mongodb");

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

MongoDB.connectdb(async (err) => {

  if (err) throw err

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (typeof command.name === "string") {
        client.commands.set(command.name, command);
    } else if (command.name instanceof Array) {
        for (let a of command.name) {
            client.commands.set(a, command);
        }
    }
}

client.once('ready', () => {
    console.log('its rdy');
    client.user.setActivity("Type !help to get info")
});

client.on('message', message => {

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);

    const command = args.shift().toLowerCase();

    if (!client.commands.has(command)) return;
    client.commands.get(command).execute(message, args);

});

})



client.login(process.env.token);
