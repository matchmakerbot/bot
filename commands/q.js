const Discord = require('discord.js')

const client = require("../client.js");

let Asixmansarray = []
let Bsixmansarray = []
let Csixmansarray = []
let Dsixmansarray = []
let Esixmansarray = []

let shuffle = function (array) {

    const currentIndex = array.length;
    let temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);

        currentIndex--;

        temporaryValue = array[currentIndex];

        array[currentIndex] = array[randomIndex];

        array[randomIndex] = temporaryValue;
    }

    return array;

};

//yea i know this code is horrible no need to bash me

module.exports = {
    name: 'q',
    description: '6man bot',
    execute(message) {
        const toAdd = {
            id: message.author.id,
            name: message.author.username,
        };

        function messageEndswith() {
            const split = message.content.split(" ");

            return split[split.length - 1];
        };

        let sixmans = sixmansarray => {
            if (messageEndswith() === "leave") {

                const index = sixmansarray.map(e => e.id).indexOf(message.author.id)

                if (index === -1) {
                    const discordEmbed = new Discord.RichEmbed()
                        .setColor('#F8534F')
                        .setTitle(":x: You are not in the queue!");

                    return message.channel.send(discordEmbed)
                };

                sixmansarray.splice(index, 1)

                const discordEmbed = new Discord.RichEmbed()
                    .setColor('#F8534F')
                    .setTitle(`:white_check_mark: ${message.author.username} left the queue!`);

                return message.channel.send(discordEmbed)

            } else if (messageEndswith() === "status") {
                const discordEmbed = new Discord.RichEmbed()
                    .setColor('#F8534F')
                    .setTitle("Players in queue:")
                    .setDescription(sixmansarray.map(e => e.name).join(", "));
                return message.channel.send(discordEmbed);
            } else {
                for (let person of sixmansarray) {
                    if (person.id === message.author.id) {
                        const discordEmbed = new Discord.RichEmbed()
                            .setColor('#F8534F')
                            .setTitle(":x: You're already in the queue!");
                        message.channel.send(discordEmbed);
                        return;
                    }
                }
                sixmansarray.push(toAdd)
                const discordEmbed = new Discord.RichEmbed()
                    .setColor('#F8534F')
                    .setTitle(":white_check_mark: Added to queue!");
                message.channel.send(discordEmbed);
            };
            if (sixmansarray.length == 6) {

                const valuesforpm = {
                    name: Math.floor(Math.random() * 99999),
                    password: Math.floor(Math.random() * 99999)
                };

                shuffle(sixmansarray);

                const temparray = [sixmansarray[1].id, sixmansarray[2].id, sixmansarray[3].id, sixmansarray[4].id, sixmansarray[5].id]

                const discordEmbed1 = new Discord.RichEmbed()
                    .setColor('#F8534F')
                    .addField("Game is ready:", "Join your team's chat")
                    .addField("-Team 1-", `${sixmansarray[0].name}, ${sixmansarray[1].name}, ${sixmansarray[2].name}`)
                    .addField("-Team 2-", `${sixmansarray[3].name}, ${sixmansarray[4].name}, ${sixmansarray[5].name}`);
                message.channel.send(discordEmbed1);

                const discordEmbed2 = new Discord.RichEmbed()
                    .setColor('#F8534F')
                    .addField("Name:", valuesforpm.name)
                    .addField("Password:", valuesforpm.password)
                    .addField("You have to:", `Join match(Created by ${sixmansarray[0].name})`);

                for (let users of temparray) {
                    client.users.get(users).send(discordEmbed2);
                }
                const discordEmbed3 = new Discord.RichEmbed()
                    .setColor('#F8534F')
                    .addField("Name:", valuesforpm.name)
                    .addField("Password:", valuesforpm.password)
                    .addField("You have to:", "Create Match");
                client.users.get(sixmansarray[0].id).send(discordEmbed3);

                return sixmansarray.splice(0, sixmansarray.length);
            };
        };

        switch (message.channel.id) {
            case "581097385367830568":
                return sixmans(Asixmansarray);
            case "581097686342828052":
                return sixmans(Bsixmansarray);
            case "581097804890374154":
                return sixmans(Csixmansarray);
            case "581097957257117707":
                return sixmans(Dsixmansarray);
            case "627260315851030530":
                return sixmans(Esixmansarray);

        };

    },
};

//captains
//voice chat
//report win
//prob add a queue status in the array as in status: in queue
//support for more matches