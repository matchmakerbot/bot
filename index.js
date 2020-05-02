"use strict";

let storedGuilds, storedTeams;

const fs = require('fs');

const Discord = require('discord.js')

const prefix = require("./config.json").prefix;

const client = require("./client.js");

const MongoDB = require("./mongodb");

const queueCommands = ['q', "status", "leave", "report", "score", "cancel", "reset", "game", "whitelist", "ongoinggames", "createteam", "invite", "disband", "jointeam", "pendinginvites", "leaveteam", "whois", "kickplayer", "mode", "channelmode"]

const modes = ["3v3", "5v5"]

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

MongoDB.connectdb(async (err) => {

    const sixmanFile = require('./commands/sixmans.js');

    const teamsOrSingle = require('./commands/teamsOrSingle.js');

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

        const secondArg = message.content.split(" ")[1]

        const embed = new Discord.MessageEmbed().setColor('#F8534F')

        const args = message.content.slice(prefix.length).split(/ +/);

        const command = args.shift().toLowerCase();

        if (!message.content.startsWith(prefix) || message.author.bot) return;

        if (!client.commands.has(command)) return;

        if (command === "mode") {

            if (!message.member.hasPermission("ADMINISTRATOR")) {

                embed.setTitle(":x: You do not have Administrator permission!")

                return message.channel.send(embed)
            }

            if (!modes.includes(secondArg)) {

                embed.setTitle(":x: Invalid mode")

                return message.channel.send(embed);

            } else {
                await serversCollection.update({
                    id: message.guild.id
                }, {
                    $set: {
                        mode: secondArg
                    }
                });
            }
            embed.setTitle(":white_check_mark: Gotcha boss!")

            return message.channel.send(embed);
        }

        if (queueCommands.includes(command)) {
            await serversCollection.find().toArray().then(dataDB => {
                storedGuilds = dataDB
            })

            if (!modes.includes(storedGuilds.find(e => e.id === message.guild.id).mode)) {

                embed.setTitle(":x: You must first select your prefered gamemode using !mode 3v3 or 5v5")

                return message.channel.send(embed);
            }

            if (storedGuilds.find(e => e.id === message.guild.id).mode === "3v3") {

                return sixmanFile.execute(message, args)
            } else if (storedGuilds.find(e => e.id === message.guild.id).mode === "5v5") {

                return teamsOrSingle.execute(message, args)
            } else {

                embed.setTitle(":x: Wtf is going on? Message Tweeno #8687")

                return message.channel.send(embed);
            }
        }

        client.commands.get(command).execute(message, args);

    });

    client.on("guildCreate", async (guild) => {

        const serverInfo = {
            id: guild.id,
            game: "",
            whitelist: [],
            mode: "",
            channels: {}
        }

        const teamsInfo = {
            id:guild.id,
            teams: []
        }

        await serversCollection.find().toArray().then(dataDB => {
            storedGuilds = dataDB
        })

        if (!storedGuilds.map(e => e.id).includes(guild.id)) {
            await serversCollection.insert(serverInfo);
        }

    });
})

client.login(process.env.token);