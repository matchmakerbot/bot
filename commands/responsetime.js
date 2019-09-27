const Discord = require('discord.js');
module.exports = {
    name: 'responsetime',
    description: 'u die',
    execute(message) {
            message.channel.send(new Date().getTime() - message.createdTimestamp + " ms");  
    },
}

