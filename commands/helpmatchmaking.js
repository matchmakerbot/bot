const Discord = require('discord.js')

const discordEmbed = new Discord.MessageEmbed()

    .setAuthor("5X5 MatchMaker Bot Help Page", "https://i.ibb.co/4drZsvN/Screenshot-4.png")
    .setColor('#F8534F')
    .setTitle("For teams matchmaking help, please type !helpteammatchmaking")
    .addField("!q", 'Sign up for the next queue (removes player after 45 minutes if no game has been made)')
    .addField("!leave", 'Leave the queue')
    .addField("!status", 'Check the queue status')
    .addField("!c", 'Vote for captains mode. Two captains will be choosen and both will get a Private Message. First captain types the number of the player that he wants, Second captain types the two numbers in different lines of the players that he wants, and so on, like league draft pick.(you have 20 seconds to pick once you received the PM)')
    .addField("!r", 'Vote for random mode (random team)')
    .addField("!cancel", 'Cancel the game (Only use this after 15 minutes, in the case of someone not playing)')
    .addField("!report win/lose", 'Ends the game, giving the wining team one win and vice versa to the losing team')
    .addField("!score me/channel", 'Checks your current score (score channel can only be used by an administrator, to prevent spam)')
    .addField("!reset player/channel", `Resets the score of an individual player (!reset player <discordid>) or the whole channel where this command is inserted (!reset channel)`)


module.exports = {
    name: 'helpmatchmaking',
    description: 'Gievs you a nice command list',
    execute(message) {
            message.channel.send(discordEmbed)
        }
}