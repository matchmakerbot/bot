const Discord = require('discord.js')
const discordEmbed = new Discord.RichEmbed()

    .setAuthor("SixMansLeague Bot Help Page", "https://media.discordapp.net/attachments/464556094728044564/619269142268215355/68884765_417923562160410_1636845361156849664_n.jpg?width=676&height=676")
    .setColor('#F8534F') 
    .addField("!q",'Sign up for the next queue')
    .addField("!leave",'Leave the queue')
    .addField("!status",'Check the queue status')
    .addField("!c",'Vote for captains mode. First captain types the number of the player that he wants, Second captain types the two numbers in different lines of the players that he wants.')
    .addField("!r",'Vote for random mode (random team)')
    .addField("!cancel",'Cancel the game (Only use this after 15 minutes, in the case of someone not playing)')
    .addField("!report win/lose",'Ends the game, giving the wining team one win and vice versa to the losing team')
    .addField("!score me/channel",'Checks your current score (score channel can only be used by an administrator, to prevent spam)')
    .addField("!reset player/channel",`Resets the score of an individual player (!reset player <discordid>) or the whole channel where this command is inserted (!reset channel)`)


module.exports = {
    name: 'help6mans',
    description: 'Gievs you a nice command list',
    execute(message) {
        message.channel.send(discordEmbed)
    }
}