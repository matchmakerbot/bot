const Discord = require('discord.js')

const MongoDB = require("../mongodb");

const db = MongoDB.getDB()

const serversCollection = db.collection('guilds')

let storedGuilds;

const prefix = require("../config.json").prefix;

const gamemode = ["5v5singles", "5v5teams", "3v3singles", "3v3teams"]

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

        const a = `channels.${message.channel.id}`

        if (command === "channelmode") {
            if (!message.member.hasPermission("ADMINISTRATOR")) {

                embed.setTitle(":x: You do not have Administrator permission!")

                return message.channel.send(embed)
            }

            if (!gamemode.includes(secondArg)) {
                embed.setTitle("Please choose between 5v5singles, 5v5teams, 3v3singles or 3v3teams")

                return message.channel.send(embed)
            } else {
                await serversCollection.update({
                    id: message.guild.id
                }, {
                    $set: {
                        [a]: secondArg
                        
                    }
                });
            }
            embed.setTitle(":white_check_mark: Done! Have fun :)")

            return message.channel.send(embed)
        }
    }
}