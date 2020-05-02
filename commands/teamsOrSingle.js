const Discord = require('discord.js')

const MongoDB = require("../mongodb");

const db = MongoDB.getDB()

const serversCollection = db.collection('guilds')

let storedGuilds;

const prefix = require("../config.json").prefix;

const gamemode = ["5v5singles", "5v5teams"]

const teams = require('./teams.js');

const singles = require('./5x5.js');

module.exports = {
    name: 'channelmode',
    description: 'eh',
    async execute(message) {

        let embed = new Discord.MessageEmbed().setColor('#F8534F')

        const args = message.content.slice(prefix.length).split(/ +/);

        const command = args.shift().toLowerCase();

        const secondArg = message.content.split(" ")[1]

        await serversCollection.find().toArray().then(dataDB => {
            storedGuilds = dataDB
        })

        if (command === "channelmode") {
            if (!message.member.hasPermission("ADMINISTRATOR")) {

                embed.setTitle(":x: You do not have Administrator permission!")
    
                return message.channel.send(embed)
            }

            if (!gamemode.includes(secondArg)) {
                embed.setTitle("Please choose between 5v5singles and 5v5teams")

                return message.channel.send(embed)
            } else {
                await serversCollection.update({
                    id: message.guild.id
                }, {
                    $set: {
                        //smth wrong with this
                        channels: {
                            [message.channel.id]: secondArg
                        }
                    }
                });
            }
            embed.setTitle(":white_check_mark: Done! Have fun :)")

            return message.channel.send(embed)
        }

        if (storedGuilds.find(e => e.id === message.guild.id).channels[message.channel.id] === undefined) {
            embed.setTitle("To Continue, Please select between 5v5 and 5v5 teams using !channelmode 5v5singles or 5v5teams")

            return message.channel.send(embed)
        }
        if (storedGuilds.find(e => e.id === message.guild.id).channels[message.channel.id] === "5v5singles") {

            return singles.execute(message, args)
        } else if (storedGuilds.find(e => e.id === message.guild.id).channels[message.channel.id] === "5v5teams") {

            return teams.execute(message, args)
        } else {

            embed.setTitle(":x: Wtf is going on? Message Tweeno #8687")

            return message.channel.send(embed)
        }
    }
}