const Discord = require('discord.js')
const discordEmbed = new Discord.MessageEmbed()

	.setAuthor("Deformed Bot Help Page", "https://media.discordapp.net/attachments/464556094728044564/619269142268215355/68884765_417923562160410_1636845361156849664_n.jpg?width=676&height=676")
	.setColor('#F8534F')
	.setTitle("For MatchMaking related commands, please use the command !helpsolosmatchmaking or !helpteammatchmaking")
	.addField('!lpt', '`Gives you a nice life pro tip.`')
	.addField('!gaypercentage', '`Tells you how gay you are! Aaaaand you\'ll be stuck with it for the rest of your life.`')
	.addField('!gayrandom', '`Tells you how gay you are (totally random).`')
	.addField('!randomword', '`Says a random word from the oxford dictionary. Current count: 458570 words.`')
	.addField('!reddit', '`Allows you to search posts with images on any given subreddit (Example = !reddit memes)`')
	.addField('!credits', '`Just some credits :p`')
	.setTimestamp()

module.exports = {
	name: 'help',
	description: 'Gievs you a nice command list',
	execute(message) {
		message.channel.send(discordEmbed);
	}
}