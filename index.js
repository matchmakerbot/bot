"use strict";

let storedGuilds, storedTeams;

const fs = require('fs');

const Discord = require('discord.js')

const prefix = require("./config.json").prefix;

const client = require("./client.js");

const MongoDB = require("./mongodb");

const queueCommands = ['q', "status", "leave", "report", "score", "cancel", "reset", "game", "ongoinggames", "createteam", "invite", "disband", "jointeam", "pendinginvites", "leaveteam", "whois", "kickplayer"]

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

MongoDB.connectdb(async (err) => {

    const fivevfivesingles = require('./commands/5v5.js');

    const fivevfiveteams = require('./commands/5v5teams.js');

    const threevthreesingles = require('./commands/3v3.js');

    const threevthreeteams = require('./commands/3v3teams.js')

    const db = MongoDB.getDB()

    const serversCollection = db.collection('guilds')

    const teamsCollection = db.collection('teams')

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
        console.log(`Guilds: ${client.guilds.cache.map(a => a.name).join(" || ")}\nNumber of Guilds: ${client.guilds.cache.map(a => a.name).length}`);
        console.log('Ready');
        client.user.setActivity("Type !helpmatchmaking to get info");
    });

    client.on('message', async message => {

        const embed = new Discord.MessageEmbed().setColor('#F8534F')

        const args = message.content.slice(prefix.length).split(/ +/);

        const command = args.shift().toLowerCase();

        if (!message.content.startsWith(prefix) || message.author.bot) return;

        if (!client.commands.has(command)) return;

        if (queueCommands.includes(command)) {
            await serversCollection.find().toArray().then(dataDB => {
                storedGuilds = dataDB
            })

            if (storedGuilds.find(e => e.id === message.guild.id).channels[message.channel.id] === undefined) {

                embed.setTitle(":x: You must first select your prefered gamemode in this channel using !channelmode 3v3singles, 3v3teams, 5v5singles or 5v5teams")

                return message.channel.send(embed);
            } else if (storedGuilds.find(e => e.id === message.guild.id).channels[message.channel.id] === "5v5singles") {

                return fivevfivesingles.execute(message, args)
            } else if (storedGuilds.find(e => e.id === message.guild.id).channels[message.channel.id] === "5v5teams") {

                return fivevfiveteams.execute(message, args)
            } else if (storedGuilds.find(e => e.id === message.guild.id).channels[message.channel.id] === "3v3singles") {

                return threevthreesingles.execute(message, args)
                } else if (storedGuilds.find(e => e.id === message.guild.id).channels[message.channel.id] === "3v3teams") {
    
                return threevthreeteams.execute(message, args)
            } else {
                embed.setTitle(":x: Wtf is going on? Message Tweeno #8687")

                return message.channel.send(embed)
            }

        }

        client.commands.get(command).execute(message, args);

    });

    client.on("guildCreate", async (guild) => {

        console.log(`Joined ${guild.name}`)

        const serverInfo = {
            id: guild.id,
            game: "",
            whitelist: [],
            channels: {}
        }

        const teamsInfo = {
            id: guild.id,
            teams: []
        }

        await serversCollection.find().toArray().then(dataDB => {
            storedGuilds = dataDB
        })

        if (!storedGuilds.map(e => e.id).includes(guild.id)) {
            await serversCollection.insert(serverInfo);
        }

        await teamsCollection.find().toArray().then(dataDB => {
            storedTeams = dataDB
        })

        if (!storedTeams.map(e => e.id).includes(guild.id)) {
            await serversCollection.insert(teamsInfo);
        }
    });
})

client.login(process.env.token);