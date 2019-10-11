const Discord = require('discord.js');


const exampleEmbed = new Discord.RichEmbed()
    .setColor('#7289DA')
    .setDescription('*pulls trigger*\n\n **click**\n\nYou lived! Dang :/')
    .setThumbnail('https://images-ext-1.discordapp.net/external/8NZWmBHnT-88D_ehlWnoU-tUWvG5Ui9aUEu7KK1BPss/https/cdn.discordapp.com/attachments/452632364238110721/458361437832871947/Green-Tick-PNG-Picture.png')


const exampleEmbed2 = new Discord.RichEmbed()
    .setColor('#FF0000')
    .setDescription('*pulls trigger*\n\n **BANG**\n\nLucky you, you died!')
    .setThumbnail('https://images-ext-2.discordapp.net/external/mJTZ9KTs7_HMF9XJQu4dfmfYB6JpWwqaceS_SVp086I/https/cdn.discordapp.com/attachments/452632364238110721/458361435639119893/skull_PNG72.png')



module.exports = {
    name: 'rr',
    description: 'u die',
    execute(message) {
        function fuckyouhaha() {
            const d = Math.round(Math.random())
        
            if (d === 0) {
                return exampleEmbed
            } else {
                return exampleEmbed2
            }
        }

        
        message.channel.send(fuckyouhaha());
    },
}