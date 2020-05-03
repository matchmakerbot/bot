const Discord = require('discord.js')

const execute = (message) => {
    const embed = new Discord.MessageEmbed()
        .setColor("#F8534F")
        .addField("Tweeno#8687", "Creator of this Bot")
        .setThumbnail("https://images-ext-1.discordapp.net/external/5mv2fRmWaMVMyNfFxNih0XMcFKCXLNcTadEclLGLlCY/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/215982178046181376/324102b36084ffe33d8ecc95d48cd6ca.png")
        .addField("https://www.twitch.tv/tweenotv", "Feel free to follow me on twitch, i usually stream some random stuff.")
        .addField("https://discordapp.com/api/oauth2/authorize?client_id=571839826744180736&permissions=268512272&redirect_uri=http%3A%2F%2Flocalhost%2Fauth%2Fdiscord%2Fcallback&scope=bot", "Invite the bot to your server here ^^")
        message.channel.send(embed)
}

module.exports = {
    name: "credits",
    description: 'Credits',
    execute
};