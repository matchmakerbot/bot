const Discord = require('discord.js');

const execute = (message) => {
	const embed = new Discord.MessageEmbed()
		.setColor('#F8534F')
		.addField('Tweeno#8687', 'Creator of this Bot')
		.setThumbnail('https://cdn.discordapp.com/avatars/215982178046181376/fdd2a1d7431e760be4300f10c0274dfd.png')
		.addField('https://www.twitch.tv/tweenotv', 'Feel free to follow me on twitch, i usually stream some random stuff.')
		.addField('https://tinyurl.com/y6zr773c', 'Invite the bot to your server here ^^')
		.addField('https://github.com/iTweeno/MatchMaker-Bot/issues/new/choose', 'To request bug fixes and new features');
	message.channel.send(embed);
};

module.exports = {
	name: 'credits',
	description: 'Credits',
	execute,
};