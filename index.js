"use strict";
const fs = require('fs');
const Discord = require('discord.js')
const prefix = require("./prefix.json");

const client = require("./client.js");
client.commands = new Discord.Collection();


const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log('its rdy');
    client.user.setActivity("Type !help to get info")
});

client.on('message', message => {
/*
    if(message.content.startsWith("fuck")) {
        message.channel.send("Can you not be rude.");
    }
    */
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    
    const command = args.shift().toLowerCase();
    
    if (!client.commands.has(command)) return;

client.commands.get(command).execute(message, args);
});

client.login(process.env.token);
