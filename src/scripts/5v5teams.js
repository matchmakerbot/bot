const Discord = require('discord.js');

const client = require('../utils/client.js');

const MongoDB = require('../utils/mongodb');

const db = MongoDB.getDB();

const teamsCollection = db.collection('teams');

const serversCollection = db.collection('guilds');

const valorantMaps = ['Haven', 'Bind', 'Split'];

const R6Maps = ['Bank', 'House', 'Club', 'Consulate', 'Kafe', 'Coastline'];

const CSGOMaps = ['Cache', 'Dust II', 'Inferno', 'Mirage', 'Train'];

const avaiableGames = ['valorant', 'csgo', 'leagueoflegends', 'r6'];

const EMBED_COLOR_ERROR = '#F8534F';

const EMBED_COLOR_CHECK = '#77B255';

const EMBED_COLOR_WARNING = '#77B255';

const MAX_USER_IDLE_TIME_MS = 45 * 60 * 1000;

const MAX_GAME_LENGTH_MS = 3 * 60 * 60 * 1000;

const UPDATE_INTERVAL_MS = 60 * 1000;

const ongoingGames = [];

const channelQueues = {};

const cancelQueue = {};

const invites = {};

const finishedGames = [];

const storedGames = {};

const deletableChannels = [];

let gameCount = 0;

let teamsInGameVar = [];

let userIDsPM = [];

const updateUsers = async () => {
	const currentTimeMS = Date.now();

	for (const channelUsers of Object.values(channelQueues)) {
		for (const team of channelUsers.filter(team => currentTimeMS - team.time > MAX_USER_IDLE_TIME_MS)) {
			const notifyChannel = await client.channels.fetch(Object.keys(channelQueues).find(key => channelQueues[key] === channelUsers));
			const embedRemove = new Discord.MessageEmbed()
				.setColor(EMBED_COLOR_WARNING)
				.setTitle('You were removed from the queue after no game has been made in 45 minutes!');

			await notifyChannel.send(`<@${team.members[0]}>`, embedRemove);

			channel.splice(0, channel.length);
		}
	}
};

const updateOngoingGames = async () => {
	const currentTimeMS = Date.now();

	for (const game of ongoingGames.filter(game => currentTimeMS - game[2].time > MAX_GAME_LENGTH_MS)) {
		const channels = await client.channels.fetch(game[10].channelID).then(e => e.guild.channels.cache.array());

		for (const channel of channels) {
			if (channel.name === `🔸Team-${games[0].name}-Game-${games[2].gameID}`) {
				await channel.delete();
			}

			if (channel.name === `🔹Team-${games[1].name}-Game-${games[2].gameID}`) {
				await channel.delete();
			}
		}

		const notifyChannel = await client.channels.fetch(games[2].channel);
		const embedRemove = new Discord.MessageEmbed()
			.setColor(EMBED_COLOR_WARNING)
			.setTitle(`:white_check_mark: Game ${games[2].gameID} Cancelled due to not being finished in 3 Hours!`);

		await notifyChannel.send(embedRemove);
		ongoingGames.splice(ongoingGames.indexOf(game), 1);
	}
};

const updateVoiceChannels = async () => {
	for (const deletableChannel of deletableChannels) {
	  const voiceChannel = await client.channels
		.fetch(deletableChannel.channel)
		.then((e) =>
		  e.guild.channels.cache
			.array()
			.find((channel) => channel.id === deletableChannel.id)
		);
  
	  if (voiceChannel) {
		if (voiceChannel.members.array().length === 0) {
		  await voiceChannel.delete().catch( async () => {
			const notifyChannel = await client.channels.fetch(deletableChannel.channel);
			const embedRemove = new Discord.MessageEmbed()
			  .setColor(EMBED_COLOR_WARNING)
			  .setTitle(
				`Unable to delete voice channel ${deletableChannel.gameID}, please delete it manually.`
			  );
			  await notifyChannel.send(embedRemove);
			  deletableChannels.splice(deletableChannels.indexOf(deletableChannel), 1);
		  });
		  deletableChannels.splice(
			deletableChannels.indexOf(deletableChannel),1
		  );
		}
  
		continue;
	  } else {
		const notifyChannel = await client.channels.fetch(deletableChannel.channel);
		const embedRemove = new Discord.MessageEmbed()
		  .setColor(EMBED_COLOR_WARNING)
		  .setTitle(
			`Unable to delete voice channel ${deletableChannel.gameID}, please delete it manually.`
		  );
		  await notifyChannel.send(embedRemove);
		  deletableChannels.splice(deletableChannels.indexOf(deletableChannel), 1);
	  }
	}
  };

const evaluateUpdates = async () => {
	if (Object.entries(channelQueues).length !== 0) {
	    await updateUsers();
	}

	if (ongoingGames.length !== 0) {
		await updateOngoingGames();
	}

	await updateVoiceChannels();
};

setInterval(evaluateUpdates, UPDATE_INTERVAL_MS);

const shuffle = (array) => {

	let currentIndex = array.length;
	let temporaryValue, randomIndex;

	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);

		currentIndex--;

		temporaryValue = array[currentIndex];

		array[currentIndex] = array[randomIndex];

		array[randomIndex] = temporaryValue;
	}

	return array;
};

const messageEndswith = message => {

	const split = message.content.split(' ');
	return split[split.length - 1];
};

const args = message => {
	const arraywords = message.content.split(' ');
	return arraywords[0].substring(1);
};

const messageArgs = message => {
	return message.content.split(' ').slice(1).join(' ');
};

const execute = async (message) => {

	const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

	const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

	const getroleID = (name) => {
		return message.guild.roles.cache.find(e => e.name === name).id;
	};

	const fetchFromID = async (id) => {
		return (await client.users.fetch(id).catch(error => {
			wrongEmbed.setTitle('Please tag the user');
			console.log(error);
			message.channel.send(wrongEmbed);
		}));
	};

	const channel_ID = message.channel.id;

	if (!Object.keys(channelQueues).includes(channel_ID)) {

		channelQueues[channel_ID] = [];
	}

	if (!Object.keys(storedGames).includes(message.guild.id)) {

		storedGames[message.guild.id] = '';
	}

	const secondArg = message.content.split(' ')[1];

	const thirdArg = message.content.split(' ')[2];

	if (storedGames[message.guild.id] === '') {
		await serversCollection.find({
			id: message.guild.id,
		}).toArray().then(async storedGuilds => {

			storedGames[message.guild.id] = storedGuilds[0].game;

		});
		if (storedGames[message.guild.id] === '' && args(message) !== 'game') {

			wrongEmbed.setTitle(`:x: You haven't set your game yet! Please ask an Admin to do !game ${avaiableGames.join(', ')}`);

			return message.channel.send(wrongEmbed);
		}
	}

	const gameName = storedGames[message.guild.id];

	const teamsArray = channelQueues[channel_ID];

	const userId = message.author.id;

	const getIDByTag = (tag) => {
		if (tag.indexOf('!') > -1) {
			return tag.substring(3, tag.length - 1);
		}
		else {
			return tag.substring(2, tag.length - 1);
		}
	};

	const teamsInsert = {
		name: messageArgs(message),
		channels: [],
		members: [
			userId,
		],
	};

	const findGuildTeams = await teamsCollection.find({
		id: message.guild.id,
	}).toArray().then(async storedTeams => {
		return storedTeams[0].teams;
	});

	const isCaptain = () => {
		for (const team of findGuildTeams) {
			if (team.members.indexOf(userId) === 0) {
				return true;
			}
		}
	};

	const teamsInfo = () => {
		for (const team of findGuildTeams) {
			if (team.members.includes(userId)) {
				return team;
			}
		}
	};

	const teamsInfoSpecific = (id) => {
		for (const team of findGuildTeams) {
			if (team.members.includes(id)) {
				return team;
			}
		}
	};

	const membersInDatabase = `teams.${findGuildTeams.indexOf(teamsInfo())}.members`;

	const membersJoinInDatabase = `teams.${findGuildTeams.indexOf(findGuildTeams.find(e => e.name === messageArgs(message)))}.members`;

	const teamsIngame = () => {
		teamsInGameVar = [];
		for (const game of ongoingGames) {
			for (const stats of game) {
				if (typeof stats.name == 'string' && game[2].guild === message.guild.id) {
					teamsInGameVar.push(stats.name);
				}
			}
		}
		return teamsInGameVar;
	};

	const givewinLose = async (score, pos) => {

		for (const games of ongoingGames) {
			for (const team of findGuildTeams) {

				if (games[pos].name === team.name && games.map(e => e.name).includes(teamsInfo().name) && games[2].guild === message.guild.id) {

					const channelPos = findGuildTeams[findGuildTeams.indexOf(team)].channels.map(e => e.channelID).indexOf(channel_ID);

					const sort = `teams.${findGuildTeams.indexOf(team)}.channels.${channelPos}.${score}`;

					const mmr = `teams.${findGuildTeams.indexOf(team)}.channels.${channelPos}.mmr`;

					await teamsCollection.update({
						id: message.guild.id,
					}, {
						$set: {
							[sort]: team.channels[channelPos][score] + 1,
							[mmr]: score === 'wins' ? team.channels[channelPos].mmr + 13 : team.channels[channelPos].mmr - 10,
						},
					});
				}
			}
		}
	};

	const revertgame = async (status, pos) => {

		const games = finishedGames.find(game => game[2].gameID === parseInt(secondArg));

		for (const team of findGuildTeams) {

			if (games[pos].name === team.name && games[2].guild === message.guild.id) {

				const channelPos = findGuildTeams[findGuildTeams.indexOf(team)].channels.map(e => e.channelID).indexOf(channel_ID);

				const win = `teams.${findGuildTeams.indexOf(team)}.channels.${channelPos}.wins`;

				const lose = `teams.${findGuildTeams.indexOf(team)}.channels.${channelPos}.losses`;

				const sort = `teams.${findGuildTeams.indexOf(team)}.channels.${channelPos}.${status}`;

				const mmr = `teams.${findGuildTeams.indexOf(team)}.channels.${channelPos}.mmr`;

				if (thirdArg === 'revert') {
					await teamsCollection.update({
						id: message.guild.id,
					}, {
						$set: {
							[win]: status === 'wins' ? team.channels[channelPos].wins + 1 : team.channels[channelPos].wins - 1,

							[lose]: status === 'losses' ? team.channels[channelPos].losses + 1 : team.channels[channelPos].losses - 1,

							[mmr]: status === 'wins' ? team.channels[channelPos].mmr + 23 : team.channels[channelPos].mmr - 23,
						},
					});
				}

				if (thirdArg === 'cancel') {
					await teamsCollection.update({
						id: message.guild.id,
					}, {
						$set: {
							[sort]: team.channels[channelPos][status] - 1,

							[mmr]: status === 'wins' ? team.channels[channelPos].mmr - 13 : team.channels[channelPos].mmr + 10,
						},
					});
				}
			}
		}

	};

	switch (args(message)) {

	case 'createteam': {

		if (messageArgs(message).length > 31) {
			wrongEmbed.setTitle(':x: Name too big! Maximum characters allowed are 32.');

			return message.channel.send(wrongEmbed);
		}

		if (messageArgs(message).length < 2) {
			wrongEmbed.setTitle(':x: Name too short! Minimum characters allowed are 3.');

			return message.channel.send(wrongEmbed);
		}

		if (findGuildTeams.map(e => e.name).includes(messageArgs(message))) {
			wrongEmbed.setTitle(':x: Name already in use');

			return message.channel.send(wrongEmbed);
		}

		if (findGuildTeams.map(e => e.members).flat().includes(userId)) {
			wrongEmbed.setTitle(':x: You already belong to a team!');

			return message.channel.send(wrongEmbed);
		}

		if (message.guild.roles.cache.array().map(e => e.name).includes(messageArgs(message))) {
			wrongEmbed.setTitle(':x: You can\'t name yourself after roles that already exist!');

			return message.channel.send(wrongEmbed);
		}

		await teamsCollection.update({
			id: message.guild.id,
		}, {
			$push: {
				teams: teamsInsert,
			},
		});

		correctEmbed.setTitle(`:white_check_mark: ${messageArgs(message)} Created!`);

		if (!message.guild.roles.cache.array().map(e => e.name).includes('Team Captain')) {

			await message.guild.roles.create({
				data: {
					hoist: false,
					name: 'Team Captain',
					color: 'GREY',
				},
				reason: 'Matchmaker Bot',
			}).catch(e => message.channel.send('Error creating role Team Captain, please check if there is already a role with that name'));
		}

		await message.guild.roles.create({
			data: {
				name: messageArgs(message),
				hoist: false,
				color: 'BLUE',
			},
			reason: 'idk lol',
		}).catch(e => message.channel.send(`Error creating role ${messageArgs(message)}, please check if there is already a role with that name`));

		await message.member.roles.add(getroleID(messageArgs(message))).catch(e => message.channel.send(`Error adding role ${messageArgs(message)}, please check if it exists`));

		await message.member.roles.add(getroleID('Team Captain')).catch(e => message.channel.send('Could not add role Team captain, make sure that the role exists and if not, ask an admin to create it'));

		return message.channel.send(correctEmbed);
	}

	case 'disband': {

		if (messageArgs(message) !== '' && message.member.hasPermission('ADMINISTRATOR')) {

			for (const team of teamsArray) {
				if (team.name === messageArgs(message)) {

					teamsArray.splice(0, teamsArray.length);
				}
			}

			for (const games of ongoingGames) {
				if (games.map(e => e.name).includes(messageArgs(message)) && games[2].guild === message.guild.id) {

					wrongEmbed.setTitle(':x: Team is in the middle of a game!');

					return message.channel.send(wrongEmbed);
				}
			}

			if (!findGuildTeams.map(e => e.name).includes(messageArgs(message))) {

				wrongEmbed.setTitle(':x: Team does not exist!');

				return message.channel.send(wrongEmbed);
			}

			await (await message.guild.members.fetch(findGuildTeams.find(e => e.name === messageArgs(message)).members[0])).roles.remove(getroleID('Team Captain')).catch(e => message.channel.send('Could not remove role Team captain, make sure that the role exists and if not, ask an admin to create it'));

			message.guild.roles.cache.find(role => role.name === messageArgs(message)).delete().catch(e => message.channel.send(`Error trying to delete role ${messageArgs(message)}`));

			await teamsCollection.update({
				id: message.guild.id,
			}, {
				$pull: {
					teams: {
						name: messageArgs(message),
					},
				},
			});

			correctEmbed.setTitle(`:white_check_mark: ${messageArgs(message)} Deleted!`);

			return message.channel.send(correctEmbed);

		}

		for (const team of teamsArray) {
			if (team.name === teamsInfo().name) {

				teamsArray.splice(0, teamsArray.length);
			}
		}

		for (const games of ongoingGames) {
			if (games.map(e => e.name).includes(messageArgs(message)) && games[2].guild === message.guild.id) {

				wrongEmbed.setTitle(':x: You are in the middle of a game!');

				return message.channel.send(wrongEmbed);
			}
		}

		if (teamsInfo() == undefined) {
			wrongEmbed.setTitle(':x: You do not belong to a team!');

			return message.channel.send(wrongEmbed);
		}

		if (!isCaptain()) {
			wrongEmbed.setTitle(':x: You are not the captain!');

			return message.channel.send(wrongEmbed);
		}

		for (const team of findGuildTeams) {
			if (team.members.indexOf(userId) === 0) {

				message.guild.roles.cache.find(role => role.name === team.name).delete().catch(e => message.channel.send(`Could not delete role ${team.name}, please check if the role exists.`));

				message.member.roles.remove(getroleID('Team Captain')).catch(e => message.channel.send('Could not remove role Team captain, make sure that the role exists and if not, ask an admin to create it'));

				await teamsCollection.update({
					id: message.guild.id,
				}, {
					$pull: {
						teams: teamsInfo(),
					},
				});

				correctEmbed.setTitle(`:white_check_mark: ${team.name} Deleted!`);

				return message.channel.send(correctEmbed);
			}
		}
	}

	case 'giveownership': {

		for (const team of teamsArray) {
			if (team.name === teamsInfo().name) {

				wrongEmbed.setTitle(':x: Please leave the queue first!');

				return message.channel.send(wrongEmbed);
			}
		}

		for (const games of ongoingGames) {
			if (games.map(e => e.name).includes(messageArgs(message)) && games[2].guild === message.guild.id) {

				wrongEmbed.setTitle(':x: You are in the middle of a game!');

				return message.channel.send(wrongEmbed);
			}
		}

		if (!isCaptain()) {
			wrongEmbed.setTitle(':x: You are not the captain!');

			return message.channel.send(wrongEmbed);
		}

		if (!teamsInfo().members.includes(getIDByTag(secondArg))) {
			wrongEmbed.setTitle(':x: User does not belong to your team!');

			return message.channel.send(wrongEmbed);
		}

		await message.member.roles.remove(getroleID('Team Captain')).catch(e => message.channel.send('Could not remove role Team captain, make sure that the role exists and if not, ask an admin to create it'));

		await (await message.guild.members.fetch(getIDByTag(secondArg))).roles.add(getroleID('Team Captain')).catch(e => message.channel.send('Could not add role Team captain, make sure that the role exists and if not, ask an admin to create it'));

		await teamsCollection.update({
			id: message.guild.id,
		}, {
			$pull: {
				[membersInDatabase]: getIDByTag(secondArg),
			},
		});

		await teamsCollection.update({
			id: message.guild.id,
		}, {
			$push: {
				[membersInDatabase]: {
					$each: [getIDByTag(secondArg)],
					$position: 0,
				},
			},
		});

		correctEmbed.setTitle(`:white_check_mark: Given ownership to ${(await fetchFromID(getIDByTag(secondArg))).username}`);

		return message.channel.send(correctEmbed);
	}

	case 'leaveteam': {

		if (!findGuildTeams.map(e => e.members).flat().includes(userId)) {
			wrongEmbed.setTitle(':x: You do not belong to a team');

			return message.channel.send(wrongEmbed);
		}

		if (isCaptain()) {
			wrongEmbed.setTitle(':x: You are the captain, to delete the team do !disband');

			return message.channel.send(wrongEmbed);
		}

		const leftTeam = teamsInfo().name;

		await message.member.roles.remove(getroleID(teamsInfo().name)).catch(e => message.channel.send(`Could not delete role ${teamsInfo().name}, please check if the role exists.`));

		await teamsCollection.update({
			id: message.guild.id,
		}, {
			$pull: {
				[membersInDatabase]: userId,
			},
		});

		correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just left ${leftTeam}`);

		return message.channel.send(correctEmbed);
	}

	case 'kickplayer': {

		if (!isCaptain()) {
			wrongEmbed.setTitle(':x: You are not the captain!');

			return message.channel.send(wrongEmbed);
		}

		if (!teamsInfo().members.includes(getIDByTag(secondArg))) {
			wrongEmbed.setTitle(':x: User does not belong to your team!');

			return message.channel.send(wrongEmbed);
		}

		if (getIDByTag(secondArg) === message.author.id) {
			wrongEmbed.setTitle(':x: You cannot kick yourself dummy!');

			return message.channel.send(wrongEmbed);
		}

		const leftTeam = teamsInfo().name;

		await message.guild.members.fetch(getIDByTag(secondArg)).then(e => {
			e.roles.remove(getroleID(teamsInfo().name)).catch(e => message.channel.send(`Could not delete role ${teamsInfo().name}, please check if the role exists.`));
		});

		await teamsCollection.update({
			id: message.guild.id,
		}, {
			$pull: {
				[membersInDatabase]: getIDByTag(secondArg),
			},
		});

		correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just kicked ${(await fetchFromID(getIDByTag(secondArg))).username} from ${leftTeam}`);

		return message.channel.send(correctEmbed);
	}

	case 'whois': {

		if (messageArgs(message) == undefined) {
			wrongEmbed.setTitle(':x: Please specify the team.');

			return message.channel.send(wrongEmbed);
		}

		if (!findGuildTeams.map(e => e.name).includes(messageArgs(message))) {
			wrongEmbed.setTitle(':x: This team doesn\'t exist');

			return message.channel.send(wrongEmbed);
		}

		wrongEmbed.setTitle(findGuildTeams[findGuildTeams.map(e => e.name).indexOf(messageArgs(message))].name);

		let memberNames = [];

		for (const id of findGuildTeams[findGuildTeams.map(e => e.name).indexOf(messageArgs(message))].members) {

			memberNames.push((await fetchFromID(id)).username);
		}

		wrongEmbed.addField('Members:', memberNames.join(', '));

		memberNames = [];

		return message.channel.send(wrongEmbed);
	}

	case 'invite': {

		if (!isCaptain()) {
			wrongEmbed.setTitle(':x: You are not the captain!');

			return message.channel.send(wrongEmbed);
		}

		if (!Object.keys(invites).includes(teamsInfo().name)) {

			invites[teamsInfo().name] = [];
		}

		if (invites[teamsInfo().name].includes(getIDByTag(secondArg))) {
			wrongEmbed.setTitle(`:x: ${ (await fetchFromID(getIDByTag(secondArg))).username} was already invited`);

			return message.channel.send(wrongEmbed);
		}

		if (findGuildTeams.map(e => e.members).flat().includes(getIDByTag(secondArg))) {
			wrongEmbed.setTitle(':x: User already belongs to a team!');

			return message.channel.send(wrongEmbed);
		}

		correctEmbed.setTitle(`:white_check_mark: Invited ${ (await fetchFromID(getIDByTag(secondArg))).username} to ${teamsInfo().name}!`);

		invites[teamsInfo().name].push(getIDByTag(secondArg));

		return message.channel.send(correctEmbed);
	}

	case 'jointeam': {

		if (findGuildTeams.map(e => e.members).flat().includes(userId)) {
			wrongEmbed.setTitle(':x: You already belong to a team!');

			return message.channel.send(wrongEmbed);
		}

		if (!findGuildTeams.map(e => e.name).includes(messageArgs(message))) {
			wrongEmbed.setTitle(':x: This team doesn\'t exist');

			return message.channel.send(wrongEmbed);
		}

		if (!Object.keys(invites).includes(messageArgs(message))) {
			wrongEmbed.setTitle(':x: This team didn\'t invite anyone!');

			return message.channel.send(wrongEmbed);
		}

		if (!invites[messageArgs(message)].includes(userId)) {
			wrongEmbed.setTitle(':x: This team didn\'t invite you!');

			return message.channel.send(wrongEmbed);
		}

		await teamsCollection.update({
			id: message.guild.id,
		}, {
			$push: {
				[membersJoinInDatabase]: userId,
			},
		});

		invites[messageArgs(message)].splice(invites[messageArgs(message)].indexOf(userId), 1);

		await message.member.roles.add(getroleID(messageArgs(message))).catch(e => `Could not add role ${messageArgs(message)}, please check if the role exists and if not create it`);

		correctEmbed.setTitle(`:white_check_mark: ${message.author.username} joined ${messageArgs(message)}!`);

		return message.channel.send(correctEmbed);
	}

	case 'game': {
		if (!avaiableGames.includes(secondArg.toLowerCase())) {

			wrongEmbed.setTitle(':x: Invalid argument');

			return message.channel.send(wrongEmbed);
		}

		if (message.member.hasPermission('ADMINISTRATOR') && avaiableGames.includes(secondArg.toLowerCase())) {

			await serversCollection.update({
				id: message.guild.id,
			}, {
				$set: {
					game: secondArg.toLowerCase(),
				},
			});

			storedGames[message.guild.id] = secondArg.toLowerCase();

			correctEmbed.setTitle(':white_check_mark: Game updated!');

			return message.channel.send(correctEmbed);
		}
	}

	case 'leave': {

		if (!isCaptain()) {
			wrongEmbed.setTitle(':x: You are not the captain!');

			return message.channel.send(wrongEmbed);
		}

		if (teamsArray.length === 2) {

			wrongEmbed.setTitle(':x: You can\'t leave now!');

			return message.channel.send(wrongEmbed);
		}

		if (teamsArray.length === 0) {

			wrongEmbed.setTitle(':x: You aren\'t in the queue!');

			return message.channel.send(wrongEmbed);

		}

		if (teamsArray[0].name === teamsInfo().name) {

			teamsArray.splice(0, teamsArray.length);

			correctEmbed.setTitle(`:white_check_mark: ${teamsInfo().name} left the queue! ${teamsArray.length}/2`);

			return message.channel.send(correctEmbed);
		}
	}

	case 'status': {

		if (teamsArray.length === 0) {
			wrongEmbed.setTitle(':x: No players in queue!');

			return message.channel.send(wrongEmbed);
		}

		correctEmbed.setTitle(`Team in queue: ${teamsArray[0].name}`);

		correctEmbed.addField('Players:', `<@${teamsArray[0].members[0]}>, <@${teamsArray[0].members[1]}>, <@${teamsArray[0].members[2]}>`);

		return message.channel.send(correctEmbed);
	}

	case 'pendinginvites': {

		if (Object.keys(invites).filter(e => invites[e].includes(userId)).length === 0) {

			wrongEmbed.setTitle(':x: You have no pending invites.');

			return message.channel.send(wrongEmbed);
		}

		wrongEmbed.setTitle('Pending Invites:');

		wrongEmbed.setDescription(Object.keys(invites).filter(e => invites[e].includes(userId)).join(', '), 'Show what you can do in order to get more invites!');

		return message.channel.send(wrongEmbed);
	}

	case 'report': {

		if (!isCaptain()) {
			wrongEmbed.setTitle(':x: You are not the captain!');

			return message.channel.send(wrongEmbed);
		}

		if (!teamsIngame().includes(teamsInfo().name) || ongoingGames.length === 0) {

			wrongEmbed.setTitle(':x: You aren\'t in a game!');

			return message.channel.send(wrongEmbed);
		}

		switch (messageEndswith(message)) {
		case 'win': {

			for (const games of ongoingGames) {

				if (games.map(e => e.name).includes(messageArgs(message)) && !games[2].guild === message.guild.id) {

					continue;
				}

				if (games[2].channel !== channel_ID) {

					wrongEmbed.setTitle(':x: This is not the correct channel to report the win/lose!');

					return message.channel.send(wrongEmbed);
				}

				correctEmbed.setTitle(':white_check_mark: Game Completed! Thank you for Playing!');

				if (teamsInGameVar.indexOf(teamsInfo().name) % 2 === 0) {

					givewinLose('wins', 0);

					givewinLose('losses', 1);
				}
				else {
					givewinLose('wins', 1);

					givewinLose('losses', 0);
				}

				const index = ongoingGames.indexOf(games);

				ongoingGames.splice(index, 1);

				for (const channel of message.guild.channels.cache.array()) {

					if (channel.name === `🔸Team-${games[0].name}-Game-${games[2].gameID}`) {
						deletableChannels.push({
							id: channel.id,
							channel: message.channel.id,
						});

					}

					if (channel.name === `🔹Team-${games[1].name}-Game-${games[2].gameID}`) {
						deletableChannels.push({
							id: channel.id,
							channel: message.channel.id,
						});

					}
				}

				games[2].winningTeam = (teamsInGameVar.indexOf(teamsInfo().name) % 2 === 0) ? 0 : 1;

				finishedGames.push(games);

				return message.channel.send(correctEmbed);
			}
		}

		case 'lose': {

			for (const games of ongoingGames) {

				if (games.map(e => e.name).includes(messageArgs(message)) && !games[2].guild === message.guild.id) {

					continue;
				}

				if (games[2].channel !== channel_ID) {

					wrongEmbed.setTitle(':x: This is not the correct channel to report the win/lose!');

					return message.channel.send(wrongEmbed);
				}

				correctEmbed.setTitle(':white_check_mark: Game Completed! Thank you for Playing!');

				if (teamsInGameVar.indexOf(teamsInfo().name) % 2 === 0) {

					givewinLose('wins', 1);

					givewinLose('losses', 0);
				}
				else {
					givewinLose('wins', 0);

					givewinLose('losses', 1);
				}

				const index = ongoingGames.indexOf(games);

				ongoingGames.splice(index, 1);

				for (const channel of message.guild.channels.cache.array()) {

					if (channel.name === `🔸Team-${games[0].name}-Game-${games[2].gameID}`) {
						deletableChannels.push({
							id: channel.id,
							channel: message.channel.id,
						});

					}

					if (channel.name === `🔹Team-${games[1].name}-Game-${games[2].gameID}`) {
						deletableChannels.push({
							id: channel.id,
							channel: message.channel.id,
						});

					}
				}

				games[2].winningTeam = (teamsInGameVar.indexOf(teamsInfo().name) % 2 === 0) ? 1 : 0;

				finishedGames.push(games);

				return message.channel.send(correctEmbed);
			}
		}
		default: {
			wrongEmbed.setTitle(':x: Invalid Parameters!');
			return message.channel.send(wrongEmbed);
		}
		}
	}

	case 'revertgame': {

		if (message.content.split(' ').length == 1 || message.content.split(' ').length == 2) {

			wrongEmbed.setTitle(':x: Invalid Parameters!');

			return message.channel.send(wrongEmbed);
		}

		if (!message.member.hasPermission('ADMINISTRATOR')) {

			wrongEmbed.setTitle(':x: You do not have Administrator permission!');

			return message.channel.send(wrongEmbed);
		}

		if (!finishedGames.map(e => e[2].gameID).includes(parseInt(secondArg))) {
			wrongEmbed.setTitle(':x: No game with that ID has been played');

			return message.channel.send(wrongEmbed);
		}

		const selectedGame = finishedGames.find(e => e[2].gameID === parseInt(secondArg));

		if (selectedGame[2].guild !== message.guild.id) {
			wrongEmbed.setTitle(':x: That game hasn\'t been played in this server');

			return message.channel.send(wrongEmbed);
		}

		if (thirdArg === 'revert') {

			if (selectedGame[2].winningTeam === 0) {

				revertgame('losses', 0);

				revertgame('wins', 1);
			}
			else {

				revertgame('losses', 1);

				revertgame('wins', 0);
			}
		}
		else if (thirdArg === 'cancel') {

			if (selectedGame[2].winningTeam === 0) {

				for (i = 0; i < 3; i++) {
					revertgame('wins', 0);
				}
				for (i = 3; i < 6; i++) {
					revertgame('losses', 1);
				}
			}
			else {

				for (i = 3; i < 6; i++) {
					revertgame('wins', 1);
				}
				for (i = 0; i < 3; i++) {
					revertgame('losses', 0);
				}
			}

		}
		else {
			wrongEmbed.setTitle(':x: Invalid Parameters!');

			return message.channel.send(wrongEmbed);
		}

		const index = finishedGames.indexOf(selectedGame);

		finishedGames.splice(index, 1);

		correctEmbed.setTitle(`:white_check_mark: Game ${thirdArg === 'revert' ? 'reverted' : 'cancelled'}!`);

		return message.channel.send(correctEmbed);

	}

	case 'cancel': {

		if (!isCaptain()) {
			wrongEmbed.setTitle(':x: You are not the captain!');

			return message.channel.send(wrongEmbed);
		}

		if (!teamsIngame().includes(teamsInfo().name) || ongoingGames.length === 0) {

			wrongEmbed.setTitle(':x: You aren\'t in a game!');

			return message.channel.send(wrongEmbed);
		}

		for (const games of ongoingGames) {

			if (games.map(e => e.name).includes(messageArgs(message)) && !games[2].guild === message.guild.id) {

				continue;
			}

			const IDGame = games[2].gameID.toString();

			if (!Object.keys(cancelQueue).includes(IDGame)) {

				cancelQueue[IDGame] = [];
			}

			const cancelqueuearray = cancelQueue[IDGame];

			if (cancelqueuearray.includes(teamsInfo().name)) {
				wrongEmbed.setTitle(':x: You\'ve already voted to cancel!');

				return message.channel.send(wrongEmbed);
			}

			cancelqueuearray.push(teamsInfo().name);

			wrongEmbed.setTitle(`:exclamation: ${teamsInfo().name} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/2)`);

			message.channel.send(wrongEmbed);

			if (cancelqueuearray.length === 2) {

				for (const channel of message.guild.channels.cache.array()) {

					if (channel.name === `🔸Team-${games[0].name}-Game-${IDGame}`) {

						channel.delete();
					}

					if (channel.name === `🔹Team-${games[1].name}-Game-${IDGame}`) {

						channel.delete();
					}
				}

				correctEmbed.setTitle(`:white_check_mark: Game ${IDGame} Cancelled!`);

				const index = ongoingGames.indexOf(games);

				cancelQueue[IDGame] = [];

				ongoingGames.splice(index, 1);

				return message.channel.send(correctEmbed);
			}

		}
	}

	case 'score': {
		switch (secondArg) {
		case 'me': {
			if (!findGuildTeams.map(e => e.name).includes(teamsInfo().name)) {

				wrongEmbed.setTitle(':x: You haven\'t played any games yet!');

				return message.channel.send(wrongEmbed);
			}

			for (let j = 0; j < findGuildTeams.length; j++) {

				if (findGuildTeams[j].name === teamsInfo().name) {

					const scoreDirectory = findGuildTeams[j].channels[findGuildTeams[j].channels.map(e => e.channelID).indexOf(message.channel.id)];

					if (scoreDirectory === undefined) {

						wrongEmbed.setTitle(':x: You haven\'t played any games in here yet!');

						return message.channel.send(wrongEmbed);
					}

					correctEmbed.addField('Wins:', scoreDirectory.wins);

					correctEmbed.addField('Losses:', scoreDirectory.losses);

					correctEmbed.addField('Winrate:', isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)) ? '0%' : Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100) + '%');

					correctEmbed.addField('MMR:', scoreDirectory.mmr);

					return message.channel.send(correctEmbed);
				}
			}
		}

		case 'channel': {
			const getScore = (id, arg) => {
				const teamScores = findGuildTeams.filter(a => a.channels.map(e => e.channelID).indexOf(id) !== -1 && a.channels[a.channels.map(e => e.channelID).indexOf(id)].wins + a.channels[a.channels.map(e => e.channelID).indexOf(id)].losses !== 0);

				if (teamScores.length === 0) {
					wrongEmbed.setTitle(':x: No games have been played in here!');

					return message.channel.send(wrongEmbed);
				}

				teamScores.sort((a, b) => {
					const indexA = a.channels.map(e => e.channelID).indexOf(id);

					const indexB = b.channels.map(e => e.channelID).indexOf(id);

					return b.channels[indexB].mmr - a.channels[indexA].mmr;
				});

				if (!isNaN(arg) && arg > 0) {
					let indexes = 20 * (arg - 1);
					for (indexes; indexes < 20 * arg; indexes++) {
						if (teamScores[indexes] == undefined) {

							correctEmbed.addField('No more teams to list in this page!', 'Encourage your friends to play!');

							break;
						}
						for (const channels of teamScores[indexes].channels) {
							if (channels.channelID === id) {

								correctEmbed.addField(teamScores[indexes].name, `Wins: ${channels.wins} | Losses: ${channels.losses} | Winrate: ${isNaN(Math.floor((channels.wins / (channels.wins + channels.losses)) * 100)) ? '0' : Math.floor((channels.wins / (channels.wins + channels.losses)) * 100)}% | MMR: ${channels.mmr}`);

								correctEmbed.setFooter(`Showing page ${arg}/${Math.ceil(teamScores.length / 20)}`);
							}
						}
					}
				}
				else {
					for (i = 0; i < 20; i++) {
						if (teamScores[i] == undefined) {
							correctEmbed.addField('No more teams to list in this page!', 'Encourage your friends to play!');
							break;
						}
						for (const channels of teamScores[i].channels) {
							if (channels.channelID === id) {

								correctEmbed.addField(teamScores[i].name, `Wins: ${channels.wins} | Losses: ${channels.losses} | Winrate: ${isNaN(Math.floor((channels.wins / (channels.wins + channels.losses)) * 100)) ? '0' : Math.floor((channels.wins / (channels.wins + channels.losses)) * 100)}% | MMR: ${channels.mmr}`);

								correctEmbed.setFooter(`Showing page ${arg}/${Math.ceil(teamScores.length / 20)}`);
							}
						}
					}
				}
				message.channel.send(correctEmbed);
			};
			if (!isNaN(thirdArg) && parseInt(thirdArg) > 10000) {
				return getScore(thirdArg, fourthArg);
			}
			else {
				return getScore(channel_ID, thirdArg);
			}
		}
		}
		break;
	}

	case 'ongoinggames': {

		if (ongoingGames.length === 0) {
			wrongEmbed.setTitle(':x: No games are currently having place!');

			return message.channel.send(wrongEmbed);
		}

		for (i = 0; i < 20; i++) {

			const game = ongoingGames[i];

			if (game == undefined) {
				wrongEmbed.addField('No more games to list ', 'Encourage your friends to play!');
				break;
			}

			if (game[2].channel === channel_ID) {

				wrongEmbed.addField('Game :', game[2].gameID);

				wrongEmbed.addField(`🔸 Team: ${game[0].name}`, `<@${game[0].members[0]}>, <@${game[0].members[1]}>, <@${game[0].members[2]}>, <@${game[0].members[3]}>, <@${game[0].members[4]}>`);
				wrongEmbed.addField(`🔹 Team: ${game[1].name}`, `<@${game[1].members[0]}>, <@${game[1].members[1]}>, <@${game[1].members[2]}>, <@${game[1].members[3]}>, <@${game[1].members[4]}>`);

				wrongEmbed.setFooter(`Showing page ${1}/${Math.ceil(ongoingGames.length / 20)}`);
			}
		}
		return message.channel.send(wrongEmbed);
	}

	case 'reset': {
		if (message.content.split(' ').length === 1) {

			wrongEmbed.setTitle(':x: Invalid Parameters!');

			return message.channel.send(wrongEmbed);
		}

		if (!message.member.hasPermission('ADMINISTRATOR')) {

			wrongEmbed.setTitle(':x: You do not have Administrator permission!');

			return message.channel.send(wrongEmbed);
		}

		switch (secondArg) {
		case 'channel': {
			if (message.content.split(' ').length !== 2) {

				wrongEmbed.setTitle(':x: Invalid Parameters!');

				return message.channel.send(wrongEmbed);
			}

			for (const games of ongoingGames) {
				if (games[2].channel === channel_ID) {

					wrongEmbed.setTitle(':x: Team is in the middle of a game!');

					return message.channel.send(wrongEmbed);
				}
			}

			for (const team of findGuildTeams) {

				const channelPos = team.channels.map(e => e).map(e => e.channelID).indexOf(channel_ID);

				if (channelPos !== -1) {
					await teamsCollection.update({
						id: message.guild.id,
					}, {
						$pull: {
							[`teams.${findGuildTeams.indexOf(team)}.channels`]: {
								channelID: channel_ID,
							},
						},
					});
				}

			}

			for (const game of finishedGames) {
				if (game[2].channel === channel_ID) {

					finishedGames.splice(finishedGames.indexOf(game), 1);
				}
			}

			correctEmbed.setTitle(':white_check_mark: Team\'s score reset!');

			return message.channel.send(correctEmbed);
		}
		case 'team': {

			for (const games of ongoingGames) {
				if (games.map(e => e.name).includes(messageArgs(thirdArg)) && games[2].guild === message.guild.id) {

					wrongEmbed.setTitle(':x: Team is in the middle of a game!');

					return message.channel.send(wrongEmbed);
				}
			}

			if (message.content.split(' ').length !== 3) {

				wrongEmbed.setTitle(':x: Invalid Parameters!');

				return message.channel.send(wrongEmbed);

			}

			const channelPos = findGuildTeams[findGuildTeams.map(e => e.name).indexOf(thirdArg)].channels.map(e => e.channelID).indexOf(channel_ID);

			if (channelPos == -1) {

				wrongEmbed.setTitle(':x: This team hasn\'t played any games in this channel!');

				return message.channel.send(wrongEmbed);
			}
			else {

				const channelsInDatabase = `teams.${findGuildTeams.map(e=> e.name).indexOf(thirdArg)}.channels`;

				await teamsCollection.update({
					id: message.guild.id,
				}, {
					$pull: {
						[channelsInDatabase]: {
							channelID: channel_ID,
						},
					},
				});
			}

			correctEmbed.setTitle(':white_check_mark: Team\'s score reset!');

			return message.channel.send(correctEmbed);
		}
		default: {
			wrongEmbed.setTitle(':x: Invalid Parameters!');

			return message.channel.send(wrongEmbed);
		}
		}
	}

	case 'q': {

		if (!isCaptain()) {
			wrongEmbed.setTitle(':x: You are not the captain/dont belong to a team!');

			return message.channel.send(wrongEmbed);
		}

		for (const team of teamsArray) {
			if (team.name === teamsInfo().name) {

				wrongEmbed.setTitle(':x: You\'re already in the queue!');

				return message.channel.send(wrongEmbed);
			}
		}

		if (Object.values(channelQueues).flat().map(e => e.members).flat().includes(userId)) {
			wrongEmbed.setTitle(':x: You\'re already queued in another channel!');

			return message.channel.send(wrongEmbed);
		}

		for (const games of ongoingGames) {
			if (games.map(e => e.name).includes(teamsInfo().name) && games[2].guild === message.guild.id) {

				wrongEmbed.setTitle(':x: You are in the middle of a game!');

				return message.channel.send(wrongEmbed);
			}
		}

		if (teamsInfo().members.length < 5) {

			wrongEmbed.setTitle(':x: You need at least 5 members on your team to join the queue (including you)');

			return message.channel.send(wrongEmbed);
		}

		if (message.content.split(' ').length !== 5) {

			wrongEmbed.setTitle(':x: Please tag 4 teammates that you want to play with');

			return message.channel.send(wrongEmbed);
		}

		for (const user of message.content.split(' ').splice(1, 4)) {
			if (!teamsInfo().members.includes(getIDByTag(user))) {
				wrongEmbed.setTitle(`:x: ${(await fetchFromID(getIDByTag(user))).username} is not in your team!`);

				return message.channel.send(wrongEmbed);
			}
		}

		if (message.content.split(' ').length > 5) {
			wrongEmbed.setTitle(':x: Please tag your 4 other teammates');

			return message.channel.send(wrongEmbed);
		}

		const toPush = {
			name: teamsInfo().name,
			members: [
				userId,
				getidByTag(message.content.splice(' ')[1]),
				getidByTag(message.content.splice(' ')[2]),
				getidByTag(message.content.splice(' ')[3]),
				getidByTag(message.content.splice(' ')[4]),
			],
			time: new Date(),
		};

		teamsArray.push(toPush);

		correctEmbed.setTitle(`:white_check_mark: Added to queue! ${teamsArray.length}/2`);

		message.channel.send(correctEmbed);

		if (teamsArray.length === 2) {

			const valuesforpm = {
				name: Math.floor(Math.random() * 99999) + 100,
				password: Math.floor(Math.random() * 99999) + 100,
			};

			shuffle(teamsArray);

			gameCount++;

			teamsArray.push({
				gameID: gameCount,
				channel: channel_ID,
				guild: message.guild.id,
				time: new Date(),
			});

			for (const team of teamsArray) {
				if (team.gameID !== undefined) {

					break;
				}
				const channelsInDatabaseSpecific = `teams.${findGuildTeams.indexOf(teamsInfoSpecific(team.members[0]))}.channels`;

				if (!findGuildTeams[findGuildTeams.map(e => e.name).indexOf(team.name)].channels.map(e => e.channelID).includes(channel_ID)) {

					(async function() {
						await teamsCollection.update({
							id: message.guild.id,
						}, {
							$push: {
								[channelsInDatabaseSpecific]: {
									channelID: channel_ID,
									wins: 0,
									losses: 0,
									mmr: 1000,
								},
							},
						});
					})();
				}
			}

			message.channel.send(`<@${teamsArray[0].members[0]}>, <@${teamsArray[0].members[1]}>, <@${teamsArray[0].members[2]}>, <@${teamsArray[0].members[3]}>, <@${teamsArray[0].members[4]}>, <@${teamsArray[1].members[0]}>, <@${teamsArray[1].members[1]}>, <@${teamsArray[1].members[2]}>, <@${teamsArray[1].members[3]}>, <@${teamsArray[1].members[4]}>`);

			ongoingGames.push([...teamsArray]);

			const discordEmbed1 = new Discord.MessageEmbed()
				.setColor(EMBED_COLOR_CHECK)
				.addField('Game is ready:', `Game ID is: ${gameCount}`)
				.addField(`:small_orange_diamond: Team ${teamsArray[0].name}`, `<@${teamsArray[0].members[0]}>, <@${teamsArray[0].members[1]}>, <@${teamsArray[0].members[2]}>, <@${teamsArray[0].members[3]}>, <@${teamsArray[0].members[4]}>,`)
				.addField(`:small_blue_diamond: Team ${teamsArray[1].name}`, `<@${teamsArray[1].members[0]}>, <@${teamsArray[1].members[1]}>, <@${teamsArray[1].members[2]}>, <@${teamsArray[1].members[3]}>, <@${teamsArray[1].members[4]}>`);

			if (gameName !== 'leagueoflegends') {

				discordEmbed1.addField(`Map: ${gameName === 'valorant' ? valorantMaps[Math.floor(Math.random() * valorantMaps.length) ] : gameName === 'valorant' ? CSGOMaps[Math.floor(Math.random() * CSGOMaps.length)] : gameName === 'r6' ? R6Maps[Math.floor(Math.random() * R6Maps.length)] : 'You got this'}`, 'Please organize a match with your teammates and opponents. Team 1 attacks and Team 2 defends. Good luck!');
			}

			message.channel.send(discordEmbed1);

			if (gameName === 'leagueoflegends') {
				userIDsPM.push(teamsArray[0].members[1], teamsArray[0].members[2], teamsArray[0].members[3], teamsArray[0].members[4], teamsArray[1].members[0], teamsArray[1].members[1], teamsArray[1].members[2], teamsArray[1].members[3], teamsArray[1].members[4]);

				const JoinMatchEmbed = new Discord.MessageEmbed()
					.setColor(EMBED_COLOR_CHECK)
					.addField('Name:', valuesforpm.name)
					.addField('Password:', valuesforpm.password)
					.addField('You have to:', `Join match(Created by ${(await fetchFromID(teamsArray[0].members[0])).username})`);

				for (const user of userIDsPM) {

					const create0 = await client.users.fetch(user);
					create0.send(JoinMatchEmbed).catch(error => {
						const errorEmbed = new Discord.MessageEmbed()
							.setColor(EMBED_COLOR_ERROR)
							.setTitle(`:x: Couldn't sent message to ${users}, please check if your DM'S aren't set to friends only.`);

						console.error(error);

						message.channel.send(errorEmbed);
					});
				}

				userIDsPM = [];

				const CreateMatchEmbed = new Discord.MessageEmbed()
					.setColor(EMBED_COLOR_CHECK)
					.addField('Name:', valuesforpm.name)
					.addField('Password:', valuesforpm.password)
					.addField('You have to:', 'Create Custom Match');

				const create1 = await client.users.fetch(teamsArray[0].members[0]);
				create1.send(CreateMatchEmbed).catch(error => {
					const errorEmbed = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_ERROR)
						.setTitle(`:x: Couldn't sent message to ${fetchFromID(teamsArray[0].members[0])}, please check if your DM'S aren't set to friends only.`);

					message.channel.send(errorEmbed);
					console.error(error);
				});
			}

			message.guild.channels.create(`🔸Team-${teamsArray[0].name}-Game-${gameCount}`, {
				type: 'voice',
				parent: message.channel.parentID,
				permissionOverwrites: [{
					id: message.guild.id,
					deny: 'CONNECT',
				},
				{
					id: teamsArray[0].members[0],
					allow: 'CONNECT',
				},
				{
					id: teamsArray[0].members[1],
					allow: 'CONNECT',
				},
				{
					id: teamsArray[0].members[2],
					allow: 'CONNECT',
				},
				{
					id: teamsArray[0].members[3],
					allow: 'CONNECT',
				},
				{
					id: teamsArray[0].members[4],
					allow: 'CONNECT',
				},
				],
			})
				.catch(error => {
					const errorEmbed = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_ERROR)
						.setTitle(':x: You shouldn\'t be getting this message, if you do tag tweeno');

					message.channel.send(errorEmbed);
					console.error(error);
				});

			message.guild.channels.create(`🔹Team-${teamsArray[1].name}-Game-${gameCount}`, {
				type: 'voice',
				parent: message.channel.parentID,
				permissionOverwrites: [{
					id: message.guild.id,
					deny: 'CONNECT',
				},
				{
					id: teamsArray[1].members[0],
					allow: 'CONNECT',
				},
				{
					id: teamsArray[1].members[1],
					allow: 'CONNECT',
				},
				{
					id: teamsArray[1].members[2],
					allow: 'CONNECT',
				},
				{
					id: teamsArray[1].members[3],
					allow: 'CONNECT',
				},
				{
					id: teamsArray[1].members[4],
					allow: 'CONNECT',
				},
				],
			})
				.catch(error => {
					const errorEmbed = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_ERROR)
						.setTitle(':x: You shouldn\'t be getting this message, if you do tag tweeno');

					message.channel.send(errorEmbed);
					console.error(error);
				});

			teamsArray.splice(0, teamsArray.length);
		}
	}
	}
};

module.exports = {
	name: ['q', 'status', 'leave', 'report', 'score', 'cancel', 'reset', 'game', 'ongoinggames', 'createteam', 'invite', 'disband', 'jointeam', 'pendinginvites', 'leaveteam', 'whois', 'kickplayer', 'revertgame', 'giveownership'],
	description: '6man bot',
	execute,
};