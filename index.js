"use strict";

const fs = require('fs');

const Discord = require('discord.js')

const prefix = require("./config.json").prefix;

const client = require("./client.js");

const MongoDB = require("./mongodb");

const queueCommands = ['q', "status", "leave", "report", "score", "cancel", "reset", "game", "whitelist", "ongoinggames", "createteam", "invite", "disband", "jointeam", "pendinginvites", "leaveteam", "whois", "kickplayer","mode"]

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

MongoDB.connectdb(async (err) => {

    const guild1Commands = require('./commands/sixmans.js');

    const otherGuildCommands = require('./commands/5x5.js');

    const teamsCommands = require('./commands/teams.js');

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

    client.once('ready', async () => {
        console.log(`Guilds: ${client.guilds.cache.map(a => a.name).join(" || ")}\nNumber of Guilds: ${client.guilds.cache.map(a => a.name).length}`)
        console.log('Ready');
        client.user.setActivity("Type !helpmatchmaking to get info")
    });

    client.on('message', message => {

        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).split(/ +/);

        const command = args.shift().toLowerCase();

        if (!client.commands.has(command)) return;
//make the database thingy here
        if (queueCommands.includes(command)) {
            if (message.guild.id == "580891269488705548" || message.guild.id == "537712402884591635") {
                return guild1Commands.execute(message, args)
            } else if (message.channel.id === "697856354194554881") {
                return teamsCommands.execute(message, args)
            } else {
                return otherGuildCommands.execute(message, args)
            }
        }


        client.commands.get(command).execute(message, args);

    });
})

client.login(process.env.token);