const Discord = require('discord.js');

const rp = require('request-promise-native');

const jsdom = require('jsdom')

const {
	JSDOM
} = jsdom

const execute = async (message) => {

	const embed = new Discord.MessageEmbed();

	const content = message.content.split(' ');

	content.shift();

	content.join('%20');

		const response = await rp(`https://www.globaldata.pt/?q=3600`);
		const parsed = new JSDOM(response).window.document;
		console.log(parsed.getElementsByClassName('price')[0].textContent)

		const price = parsed.getElementsByClassName('df-card__price ')[0].textContent;
		const title = parsed.getElementsByClassName('df-card__title')[0].textContent;
		const pic = parsed.getElementsByClassName('df-card__image')[0].querySelectorAll()[0].src;
		const link = parsed.getElementsByClassName('df-card__main')[0].href;
		const stock = parsed.getElementsByClassName('stock_message')[0].textContent;

		embed.setColor('#F8534F')
			.setTitle(title)
			.setAuthor("Go to link",pic,link)
			.addField('Preço PCDIGA:', price)
			.addField('Stock:',stock)
			.setTimestamp()

		message.channel.send(embed);

};

module.exports = {
	name: 'price',
	description: '6man bot',
	execute,
};