module.exports = {
	name: 'ping',
	description: 'it pongs',
	execute(message) {
		message.channel.send("`no`");
	},
};