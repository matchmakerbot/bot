const Discord = require('discord.js')

const execute = (message) => {
    const tweeno = message.guild.members.get("215982178046181376")
    const embed = new Discord.MessageEmbed()
        .setColor("#F8534F")
        .addField("Tweeno#8687", "Creator of this Bot")
        .setThumbnail("https://images-ext-1.discordapp.net/external/yT4LV4m0IyxR1xw2Go_SrGPdNsj5S059zRolAvuWdl4/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/215982178046181376/b97f761b6cae4335b9269f73da7eb8fb.png?width=350&height=350")
        .addField("Feel free to follow me on twitch, i usually stream some random stuff.", "https://www.twitch.tv/tweenotv")
        message.channel.send(embed)
}

module.exports = {
    name: "credits",
    description: 'Credits',
    execute
};