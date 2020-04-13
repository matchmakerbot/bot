const Discord = require('discord.js')
const discordEmbed = new Discord.RichEmbed()

	.setAuthor("Deformed Bot Help Page", "https://media.discordapp.net/attachments/464556094728044564/619269142268215355/68884765_417923562160410_1636845361156849664_n.jpg?width=676&height=676")
	.setColor('#F8534F')
	.setTitle("For MatchMaking related commands, please use the command !helpmatchmaking")
	.addField('!ping', '`It pongs! Very useful!`')
	.addField('!lpt', '`Gives you a nice life pro tip.`')
	.addField('!gaypercentage', '`Tells you how gay you are! Aaaaand you\'ll be stuck with it for the rest of your life.`')
	.addField('!gayrandom', '`Tells you how gay you are (totally random).`')
	.addField('!randomword', '`Says a random word from the oxford dictionary. Current count: 458570 words.`')
	.addField('!random', '`Chooses a random word from what you write.`')
	.addField('!reddit', '`Allows you to search posts with images on any given subreddit (Example = !reddit memes)`')
	.addField('!credits', '`Just some credits :p`')
	.addField('!idea', '`Submit or receive a random idea \n Usage = !idea your idea \n !idea random`')
	.setTimestamp()
	.setFooter('Page 1/2')
	
	const discordEmbed2 = new Discord.RichEmbed()

	.setAuthor("Deformed Bot Help Page", "https://media.discordapp.net/attachments/464556094728044564/619269142268215355/68884765_417923562160410_1636845361156849664_n.jpg?width=676&height=676")
	.setColor('#F8534F')
	.addField('!showerthoughts', '`Thing that you think about while taking a shower.`')
	.addField('!idea', '`Submit or receive a random idea \n Usage = !idea your idea \n !idea random`')
	.setTimestamp()
	.setFooter('Page 2/2')

	module.exports = {
		name: 'help',
		description: 'Gievs you a nice command list',
		execute(message) {
			if(message.content === "!help" || message.content === "!help 1"){
			message.channel.send(discordEmbed);
		} else if(message.content === "!help 2"){
			message.channel.send(discordEmbed2);
		}
	}
	}
