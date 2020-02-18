const fs = require("fs");

const path = require("path");

const Discord = require("discord.js")

const client = require("../client.js");

const data = fs.readFileSync(path.join(__dirname, "sixmansdata.json"));

const storedData = JSON.parse(data);

const EMBED_COLOR = "#F8534F";

let gameCount = 0

let ongoingGames = [];

let channelQueues = {
    '615184953721880617': [{
        id: "215982178046181376",
        name: "a"
    }, {
        id: "215982178046181376",
        name: "b"
    }, {
        id: "215982178046181376",
        name: "c"
    }, {
        id: "215982178046181376",
        name: "d"
    }, {
        id: "215982178046181376",
        name: "e"
    }]
};

const shuffle = function (array) {

    let currentIndex = array.length;
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

function messageEndswith(message) {

    const split = message.content.split(" ");

    return split[split.length - 1];
};

const args = message => {
    const arraywords = message.content.split(" ")
    return arraywords[0].substring(1)
}

const execute = (message) => {

    const givewinLose = (score) => {
        for (let games of ongoingGames) {
            for (let j = 0; j < storedData.length; j++) {
                if (storedData[j].id === games[i].id && storedData[j].servers.map(e => e.channelID).includes(message.channel.id)) {

                    storedData[j].servers[storedData[j].servers.map(e => e.channelID).indexOf(message.channel.id)][score]++;

                    const returnstring = JSON.stringify(storedData);

                    fs.writeFileSync(path.join(__dirname, "sixmansdata.json"), returnstring);
                }
            }
        }
    }

    if (!Object.keys(channelQueues).includes(message.channel.id)) {

        channelQueues[message.channel.id] = []
    }

    const sixmansarray = channelQueues[message.channel.id]

    const userId = message.author.id

    const toAdd = {
        id: userId,
        name: message.author.username,
    };

    const embed = new Discord.RichEmbed().setColor(EMBED_COLOR)

    switch (args(message)) {

        case "leave": {
            const index = sixmansarray.map(e => e.id).indexOf(userId);

            if (index === -1) {

                embed.setTitle(":x: You are not in the queue!");

                return message.channel.send(embed);
            };

            sixmansarray.splice(index, 1);

            embed.setTitle(`:white_check_mark: ${message.author.username} left the queue!`);

            return message.channel.send(embed);
        }

        case "status": {

            embed.setTitle("Players in queue:");

            embed.setDescription(sixmansarray.map(e => e.name).join(", "));

            return message.channel.send(embed);
        }

        case "report": {
            switch (messageEndswith(message)) {
                case "win": {

                    if (ongoingGames.length === 0) {

                        embed.setTitle(":x: You are not in a game!");

                        return message.channel.send(embed);
                    }

                    for (let games of ongoingGames) {

                        if (!games.map(e => e.id).includes(userId) || ongoingGames.length === 0) {

                            embed.setTitle(":x: You are not in a game!");

                            return message.channel.send(embed)
                        }

                        embed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

                        const indexplayer = games.map(e => e.id).indexOf(userId);

                        if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2) {
                            for (i = 0; i < 3; i++) {
                                givewinLose("wins");
                            }
                            for (i = 3; i < 6; i++) {
                                givewinLose("losses");
                            }
                        }

                        if (indexplayer === 3 || indexplayer === 4 || indexplayer === 5) {
                            for (i = 3; i < 6; i++) {
                                givewinLose("wins");
                            }
                            for (i = 0; i < 3; i++) {
                                givewinLose("losses");
                            }
                        }

                        let index = ongoingGames.indexOf(games);

                        ongoingGames.splice(index, 1);

                        for (let channel of message.guild.channels.array()) {

                            if (channel.name === `Team-1-Game-${games[6].gameID}`) {

                                channel.delete()
                            }

                            if (channel.name === `Team-2-Game-${games[6].gameID}`) {

                                channel.delete()
                            }
                        }

                        return message.channel.send(embed);
                    }
                }

                case "lose": {

                    if (ongoingGames.length === 0) {

                        embed.setTitle(":x: You are not in a game!");

                        return message.channel.send(embed)
                    }

                    for (let games of ongoingGames) {

                        if (!games.map(e => e.id).includes(userId) || ongoingGames.length === 0) {

                            embed.setTitle(":x: You are not in a game!");

                            return message.channel.send(embed);
                        }

                        embed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

                        const indexplayer = games.map(e => e.id).indexOf(userId);

                        if (indexplayer === 0 || indexplayer === 1 || indexplayer === 2) {
                            for (i = 0; i < 3; i++) {
                                givewinLose("losses");
                            }
                            for (i = 3; i < 6; i++) {
                                givewinLose("wins");
                            }
                        }

                        if (indexplayer === 3 || indexplayer === 4 || indexplayer === 5) {
                            for (i = 3; i < 6; i++) {
                                givewinLose("losses");
                            }
                            for (i = 0; i < 3; i++) {
                                givewinLose("wins");
                                5
                            }
                        }

                        let index = ongoingGames.indexOf(games);

                        ongoingGames.splice(index, 1);

                        for (let channel of message.guild.channels.array()) {

                            if (channel.name === `Team-1-Game-${games[6].gameID}`) {

                                channel.delete()
                            }

                            if (channel.name === `Team-2-Game-${games[6].gameID}`) {

                                channel.delete()
                            }
                        }

                        return message.channel.send(embed);
                    }
                }
            }
            break;
        }

        case "score": {

            if (!storedData.map(e => e.id).includes(userId)) {

                embed.setTitle(":x: You haven't played any games yet!");

                return message.channel.send(embed);
            }

            for (let j = 0; j < storedData.length; j++) {
                if (storedData[j].id === userId) {
                    
                    const scoreDirectory =  storedData[j].servers[storedData[j].servers.map(e => e.channelID).indexOf(message.channel.id)]

                    embed.addField("Wins:", scoreDirectory.wins);

                    embed.addField("Losses:", scoreDirectory.losses);

                    return message.channel.send(embed);
                }
            }
            break;
        }
        case "q": {

            for (let person of sixmansarray) {
                if (person.id === userId) {

                    embed.setTitle(":x: You're already in the queue!");

                    return message.channel.send(embed);
                }
            };

            for (let games of ongoingGames) {

                if (games.map(e => e.id).includes(userId)) {

                    embed.setTitle(":x: You are in the middle of a game!");

                    return message.channel.send(embed);
                };
            };

            sixmansarray.push(toAdd);

            embed.setTitle(":white_check_mark: Added to queue!");

            message.channel.send(embed);

            if (sixmansarray.length === 6) {
                for (let user of sixmansarray) {

                    const newUser = {
                        id: user.id,
                        name: user.name,
                        servers: []
                    };

                    const channelStatus = {
                        channelID: message.channel.id,
                        wins: 0,
                        losses: 0
                    }

                    if (!storedData.map(e => e.id).includes(user.id)) {

                        storedData.push(newUser);

                        const returnstring = JSON.stringify(storedData);

                        fs.writeFileSync(path.join(__dirname, "sixmansdata.json"), returnstring);
                    };

                    const indexPlayerData = storedData.map(e => e.id).indexOf(user.id)

                    if (storedData.map(e => e.id).includes(user.id) && !storedData[indexPlayerData].servers.map(e => e.channelID).includes(message.channel.id)) {

                        storedData[indexPlayerData].servers.push(channelStatus);

                        const returnstring = JSON.stringify(storedData);

                        fs.writeFileSync(path.join(__dirname, "sixmansdata.json"), returnstring);
                    };
                };

                const valuesforpm = {
                    name: Math.floor(Math.random() * 99999),
                    password: Math.floor(Math.random() * 99999)
                };

                shuffle(sixmansarray);

                gameCount++

                sixmansarray.push({
                    gameID: gameCount
                })

                ongoingGames.push([...sixmansarray]);

                const discordEmbed1 = new Discord.RichEmbed()
                    .setColor(EMBED_COLOR)
                    .addField("Game is ready:", `Game ID is: ${gameCount}`)
                    .addField(":small_orange_diamond: -Team 1-", `${sixmansarray[0].name}, ${sixmansarray[1].name}, ${sixmansarray[2].name}`)
                    .addField(":small_blue_diamond: -Team 2-", `${sixmansarray[3].name}, ${sixmansarray[4].name}, ${sixmansarray[5].name}`);
                message.channel.send(discordEmbed1);

                const JoinMatchEmbed = new Discord.RichEmbed()
                    .setColor(EMBED_COLOR)
                    .addField("Name:", valuesforpm.name)
                    .addField("Password:", valuesforpm.password)
                    .addField("You have to:", `Join match(Created by ${sixmansarray[0].name})`);

                const errorEmbed = new Discord.RichEmbed()
                    .setColor(EMBED_COLOR)


                for (let users of sixmansarray) {
                    if (users.id !== sixmansarray[0].id && users.id !== sixmansarray[6].id) {

                        client.users.get(users.id).send(JoinMatchEmbed).catch(error => {

                            console.error(error);

                            errorEmbed.setTitle(`:x: Couldn't sent message to ${users.name}, please check if your DM'S aren't set to friends only.`);

                            message.channel.send(errorEmbed)
                        });
                    };
                };

                const CreateMatchEmbed = new Discord.RichEmbed()
                    .setColor(EMBED_COLOR)
                    .addField("Name:", valuesforpm.name)
                    .addField("Password:", valuesforpm.password)
                    .addField("You have to:", "Create Match");

                client.users.get(sixmansarray[0].id).send(CreateMatchEmbed).catch(error => {

                    console.error(error);

                    errorEmbed.setTitle(`:x: Couldn't sent message to ${sixmansarray[0].name}, please check if your DM'S aren't set to friends only.`);

                    message.channel.send(errorEmbed)
                });

                message.guild.createChannel(`Team-1-Game-${gameCount}`, {
                        type: 'voice',
                        parent: message.channel.parentID,
                        permissionOverwrites: [{
                                id: message.guild.defaultRole,
                                deny: "CONNECT"
                            },
                            {
                                id: sixmansarray[0].id,
                                allow: "CONNECT"
                            },
                            {
                                id: sixmansarray[1].id,
                                allow: "CONNECT"
                            },
                            {
                                id: sixmansarray[2].id,
                                allow: "CONNECT"
                            }
                        ]
                    })
                    .catch(console.error)

                message.guild.createChannel(`Team-2-Game-${gameCount}`, {
                        type: 'voice',
                        parent: message.channel.parentID,
                        permissionOverwrites: [{
                                id: message.guild.defaultRole,
                                deny: "CONNECT"
                            },
                            {
                                id: sixmansarray[3].id,
                                allow: "CONNECT"
                            },
                            {
                                id: sixmansarray[4].id,
                                allow: "CONNECT"
                            },
                            {
                                id: sixmansarray[5].id,
                                allow: "CONNECT"
                            }
                        ]
                    })
                    .catch(console.error)

                sixmansarray.splice(0, sixmansarray.length);
            };
        }
    };

};

module.exports = {
    name: ['q', "status", "leave", "report", "score"],
    description: '6man bot',
    execute
};

//captains
//cancel
//reset score channel