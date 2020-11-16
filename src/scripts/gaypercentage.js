// load data.json
const fs = require('fs');
const path = require('path');

const gayperc = fs.readFileSync(path.join(__dirname, 'gaydata.json'));

const gaypercent = JSON.parse(gayperc);

module.exports = {
	name: 'gaypercentage',
	description: 'ur gay',
	execute(message) {

		for (const person of gaypercent) {
			if (person.id === message.author.id) {
				message.channel.send('```' + message.author.username + ' is ' + person.gay * 100 + '% gay```');
				return;
			}
		}

		const storevalue = Math.floor(Math.random() * 101);

		const newperson = {
			id: message.author.id,
			gay: storevalue / 100,
		};

		gaypercent.push(newperson);

		const returnstring = JSON.stringify(gaypercent);

		fs.writeFileSync(path.join(__dirname, 'gaydata.json'), returnstring);

		message.channel.send('```' + message.author.username + ' is ' + newperson.gay * 100 + '% gay```');
	},
};
