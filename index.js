'use strict';

const fs = require('fs');

const Discord = require('discord.js');

const prefix = require('./config.json').prefix;

const client = require('./client.js');

const MongoDB = require('./mongodb');

const channelMode = {};

const queueCommands = ['q', 'status', 'leave', 'report', 'score', 'cancel', 'reset', 'game', 'ongoinggames', 'createteam', 'invite', 'disband', 'jointeam', 'pendinginvites', 'leaveteam', 'whois', 'kickplayer', 'r', 'c', 'revertgame', 'giveownership'];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

client.commands = new Discord.Collection();

class newTeamGuid {
	constructor(guildId) {
		this.id = guildId,
		this.teams = {}
	}
}

class newGuild {
	constructor(guildId) {
	this.id = guildId,
	this.game = '',
	this.whitelists = []
	this.channels = {}
	}
}

MongoDB.connectdb(err => {

	if (err) {
		throw err;
	}

	const fivevfivesingles = require('./commands/5v5.js');

	const fivevfiveteams = require('./commands/5v5teams.js');

	const threevthreesingles = require('./commands/3v3.js');

	const threevthreeteams = require('./commands/3v3teams.js');

	const db = MongoDB.getDB();

	const guildsCollection = db.collection('guilds');

	const teamsCollection = db.collection('teams');

	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		if (typeof command.name === 'string') {
			client.commands.set(command.name, command);
		}
		else if (command.name instanceof Array) {
			for (const a of command.name) {
				client.commands.set(a, command);
			}
		}
	}

	client.once('ready', async () => {
		for(const guidId of client.guilds.cache.map(a => a.id)) {

			await guildsCollection.find({
				id: guidId,
			}).toArray().then(async dataDB => {
				if (dataDB.length === 0) {
					const guildInfo = new newGuild(guidId);
					const teamsInfo = new newTeamGuid(guidId);

					await guildsCollection.insert(guildInfo);
					await teamsCollection.insert(teamsInfo);
				}
			});
		}

		console.log(`Guilds: ${client.guilds.cache.map(a => a.name).join(' || ')}\nNumber of Guilds: ${client.guilds.cache.map(a => a.name).length}`);
		console.log('Ready');

		client.user.setActivity('!helpsolosmatchmaking', {
			type: 'STREAMING',
			url: 'https://www.twitch.tv/tweenoTV',
		});
	});

	client.on('message', async message => {

		const bigBoiiSwitch = gamemode => {
			switch (gamemode) {

			case undefined: {
				embed.setTitle(':x: You must first select your prefered gamemode in this channel using !channelmode 3v3solos, 3v3teams, 5v5solos or 5v5teams');

				return message.channel.send(embed);
			}

			case ('5v5solos'): {

				return fivevfivesingles.execute(message, args);
			}
			case ('5v5teams'): {

				return fivevfiveteams.execute(message, args);
			}
			case ('3v3solos'): {

				return threevthreesingles.execute(message, args);
			}
			case ('3v3teams'): {

				return threevthreeteams.execute(message, args);
			}
			default: {
				embed.setTitle(':x: Wtf is going on? Message Tweeno #8687');

				return message.channel.send(embed);
			}
			}
		};

		const embed = new Discord.MessageEmbed().setColor('#F8534F');
		const args = message.content.slice(prefix.length).split(/ +/);
		const command = args.shift().toLowerCase();

		if (!message.content.startsWith(prefix) || message.author.bot) return;

		if (!client.commands.has(command)) return;

		if (queueCommands.includes(command)) {
			if (channelMode[message.guild.id] === undefined) {

				return await guildsCollection.find({
					id: message.guild.id,
				}).toArray().then(dataDB => {

					bigBoiiSwitch(dataDB[0].channels[message.channel.id]);

					channelMode[message.guild.id] = dataDB[0].channels[message.channel.id];
				});
			}

			return bigBoiiSwitch(channelMode[message.guild.id]);
		}

		client.commands.get(command).execute(message, args);
	});

	client.on('guildCreate', async (guild) => {

		console.log(`Joined ${guild.name}`);

		const guildInfo = new newGuild(guidId);
		const teamsInfo = new newTeamGuid(guidId);

		await guildsCollection.find({
			id: guild.id,
		}).toArray().then(async dataDB => {
			if (dataDB.length === 0) {
				await guildsCollection.insert(guildInfo);
				await teamsCollection.insert(teamsInfo);
			}
		});
	});
});

client.login(process.env.token);

module.exports = channelMode;