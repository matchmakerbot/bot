const Discord = require('discord.js');

const puppeteer = require('puppeteer');

const execute = async (message) => {

	const embed = new Discord.MessageEmbed();

	const content = message.content.split(' ');

	content.shift();

	content.join('%20');

	const browser = await puppeteer.launch();

	const getItem = async url => {

		const page = await browser.newPage();

		await page.goto(url);

		const [el] = await page.$x('//*[@id="hits"]/div/div[1]/li/div/div[1]/div[2]/a');

		const src = await el.getProperty('href');

		const [elImage] = await page.$x('//*[@id="hits"]/div/div[1]/li/div/div[1]/div[1]/a/span/span/img');

		const srcImage = await elImage.getProperty('src');

		embed.setThumbnail(await srcImage.jsonValue());

		return await src.jsonValue();
	};

	const getValues = async url => {

		const page = await browser.newPage();

		await page.goto(url);

		const getName = async () => {
			const [el] = await page.$x('//*[@id="maincontent"]/div[3]/h1/span');

			const src = await el.getProperty('textContent');

			return await src.jsonValue();
		};

		const getPrice = async () => {
			const [el] = await page.$x('//*[@id="maincontent"]/div[5]/div[2]/div[3]/div[1]/div/div/p/span');

			const src = await el.getProperty('textContent');

			return await src.jsonValue();
		};
		embed.setColor('#F8534F')
			.setTitle(await getName())
			.addField('Preço PCDIGA:', await getPrice())
			.setTimestamp();
		message.channel.send(embed);
	};
	getValues(await getItem(`https://www.pcdiga.com/?query=${content}`));
};

module.exports = {
	name: 'price',
	description: '6man bot',
	execute,
};