const yt = require('ytdl-core');

const rp = require('request-promise-native');

const Discord = require('discord.js');

const musicChannels = {};

const execute = async (message) => {

	const embed = new Discord.MessageEmbed().setColor('#77B255');

	const voiceChannel = message.member.voice.channel;

	const secondArg = message.content.split(' ')[1];

	if (!Object.keys(musicChannels).includes(voiceChannel.id)) {

		musicChannels[voiceChannel.id] = [];
	}

	const musicQueue = musicChannels[voiceChannel.id];

	const play = () => {

		if (!voiceChannel || voiceChannel.type !== 'voice') {
			return message.channel.send('I couldn\'t connect to your voice channel...');
		}

		voiceChannel.join().then(connection => {
			connection.play(yt(`https://www.youtube.com/watch?v=${musicQueue[0].videoID}}`, {
				quality: 'highestaudio',
			})).on('finish', () => {
				musicQueue.shift();

				if (musicQueue.length === 0) {

					return connection.disconnect();
				}
				play();
			});
		});
	};

	if (secondArg === 'skip') {
		if (musicQueue.length === 0) {

			return message.channel.send('There is nothing to skip');
		}
		else if (musicQueue.length === 1) {

			musicQueue.shift();

			return voiceChannel.leave();
		}
		else {

			musicQueue.shift();

			return play();
		}
	}

	if (secondArg === 'queue') {
		if (musicQueue.length === 0) {

			return message.channel.send('The queue is empty!');

		}
		for (const music of musicQueue) {
			embed.addField(`${musicQueue.indexOf(music) + 1}:`, music.title);

		}
		return message.channel.send(embed);
	}

	rp(` https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${message.content.slice(6)}&type=video&key=${process.env.ytapi}`)
		.then(res => {
			const response = JSON.parse(res);

			if (response.items.length === 0) {
				embed.setTitle('No videos Found');

				return message.channel.send(embed);
			}

			const item = response.items[0];

			musicQueue.push({
				videoID: item.id.videoId,
				title: item.snippet.title,
				thumbnail: item.snippet.thumbnails.default.url,
			});

			if (musicQueue.length === 1) {
				play();
				embed.addField('Now playing: ', musicQueue[0].title)
					.setThumbnail(musicQueue[0].thumbnail);

				return message.channel.send(embed);
			}
			else {
				embed.addField('Added to queue: ', item.snippet.title)
					.setThumbnail(item.snippet.thumbnails.default.url);

				return message.channel.send(embed);
			}
		});
};

module.exports = {
	name: 'play',
	description: 'Gievs you a nice command list',
	execute,
};