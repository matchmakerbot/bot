"use strict";

const fs = require('fs');

const Discord = require('discord.js')

const prefix = require("./config.json").prefix;

const client = require("./client.js");

const MongoDB = require("./mongodb");

const queueCommands = ['q', "status", "leave", "report", "score", "cancel", "reset", "r", "c"]

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

MongoDB.connectdb(async (err) => {

    const guild1Commands = require('./commands/sixmans.js');

    const otherGuildCommands = require('./commands/5x5.js');

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
        console.log(`Guilds: ${client.guilds.array().map(a => a.name).join(" || ")}\nNumber of Guilds: ${client.guilds.array().map(a => a.name).length}`)
        console.log('Ready');
        client.user.setActivity("Type !helpmatchmaking to get info")
    });

    client.on('message', message => {

        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).split(/ +/);

        const command = args.shift().toLowerCase();

        if (!client.commands.has(command)) return;

        if (queueCommands.includes(command)) {
            if (message.guild.id == "580891269488705548") {
                return guild1Commands.execute(message, args)
            } else {
                return otherGuildCommands.execute(message, args)
            }
        }

        client.commands.get(command).execute(message, args);

    });

})

client.login(process.env.token);