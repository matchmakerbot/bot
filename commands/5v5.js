const Discord = require('discord.js');

const client = require('../client.js');

const MongoDB = require('../mongodb');

const db = MongoDB.getDB();

const dbCollection = db.collection('sixman');

const serversCollection = db.collection('guilds');

const rc = ['r', 'c'];

const valorantMaps = ['Haven', 'Bind', 'Split'];

const R6Maps = ['Bank', 'House', 'Club', 'Consulate', 'Kafe', 'Coastline'];

const CSGOMaps = ['Cache', 'Dust II', 'Inferno', 'Mirage', 'Train'];

const avaiableGames = ['valorant', 'csgo', 'leagueoflegends', 'r6'];

const EMBED_COLOR_ERROR = '#F8534F';

const EMBED_COLOR_CHECK = '#77B255';

const EMBED_COLOR_WARNING = '#77B255';

const ongoingGames = [];

const finishedGames = [];

const usedNums = [];

const deletableChannels = []

const channelQueues = {};

const cancelQueue = {};

const tempObject = {};

const storedGames = {};

let gameCount = 0;

let hasVoted = false;

setInterval(async () => {

	let embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING);

	if (Object.entries(channelQueues).length !== 0) {
		for (const channel of Object.values(channelQueues)) {
			for (const user of channel) {
				if ((Date.now() - user.date) > 45 * 60 * 1000) {
					if (channel.length > 5) {
						continue
					}

					const actualChannel = await client.channels.fetch(Object.keys(channelQueues).find(key => channelQueues[key] === channel));

					embedRemove.setTitle('You were removed from the queue after no game has been made in 45 minutes!');

					actualChannel.send(`<@${user.id}>`);

					actualChannel.send(embedRemove);

					embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING);

					channel.splice(channel.indexOf(user), 1);
				}
			}
		}
	}

	if (ongoingGames.length !== 0) {
		for (const games of ongoingGames) {
			if ((Date.now() - games[10].time) > 3 * 60 * 60 * 1000) {
				for (const channel of await client.channels.fetch(games[10].channelID).then(e => e.guild.channels.cache.array())) {

					if (channel.name === `🔸Team-1-Game-${games[10].gameID}`) {

						channel.delete();
					}

					if (channel.name === `🔹Team-2-Game-${games[10].gameID}`) {

						channel.delete();
					}
				}

				embedRemove.setTitle(`Game ${games[10].gameID} Cancelled due to not being finished in 3 Hours!`);

				const index = ongoingGames.indexOf(games);

				ongoingGames.splice(index, 1);

				const a = await client.channels.fetch(games[10].channelID);

				a.send(embedRemove);

				embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING);
			}
		}
	}

	for (let voiceChannel of deletableChannels) {

		const getVoiceChannel = await client.channels.fetch(voiceChannel.channel).then(e => e.guild.channels.cache.array().find(channel => channel.id === voiceChannel.id))

		if (getVoiceChannel.members.array().length === 0) {

			getVoiceChannel.delete()

			deletableChannels.splice(deletableChannels.indexOf(voiceChannel), 1)
		}
	}
}, 60 * 1000);

const shuffle = function (array) {

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

function messageEndswith(message) {

	const split = message.content.split(' ');
	return split[split.length - 1];
}

const args = message => {
	const arraywords = message.content.split(' ');
	return arraywords[0].substring(1);
};

const execute = async (message) => {

	const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

	const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

	const secondArg = message.content.split(' ')[1];

	const thirdArg = message.content.split(' ')[2];

	const fourthArg = message.content.split(' ')[3];

	const channel_ID = message.channel.id;

	const givewinLose = async (score) => {

		for (const games of ongoingGames) {

			if (!games.map(e => e.id).includes(userId)) {

				continue;
			}

			const userid = games[i].id;

			await dbCollection.find({
				id: userid,
			}).toArray().then(async storedUsers => {

				const channelPos = storedUsers[0].servers.map(e => e.channelID).indexOf(channel_ID);

				const sort = `servers.${channelPos}.${score}`;

				const mmr = `servers.${channelPos}.mmr`;


				await dbCollection.update({
					id: userid,
				}, {
					$set: {
						[sort]: storedUsers[0].servers[channelPos][score] + 1,
						[mmr]: score === 'wins' ? storedUsers[0].servers[channelPos].mmr + 13 : storedUsers[0].servers[channelPos].mmr - 10,
					},
				});
			});
		}
	};

	const revertgame = async status => {

		const games = finishedGames.find(game => game[10].gameID === parseInt(secondArg))

		const userid = games[i].id;

		await dbCollection.find({
			id: userid,
		}).toArray().then(async storedUsers => {

			const channelPos = storedUsers[0].servers.map(e => e.channelID).indexOf(channel_ID);

			const win = `servers.${channelPos}.wins`;

			const lose = `servers.${channelPos}.losses`;

			const sort = `servers.${channelPos}.${status}`;

			const mmr = `servers.${channelPos}.mmr`;

			if (thirdArg === 'revert') {
				await dbCollection.update({
					id: userid,
				}, {
					$set: {
						[win]: status === 'wins' ? storedUsers[0].servers[channelPos].wins + 1 : storedUsers[0].servers[channelPos].wins - 1,

						[lose]: status === 'losses' ? storedUsers[0].servers[channelPos].losses + 1 : storedUsers[0].servers[channelPos].losses - 1,

						[mmr]: status === 'wins' ? storedUsers[0].servers[channelPos].mmr + 23 : storedUsers[0].servers[channelPos].mmr - 23,
					},
				});
			}

			if (thirdArg === 'cancel') {
				await dbCollection.update({
					id: userid,
				}, {
					$set: {
						[sort]: storedUsers[0].servers[channelPos][status] - 1,

						[mmr]: status === 'wins' ? storedUsers[0].servers[channelPos].mmr - 13 : storedUsers[0].servers[channelPos].mmr + 10,
					},
				});
			}
		});

	};

	if (!Object.keys(channelQueues).includes(channel_ID)) {

		channelQueues[channel_ID] = [];
	}

	if (!Object.keys(storedGames).includes(message.guild.id)) {

		storedGames[message.guild.id] = '';
	}

	const fetchFromID = async (id) => {
		return (await client.users.fetch(id).catch(error => {
			wrongEmbed.setTitle('Please tag the user');
			console.log(error);
			message.channel.send(wrongEmbed);
		}));
	};

	const queueArray = channelQueues[channel_ID];

	const userId = message.author.id;

	const includesUserID = (array) => array.map(e => e.id).includes(userId);

	const toAdd = {
		id: userId,
		name: message.author.username,
		date: new Date(),
	};

	const index = queueArray.map(e => e.id).indexOf(userId);

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

	switch (args(message)) {

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

			for (const captainGames of Object.values(tempObject).flat()) {
				if (includesUserID(captainGames)) {

					wrongEmbed.setTitle(':x: You can\'t leave now!');

					return message.channel.send(wrongEmbed);
				}
			}
			if (queueArray.length === 10) {

				wrongEmbed.setTitle(':x: You can\'t leave now!');

				return message.channel.send(wrongEmbed);
			}

			if (index === -1) {

				wrongEmbed.setTitle(':x: You aren\'t in the queue!');

				return message.channel.send(wrongEmbed);
			}

			queueArray.splice(index, 1);

			correctEmbed.setTitle(`:white_check_mark: ${message.author.username} left the queue! ${queueArray.length}/10`);

			return message.channel.send(correctEmbed);
		}

		case 'status': {

			correctEmbed.setTitle(`Players in queue: ${queueArray.length}`);

			correctEmbed.setDescription(queueArray.map(e => e.name).join(', '));

			return message.channel.send(correctEmbed);
		}

		case 'report': {
			switch (messageEndswith(message)) {
				case 'win': {

					if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

						wrongEmbed.setTitle(':x: You aren\'t in a game!');

						return message.channel.send(wrongEmbed);
					}

					for (const games of ongoingGames) {

						if (!includesUserID(games)) {

							continue;
						}

						
						if(games[10].channelID !== channel_ID) {

							wrongEmbed.setTitle(':x: This is not the correct channel to report the win/lose!');

							return message.channel.send(wrongEmbed);
						}

						const indexplayer = games.map(e => e.id).indexOf(userId);

						if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2 || indexplayer === 3 || indexplayer === 4) {
							for (i = 0; i < 5; i++) {
								givewinLose('wins');
							}
							for (i = 5; i < 10; i++) {
								givewinLose('losses');
							}
						}

						if (indexplayer === 5 || indexplayer === 6 || indexplayer === 7 || indexplayer === 8 || indexplayer === 9) {
							for (i = 5; i < 10; i++) {
								givewinLose('wins');
							}
							for (i = 0; i < 5; i++) {
								givewinLose('losses');
							}
						}

						const index = ongoingGames.indexOf(games);

						ongoingGames.splice(index, 1);

						for (const channel of message.guild.channels.cache.array()) {

							if (channel.name === `🔸Team-1-Game-${games[10].gameID}`) {
								deletableChannels.push({
									id: channel.id,
									channel: message.channel.id
								})

							}

							if (channel.name === `🔹Team-2-Game-${games[10].gameID}`) {
								deletableChannels.push({
									id: channel.id,
									channel: message.channel.id
								})

							}
						}
						
						correctEmbed.setTitle(':white_check_mark: Game Completed! Thank you for Playing!');

						return message.channel.send(correctEmbed);
					}
				}

				case 'lose': {

					if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

						wrongEmbed.setTitle(':x: You aren\'t in a game!');

						return message.channel.send(wrongEmbed);
					}

					for (const games of ongoingGames) {

						if (!includesUserID(games)) {

							continue;
						}

						if(games[10].channelID !== channel_ID) {

							wrongEmbed.setTitle(':x: This is not the correct channel to report the win/lose!');

							return message.channel.send(wrongEmbed);
						}

						const indexplayer = games.map(e => e.id).indexOf(userId);

						if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2 || indexplayer === 3 || indexplayer === 4) {
							for (i = 0; i < 5; i++) {
								givewinLose('losses');
							}
							for (i = 5; i < 10; i++) {
								givewinLose('wins');
							}
						}

						if (indexplayer === 5 || indexplayer === 6 || indexplayer === 7 || indexplayer === 8 || indexplayer === 9) {
							for (i = 5; i < 10; i++) {
								givewinLose('losses');
							}
							for (i = 0; i < 5; i++) {
								givewinLose('wins');
							}
						}

						games[10].winningTeam = (indexplayer === 0 || indexplayer === 1 || indexplayer === 2) ? 0 : 1;

						finishedGames.push(games);

						const index = ongoingGames.indexOf(games);

						ongoingGames.splice(index, 1);

						for (const channel of message.guild.channels.cache.array()) {

							if (channel.name === `🔸Team-1-Game-${games[10].gameID}`) {
								deletableChannels.push({
									id: channel.id,
									channel: message.channel.id
								})

							}

							if (channel.name === `🔹Team-2-Game-${games[10].gameID}`) {
								deletableChannels.push({
									id: channel.id,
									channel: message.channel.id
								})

							}
						}

						correctEmbed.setTitle(':white_check_mark: Game Completed! Thank you for Playing!');

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

			if (!finishedGames.map(e => e[10].gameID).includes(parseInt(secondArg))) {
				wrongEmbed.setTitle(':x: No game with that ID has been played');

				return message.channel.send(wrongEmbed);
			}

			const selectedGame = finishedGames.find(e => e[10].gameID === parseInt(secondArg));

			if (selectedGame[10].channelID !== channel_ID) {
				wrongEmbed.setTitle(':x: That game hasn\'t been played in this channel');

				return message.channel.send(wrongEmbed);
			}

			if (thirdArg === 'revert') {

				if (selectedGame[10].winningTeam === 0) {

					for (i = 0; i < 5; i++) {
						revertgame('losses');
					}
					for (i = 5; i < 10; i++) {
						revertgame('wins');
					}
				} else {

					for (i = 5; i < 10; i++) {
						revertgame('losses');
					}
					for (i = 5; i < 10; i++) {
						revertgame('wins');

					}
				}
			} else if (thirdArg === 'cancel') {

				if (selectedGame[10].winningTeam === 0) {

					for (i = 0; i < 5; i++) {
						revertgame('wins');
					}
					for (i = 5; i < 10; i++) {
						revertgame('losses');
					}
				} else {

					for (i = 5; i < 10; i++) {
						revertgame('wins');
					}
					for (i = 0; i < 5; i++) {
						revertgame('losses');
					}
				}

			} else {
				wrongEmbed.setTitle(':x: Invalid Parameters!');

				return message.channel.send(wrongEmbed);
			}

			const index = finishedGames.indexOf(selectedGame);

			finishedGames.splice(index, 1);

			correctEmbed.setTitle(`:white_check_mark: Game ${thirdArg === 'revert' ? 'reverted' : 'cancelled'}!`);

			return message.channel.send(correctEmbed);

		}

		case 'cancel': {
			if (!includesUserID(ongoingGames.flat()) || ongoingGames.length === 0) {

				wrongEmbed.setTitle(':x: You aren\'t in a game!');

				return message.channel.send(wrongEmbed);
			}
			for (const games of ongoingGames) {

				if (!includesUserID(games)) {

					continue;
				}

				const IDGame = games[10].gameID;

				const index = games.map(e => e.id).indexOf(userId);

				if (!Object.keys(cancelQueue).includes(IDGame.toString())) {

					cancelQueue[IDGame] = [];
				}

				const cancelqueuearray = cancelQueue[IDGame];

				if (cancelqueuearray.includes(userId)) {
					wrongEmbed.setTitle(':x: You\'ve already voted to cancel!');

					return message.channel.send(wrongEmbed);
				}

				cancelqueuearray.push(userId);

				correctEmbed.setTitle(`:exclamation: ${games[index].name} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/6)`);

				message.channel.send(correctEmbed);

				if (cancelqueuearray.length === 6) {

					for (const channel of message.guild.channels.cache.array()) {

						if (channel.name === `🔸Team-1-Game-${games[10].gameID}`) {

							channel.delete();
						}

						if (channel.name === `🔹Team-2-Game-${games[10].gameID}`) {

							channel.delete();
						}
					}

					correctEmbed.setTitle(`:white_check_mark: Game ${games[10].gameID} Cancelled!`);

					const index = ongoingGames.indexOf(games);

					cancelQueue[IDGame] = [];

					ongoingGames.splice(index, 1);

					return message.channel.send(correctEmbed);
				}

			}
			break;
		}

		case 'score': {
			switch (secondArg) {
				case 'me': {
					await dbCollection.find({
						id: userId,
						servers: {
							$elemMatch: {
								channelID: channel_ID,
							},
						},
					}).toArray().then(storedUsers => {
						if (storedUsers.length === 0) {

							wrongEmbed.setTitle(':x: You haven\'t played any games yet!');

							return message.channel.send(wrongEmbed);
						}

						const scoreDirectory = storedUsers[0].servers[storedUsers[0].servers.map(e => e.channelID).indexOf(message.channel.id)];

						correctEmbed.addField('Wins:', scoreDirectory.wins);

						correctEmbed.addField('Losses:', scoreDirectory.losses);

						correctEmbed.addField('Winrate:', isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)) ? '0%' : Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100) + '%');

						correctEmbed.addField('MMR:', scoreDirectory.mmr);

						return message.channel.send(correctEmbed);
					});
					break
				}
				case 'channel': {

					const getScore = async (id, arg) => {

						await dbCollection.find({
							servers: {
								$elemMatch: {
									channelID: id,
								},
							},
						}).toArray().then(async storedUsers => {

							storedUsers = storedUsers.filter(a => a.servers.map(e => e.channelID).indexOf(id) !== -1 && a.servers[a.servers.map(e => e.channelID).indexOf(id)].wins + a.servers[a.servers.map(e => e.channelID).indexOf(id)].losses !== 0);

							if (!message.guild.channels.cache.array().map(e => e.id).includes(id)) {
								wrongEmbed.setTitle(':x: This channel does not belong to this server!');

								return message.channel.send(wrongEmbed);
							}

							if (storedUsers.length === 0) {
								wrongEmbed.setTitle(':x: No games have been played in here!');

								return message.channel.send(wrongEmbed);
							}

							storedUsers.sort((a, b) => {
								const indexA = a.servers.map(e => e.channelID).indexOf(id);

								const indexB = b.servers.map(e => e.channelID).indexOf(id);

								return b.servers[indexB].mmr - a.servers[indexA].mmr;
							});

							if (!isNaN(arg) && arg > 0) {
								let indexes = 20 * (arg - 1);
								for (indexes; indexes < 20 * arg; indexes++) {
									if (storedUsers[indexes] == undefined) {

										correctEmbed.addField('No more members to list in this page!', 'Encourage your friends to play!');

										break;
									}
									for (const servers of storedUsers[indexes].servers) {
										if (servers.channelID === id) {

											correctEmbed.addField((await fetchFromID(storedUsers[indexes].id)).username, `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${isNaN(Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)) ? '0' : Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)}% | MMR: ${servers.mmr}`);

											correctEmbed.setFooter(`Showing page ${arg}/${Math.ceil(storedUsers.length / 20)}`);
										}
									}
								}
							} else {
								for (i = 0; i < 20; i++) {
									if (storedUsers[i] == undefined) {
										correctEmbed.addField('No more members to list in this page!', 'Encourage your friends to play!');
										break;
									}
									for (const servers of storedUsers[i].servers) {
										if (servers.channelID === id) {

											correctEmbed.addField((await fetchFromID(storedUsers[i].id)).username, `Wins: ${servers.wins} | Losses: ${servers.losses} | Winrate: ${isNaN(Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)) ? '0' : Math.floor((servers.wins / (servers.wins + servers.losses)) * 100)}% | MMR: ${servers.mmr}`);

											correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(storedUsers.length / 20)}`);
										}
									}
								}
							}
							return message.channel.send(correctEmbed);
						});
					};

					if (!isNaN(thirdArg) && parseInt(thirdArg) > 10000) {
						return getScore(thirdArg, fourthArg);
					} else {
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
					correctEmbed.addField('No more games to list ', 'Encourage your friends to play!');
					break;
				}

				if (game[10].channelID === channel_ID) {

					correctEmbed.addField(`Game ${game[10].gameID}`, `🔸 <@${game[0].id}>, <@${game[1].id}>, <@${game[2].id}>, <@${game[3].id}>, <@${game[4].id}>`);
					correctEmbed.addField('**VS**', `🔹 <@${game[5].id}>, <@${game[6].id}>, <@${game[7].id}>, <@${game[8].id}>, <@${game[9].id}>, `);

					correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(ongoingGames.length / 20)}`);
				}
			}
			return message.channel.send(correctEmbed);
		}

		case 'reset': {
			if (message.content.split(' ').length == 1) {

				wrongEmbed.setTitle(':x: Invalid Parameters!');

				return message.channel.send(wrongEmbed);
			}

			if (!message.member.hasPermission('ADMINISTRATOR')) {

				wrongEmbed.setTitle(':x: You do not have Administrator permission!');

				return message.channel.send(wrongEmbed);
			}

			switch (secondArg) {
				case 'channel': {

					if (ongoingGames.flat().map(e => e.channelID).includes(channel_ID)) {
						wrongEmbed.setTitle(':x: There are users in game!');

						return message.channel.send(wrongEmbed);
					}

					if (message.content.split(' ').length !== 2) {

						wrongEmbed.setTitle(':x: Invalid Parameters!');

						return message.channel.send(wrongEmbed);
					}

					await dbCollection.find({
						servers: {
							$elemMatch: {
								channelID: channel_ID,
							},
						},
					}).toArray().then(async storedUsers => {

						for (const user of storedUsers) {

							const channelPos = user.servers.map(e => e).map(e => e.channelID).indexOf(channel_ID);

							if (channelPos !== -1) {

								await dbCollection.update({
									id: user.id,
								}, {
									$pull: {
										servers: {
											channelID: channel_ID,
										},
									},
								});
							}
						}

					});

					for (const game of finishedGames) {
						if (game[10].channelID === channel_ID) {

							finishedGames.splice(finishedGames.indexOf(game), 1);
						}
					}
					correctEmbed.setTitle(':white_check_mark: Channel score reset!');

					return message.channel.send(correctEmbed);
				}
				case 'player': {

					if (ongoingGames.flat().map(e => e.id).includes(userId)) {
						wrongEmbed.setTitle(':x: User is in the middle of a game!');

						return message.channel.send(wrongEmbed);
					}

					if (message.content.split(' ').length !== 3) {

						wrongEmbed.setTitle(':x: Invalid Parameters!');

						return message.channel.send(wrongEmbed);

					}
					await dbCollection.find({
						id: thirdArg,
					}).toArray().then(async storedUsers => {
						if (storedUsers.length === 0) {

							wrongEmbed.setTitle(':x: This user hasn\'t played any games in this channel!');

							return message.channel.send(wrongEmbed);
						}

						await dbCollection.update({
							id: thirdArg,
						}, {
							$pull: {
								servers: {
									channelID: channel_ID,
								},
							},
						});
					});
					correctEmbed.setTitle(':white_check_mark: Player\'s score reset!');

					return message.channel.send(correctEmbed);
				}
				default: {
					wrongEmbed.setTitle(':x: Invalid Parameters!');

					return message.channel.send(wrongEmbed);
				}
			}
		}

		case 'q': {

			for (const person of queueArray) {
				if (person.id === userId) {

					wrongEmbed.setTitle(':x: You\'re already in the queue!');

					return message.channel.send(wrongEmbed);
				}
			}

			if (includesUserID(ongoingGames.flat())) {

				wrongEmbed.setTitle(':x: You are in the middle of a game!');

				return message.channel.send(wrongEmbed);
			}

			if (queueArray.length > 9) {

				wrongEmbed.setTitle(':x: Please wait for the next game to be decided!');

				return message.channel.send(wrongEmbed);
			}

			queueArray.push(toAdd);

			correctEmbed.setTitle(`:white_check_mark: Added to queue! ${queueArray.length}/10`);

			message.channel.send(correctEmbed);

			if (queueArray.length === 10) {
				for (const user of queueArray) {
					await dbCollection.find({
						id: user.id,
					}).toArray().then(async storedUsers => {
						const newUser = {
							id: user.id,
							name: user.name,
							servers: [],
						};

						if (storedUsers.length === 0) {

							await dbCollection.insert(newUser);

							await dbCollection.update({
								id: user.id,
							}, {
								$push: {
									servers: {
										channelID: channel_ID,
										wins: 0,
										losses: 0,
										mmr: 1000,
									},
								},
							});

						} else if (!storedUsers[0].servers.map(e => e.channelID).includes(channel_ID)) {

							await dbCollection.update({
								id: user.id,
							}, {
								$push: {
									servers: {
										channelID: channel_ID,
										wins: 0,
										losses: 0,
										mmr: 1000,
									},
								},
							});
						}
					});
				}

				const valuesforpm = {
					name: Math.floor(Math.random() * 99999),
					password: Math.floor(Math.random() * 99999),
				};

				message.channel.send(`<@${queueArray[0].id}>, <@${queueArray[1].id}>, <@${queueArray[2].id}>, <@${queueArray[3].id}>, <@${queueArray[4].id}>, <@${queueArray[5].id}>, <@${queueArray[6].id}>, <@${queueArray[7].id}>, <@${queueArray[8].id}>, <@${queueArray[9].id}>`);

				correctEmbed.setTitle('a game has been made! Please select your preferred gamemode: Captains (!c) (Currently broke) or Random (!r) ');

				gameCount++;

				const rorc = {};

				rorc[gameCount] = [];

				const rorcArray = rorc[gameCount];

				await message.channel.send(correctEmbed);

				let filter = m => m.content.split('')[1] === 'r' || m.content.split('')[1] === 'c';

				message.channel.createMessageCollector(filter, {
					time: 20000,
				}).on('collect', m => {
					if (!queueArray.map(e => e.id).includes(m.author.id) || rorcArray.map(e => e.id).includes(m.author.id)) {

					} else {

						rorcArray.push({
							id: m.author.id,
							param: m.content.split('')[1],
						});
					}
				});

				await new Promise(resolve => setTimeout(resolve, 20000));

				function getOccurrence(array, value) {

					return array.filter((v) => (v === value)).length;
				}

				if (rorcArray.length === 0) {

					rorcArray.push({
						param: rc[Math.floor(Math.random() * rc.length)],
					});
				}

				if (getOccurrence(rorcArray.map(e => e.param), 'r') === getOccurrence(rorcArray.map(e => e.param), 'c')) {

					rorcArray.push({
						param: rorcArray[Math.floor(Math.random() * rorcArray.map(e => e.param).length)].param,
					});
				}
				if (getOccurrence(rorcArray.map(e => e.param), 'r') > getOccurrence(rorcArray.map(e => e.param), 'c')) {

					shuffle(queueArray);

					queueArray.push({
						gameID: gameCount,
						time: new Date(),
						channelID: channel_ID,
					});

				} else if (getOccurrence(rorcArray.map(e => e.param), 'c') > getOccurrence(rorcArray.map(e => e.param), 'r')) {

					// yes this code is horrible no shit sherlock

					// also what youre about to see will kill you, its not permanent, as even i have standarts

					tempObject[gameCount] = [];

					usedNums[gameCount] = [];

					const gameCountNums = usedNums[gameCount];

					const captainsArray = tempObject[gameCount];

					captainsArray.push(...queueArray.map(queueItem => ({
						...queueItem
					})));

					shuffle(captainsArray);

					for (let player of queueArray) {
						if (player.name !== undefined) {
							player.name = "Error, please report this error to tweeno (!credits)"
						}
					}

					queueArray[0] = captainsArray[0];

					queueArray[5] = captainsArray[1];

					const CaptainsEmbed = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_WARNING)
						.setTitle(`Game ID: ${gameCount}`)
						.addField('Captain for team 1', captainsArray[0].name)
						.addField('Captain for team 2', captainsArray[1].name);

					message.channel.send(CaptainsEmbed);

					const privatedm0 = await client.users.fetch(captainsArray[0].id);

					const privatedm1 = await client.users.fetch(captainsArray[1].id);

					captainsArray.shift();

					captainsArray.shift();

					const Captain1st = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_WARNING)
						.setTitle('Choose one ( you have 40 seconds):')
						.addField('1 :', captainsArray[0].name)
						.addField('2 :', captainsArray[1].name)
						.addField('3 :', captainsArray[2].name)
						.addField('4 :', captainsArray[3].name)
						.addField('5 :', captainsArray[4].name)
						.addField('6 :', captainsArray[5].name)
						.addField('7 :', captainsArray[6].name)
						.addField('8 :', captainsArray[7].name);

					privatedm0.send(Captain1st).catch(error => {
						const errorEmbed = new Discord.MessageEmbed()
							.setColor(EMBED_COLOR_WARNING)
							.setTitle(`:x: Couldn't sent message to ${privatedm0}, please check if your DM'S aren't set to friends only.`);

						console.error(error);

						message.channel.send(errorEmbed);
					});

					filter = m => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 9;

					await privatedm0.createDM().then(m => {
						m.createMessageCollector(filter, {
							time: 40000,
						}).on('collect', m => {

							const parsedM = parseInt(m.content) - 1;

							if (!hasVoted) {

								queueArray[1] = captainsArray[parsedM];

								captainsArray.splice(parsedM, 1);

								hasVoted = true;
							}
						});
					});

					await new Promise(resolve => setTimeout(resolve, 40000));

					if (!hasVoted) {

						const randomnumber = Math.floor(Math.random() * 8);

						queueArray[1] = captainsArray[randomnumber];

						captainsArray.splice(randomnumber, 1);
					}

					hasVoted = false;

					const Captain2nd = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_WARNING)
						.setTitle('Choose two ( you have 40 seconds):')
						.addField('1 :', captainsArray[0].name)
						.addField('2 :', captainsArray[1].name)
						.addField('3 :', captainsArray[2].name)
						.addField('4 :', captainsArray[3].name)
						.addField('5 :', captainsArray[4].name)
						.addField('6 :', captainsArray[5].name)
						.addField('7 :', captainsArray[6].name);

					privatedm1.send(Captain2nd).catch(error => {
						const errorEmbed = new Discord.MessageEmbed()
							.setColor(EMBED_COLOR_WARNING)
							.setTitle(`:x: Couldn't sent message to ${privatedm1}, please check if your DM'S aren't set to friends only.`);

						console.error(error);

						message.channel.send(errorEmbed);
					});

					filter = m => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 8;

					privatedm1.createDM().then(m => {
						m.createMessageCollector(filter, {
							time: 40000,
						}).on('collect', m => {

							const parsedM = parseInt(m.content) - 1;

							if (!hasVoted) {
								queueArray[6] = captainsArray[parsedM];

								hasVoted = true;

								usedNums.push(parsedM);

							} else if (hasVoted && !usedNums.includes(parsedM) && hasVoted !== 'all') {

								queueArray[7] = captainsArray[parsedM];

								hasVoted = 'all';

								usedNums.push(parsedM);

								captainsArray.splice(usedNums[0], 1);

								if (usedNums[1] > usedNums[0]) {

									captainsArray.splice(usedNums[1] - 1, 1);
								} else {

									captainsArray.splice(usedNums[1], 1);
								}
							}
						});
					});

					await new Promise(resolve => setTimeout(resolve, 40000));

					let randomnumber = Math.floor(Math.random() * 7);

					let randomnumber2 = Math.floor(Math.random() * 7);

					if (!hasVoted) {

						while (randomnumber === randomnumber2) {
							randomnumber2 = Math.floor(Math.random() * 7);
						}

						queueArray[6] = captainsArray[randomnumber];

						queueArray[7] = captainsArray[randomnumber2];

						captainsArray.splice(randomnumber, 1);

						if (randomnumber2 > randomnumber) {

							captainsArray.splice(randomnumber2 - 1, 1);
						} else {

							captainsArray.splice(randomnumber2, 1);
						}

					} else if (hasVoted !== 'all') {

						while (usedNums.includes(randomnumber2)) {

							randomnumber2 = Math.floor(Math.random() * 6);
						}

						queueArray[7] = captainsArray[randomnumber2];

						captainsArray.splice(usedNums[0], 1);

						if (randomnumber2 > usedNums[0]) {

							captainsArray.splice(randomnumber2 - 1, 1);
						} else {

							captainsArray.splice(randomnumber2, 1);
						}
					}

					usedNums = [];

					hasVoted = false;

					const Captain3rd = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_WARNING)
						.setTitle('Choose two ( you have 20 seconds):')
						.addField('1 :', captainsArray[0].name)
						.addField('2 :', captainsArray[1].name)
						.addField('3 :', captainsArray[2].name)
						.addField('4 :', captainsArray[3].name)
						.addField('5 :', captainsArray[4].name);

					privatedm0.send(Captain3rd).catch(error => {
						const errorEmbed = new Discord.MessageEmbed()
							.setColor(EMBED_COLOR_WARNING)
							.setTitle(`:x: Couldn't sent message to ${privatedm0}, please check if your DM'S aren't set to friends only.`); - console.error(error);

						message.channel.send(errorEmbed);
					});

					filter = m => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 6;

					privatedm0.createDM().then(m => {
						m.createMessageCollector(filter, {
							time: 40000,
						}).on('collect', m => {

							const parsedM = parseInt(m.content) - 1;

							if (!hasVoted) {

								queueArray[2] = captainsArray[parsedM];

								hasVoted = true;

								gameCountNums.push(parsedM);

							} else if (hasVoted && !gameCountNums.includes(parsedM) && hasVoted !== 'all') {

								queueArray[3] = captainsArray[parsedM];

								hasVoted = 'all';

								gameCountNums.push(parsedM);

								captainsArray.splice(gameCountNums[0], 1);

								if (gameCountNums[1] > gameCountNums[0]) {

									captainsArray.splice(gameCountNums[1] - 1, 1);
								} else {

									captainsArray.splice(usedNums[1], 1);
								}
							}
						});
					});

					await new Promise(resolve => setTimeout(resolve, 20000));

					randomnumber = Math.floor(Math.random() * 5);

					randomnumber2 = Math.floor(Math.random() * 5);

					if (!hasVoted) {

						while (randomnumber === randomnumber2) {
							randomnumber2 = Math.floor(Math.random() * 5);
						}

						queueArray[2] = captainsArray[randomnumber];

						queueArray[3] = captainsArray[randomnumber2];

						captainsArray.splice(randomnumber, 1);

						if (randomnumber2 > randomnumber) {

							captainsArray.splice(randomnumber2 - 1, 1);
						} else {

							captainsArray.splice(randomnumber2, 1);
						}

					} else if (hasVoted !== 'all') {

						while (gameCountNums.includes(randomnumber2)) {

							randomnumber2 = Math.floor(Math.random() * 4);
						}

						queueArray[3] = captainsArray[randomnumber2];

						captainsArray.splice(gameCountNums[0], 1);

						if (randomnumber2 > gameCountNums[0]) {

							captainsArray.splice(randomnumber2 - 1, 1);
						} else {

							captainsArray.splice(randomnumber2, 1);
						}
					}

					gameCountNums = [];

					hasVoted = false;

					const Captain4th = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_WARNING)
						.setTitle('Choose two ( you have 40 seconds):')
						.addField('1 :', captainsArray[0].name)
						.addField('2 :', captainsArray[1].name)
						.addField('3 :', captainsArray[2].name);

					privatedm1.send(Captain4th).catch(error => {
						const errorEmbed = new Discord.MessageEmbed()
							.setColor(EMBED_COLOR_WARNING)
							.setTitle(`:x: Couldn't sent message to ${privatedm1}, please check if your DM'S aren't set to friends only.`);

						console.error(error);

						message.channel.send(errorEmbed);
					});

					filter = m => !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) < 4;

					privatedm1.createDM().then(m => {
						m.createMessageCollector(filter, {
							time: 40000,
						}).on('collect', m => {

							const parsedM = parseInt(m.content) - 1;

							if (!hasVoted) {

								queueArray[8] = captainsArray[parsedM];

								hasVoted = true;

								gameCountNums.push(parsedM);

							} else if (hasVoted && !gameCountNums.includes(parsedM) && hasVoted !== 'all') {

								queueArray[9] = captainsArray[parsedM];

								hasVoted = 'all';

								gameCountNums.push(parsedM);

								captainsArray.splice(gameCountNums[0], 1);

								if (gameCountNums[1] > gameCountNums[0]) {

									captainsArray.splice(gameCountNums[1] - 1, 1);
								} else {

									captainsArray.splice(gameCountNums[1], 1);
								}
							}
						});
					});

					await new Promise(resolve => setTimeout(resolve, 40000));

					randomnumber = Math.floor(Math.random() * 3);

					randomnumber2 = Math.floor(Math.random() * 3);

					if (!hasVoted) {

						while (randomnumber === randomnumber2) {
							randomnumber2 = Math.floor(Math.random() * 3);
						}

						queueArray[8] = captainsArray[randomnumber];

						queueArray[9] = captainsArray[randomnumber2];

						captainsArray.splice(randomnumber, 1);

						if (randomnumber2 > randomnumber) {

							captainsArray.splice(randomnumber2 - 1, 1);
						} else {

							captainsArray.splice(randomnumber2, 1);
						}

					} else if (hasVoted && hasVoted !== 'all') {

						while (gameCountNums.includes(randomnumber2)) {

							randomnumber2 = Math.floor(Math.random() * 2);
						}

						queueArray[9] = captainsArray[randomnumber2];

						captainsArray.splice(gameCountNums[0], 1);

						if (randomnumber2 > gameCountNums[0]) {

							captainsArray.splice(randomnumber2 - 1, 1);
						} else {

							captainsArray.splice(randomnumber2, 1);
						}
					}

					hasVoted = false;

					queueArray[4] = captainsArray[0];

					captainsArray.splice(0, captainsArray.length)

					usedNums.splice(0, gameCountNums.length)

					queueArray.push({
						gameID: gameCount,
						time: new Date(),
						channelID: channel_ID,
					});
				}

				ongoingGames.push([...queueArray]);

				const discordEmbed1 = new Discord.MessageEmbed()
					.setColor(EMBED_COLOR_WARNING)
					.addField('Game is ready:', `Game ID is: ${gameCount}`)
					.addField(':small_orange_diamond: -Team 1-', `${queueArray[0].name}, ${queueArray[1].name}, ${queueArray[2].name}, ${queueArray[3].name}, ${queueArray[4].name}`)
					.addField(':small_blue_diamond: -Team 2-', `${queueArray[5].name}, ${queueArray[6].name}, ${queueArray[7].name}, ${queueArray[8].name}, ${queueArray[9].name}`);
				if (gameName !== 'LeagueOfLegends') {

					discordEmbed1.addField(`Map: ${gameName === 'valorant' ? valorantMaps[Math.floor(Math.random() * valorantMaps.length) ] : gameName === 'valorant' ? CSGOMaps[Math.floor(Math.random() * CSGOMaps.length)] : gameName === 'r6' ? R6Maps[Math.floor(Math.random() * R6Maps.length)] : 'Summoners Rift (duh)'}`, 'Please organize a match with your teammates and opponents. Team 1 attacks and Team 2 defends. Good luck!');
				}
				message.channel.send(discordEmbed1);

				if (gameName === 'leagueoflegends') {

					const JoinMatchEmbed = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_WARNING)
						.addField('Name:', valuesforpm.name)
						.addField('Password:', valuesforpm.password)
						.addField('You have to:', `Join match(Created by ${queueArray[0].name})`);

					for (const users of queueArray) {
						if (users.id !== queueArray[0].id && users.id !== queueArray[10].id) {


							const fetchedUser = await client.users.fetch(users.id);
							fetchedUser.send(JoinMatchEmbed).catch(error => {
								const errorEmbed = new Discord.MessageEmbed()
									.setColor(EMBED_COLOR_WARNING)
									.setTitle(`:x: Couldn't sent message to ${users.name}, please check if your DM'S aren't set to friends only.`);

								console.error(error);

								message.channel.send(errorEmbed);

							});
						}
					}

					const CreateMatchEmbed = new Discord.MessageEmbed()
						.setColor(EMBED_COLOR_WARNING)
						.addField('Name:', valuesforpm.name)
						.addField('Password:', valuesforpm.password)
						.addField('You have to:', 'Create Custom Match');


					const fetchedUser1 = await client.users.fetch(queueArray[0].id);
					fetchedUser1.send(CreateMatchEmbed).catch(error => {
						const errorEmbed = new Discord.MessageEmbed()
							.setColor(EMBED_COLOR_WARNING)
							.setTitle(`:x: Couldn't sent message to ${queueArray[0].name}, please check if your DM'S aren't set to friends only.`);

						message.channel.send(errorEmbed);
						console.error(error);
					});
				}

				message.guild.channels.create(`🔸Team-1-Game-${gameCount}`, {
						type: 'voice',
						parent: message.channel.parentID,
						permissionOverwrites: [{
								id: message.guild.id,
								deny: 'CONNECT',
							},
							{
								id: queueArray[0].id,
								allow: 'CONNECT',
							},
							{
								id: queueArray[1].id,
								allow: 'CONNECT',
							},
							{
								id: queueArray[2].id,
								allow: 'CONNECT',
							},
							{
								id: queueArray[3].id,
								allow: 'CONNECT',
							},
							{
								id: queueArray[4].id,
								allow: 'CONNECT',
							},
						],
					})
					.catch(console.error);

				message.guild.channels.create(`🔹Team-2-Game-${gameCount}`, {
						type: 'voice',
						parent: message.channel.parentID,
						permissionOverwrites: [{
								id: message.guild.id,
								deny: 'CONNECT',
							},
							{
								id: queueArray[5].id,
								allow: 'CONNECT',
							},
							{
								id: queueArray[6].id,
								allow: 'CONNECT',
							},
							{
								id: queueArray[7].id,
								allow: 'CONNECT',
							},
							{
								id: queueArray[8].id,
								allow: 'CONNECT',
							},
							{
								id: queueArray[9].id,
								allow: 'CONNECT',
							},
						],
					})
					.catch(console.error);

				queueArray.splice(0, queueArray.length);
			}
		}
	}
};

module.exports = {
	name: ['q', 'status', 'leave', 'report', 'score', 'cancel', 'reset', 'r', 'c', 'game', 'ongoinggames', 'mode', 'revertgame'],
	description: '6man bot',
	execute,
};