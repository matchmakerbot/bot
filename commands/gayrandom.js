module.exports = {
	name: 'gayrandom',
	description: 'ur gay',
	execute(message) {
        const storevalue2 = Math.floor(Math.random() * 101);
        message.channel.send("```" + message.author.username + " is " + storevalue2 + "% gay```");
    }
}