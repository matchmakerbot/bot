const fs = require("fs");

const path = require("path");

const Discord = require("discord.js")

const client = require("../client.js");

const MongoDB = require("../mongodb");

const db = MongoDB.getDB()

const dbCollection = db.collection('sixman')

let gameCount = 0;

const EMBED_COLOR = "#F8534F";

let ongoingGames = [];

let storedData;

let channelQueues = {
    '615184953721880617': [{
        id: "286832262937444352",
        name: "a"
    }, {
        id: "306892029349068804",
        name: "b"
    }, {
        id: "280742339868229643",
        name: "c"
    }, {
        id: "138051800853905408",
        name: "d"
    }, {
        id: "204200071670136833",
        name: "e"
    }]
};

let cancelqueue = {}

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


const execute = async (message) => {

    await dbCollection.find().toArray().then(dataDB => {
        storedData = dataDB
    })

    const channel_ID = message.channel.id

    const givewinLose = async (score) => {

        const a = `servers.$.${score}`

        for (let games of ongoingGames) {
            for (let j = 0; j < storedData.length; j++) {
                if (storedData[j].id === games[i].id && storedData[j].servers.map(e => e.channelID).includes(channel_ID)) {

                    await dbCollection.update({
                        id: storedData[j].id,
                        ["servers.channelID"]: channel_ID
                    }, {
                        $set: {
                            [a]: storedData[j].servers[storedData[j].servers.map(e => e.channelID).indexOf(channel_ID)][score] + 1
                        }
                    });
                }
            }
        }
    }

    if (!Object.keys(channelQueues).includes(channel_ID)) {

        channelQueues[channel_ID] = []
    }

    const sixmansarray = channelQueues[channel_ID]

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

                    if (!ongoingGames.flat().map(e => e.id).includes(userId) || ongoingGames.length === 0) {

                        embed.setTitle(":x: You are not in a game!");

                        return message.channel.send(embed)
                    }

                    for (let games of ongoingGames) {

                        if (!games.map(e => e.id).includes(userId)) {

                            continue
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
                    if (!ongoingGames.flat().map(e => e.id).includes(userId)) {

                        embed.setTitle(":x: You are not in a game!");

                        return message.channel.send(embed);
                    }

                    for (let games of ongoingGames) {

                        if (!games.map(e => e.id).includes(userId)) {

                            continue
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
                default: {
                    embed.setTitle(":x: Invalid Parameters!")
                    return message.channel.send(embed);
                }
            }
        }

        case "cancel": {
            if (!ongoingGames.flat().map(e => e.id).includes(userId) || ongoingGames.length === 0) {

                embed.setTitle(":x: You are not in a game!");

                return message.channel.send(embed);
            }
            for (let games of ongoingGames) {

                if (!games.map(e => e.id).includes(userId)) {

                    continue
                }

                const IDGame = games[6].gameID

                const index = games.map(e => e.id).indexOf(userId);

                if (!Object.keys(cancelqueue).includes(IDGame.toString())) {

                    cancelqueue[IDGame] = []
                }

                const cancelqueuearray = cancelqueue[IDGame]

                cancelqueuearray.push({
                    id: userId
                })

                embed.setTitle(`:exclamation: ${games[index].name} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/4)`)

                message.channel.send(embed)

                if (cancelqueuearray.length === 4) {

                    for (let channel of message.guild.channels.array()) {

                        if (channel.name === `Team-1-Game-${games[6].gameID}`) {

                            channel.delete()
                        }

                        if (channel.name === `Team-2-Game-${games[6].gameID}`) {

                            channel.delete()
                        }
                    }

                    embed.setTitle(`:white_check_mark: Game ${games[6].gameID} Cancelled!`)

                    let index = ongoingGames.indexOf(games);

                    ongoingGames.splice(index, 1);

                    return message.channel.send(embed)
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

                    const scoreDirectory = storedData[j].servers[storedData[j].servers.map(e => e.channelID).indexOf(message.channel.id)]

                    if (scoreDirectory === undefined) {

                        embed.setTitle(":x: You haven't played any games in here yet!");

                        return message.channel.send(embed);
                    }

                    embed.addField("Wins:", scoreDirectory.wins);

                    embed.addField("Losses:", scoreDirectory.losses);

                    return message.channel.send(embed);
                }
            }
            break;
        }

        case "reset": {
            if (message.content.split(" ").length == 1) {
                embed.setTitle(":x: Invalid Parameters!")
                return message.channel.send(embed)
            }
            const secondarg = message.content.split(" ")[1]

            const thirdparam = message.content.split(" ")[2]

            if (!message.member.hasPermission("ADMINISTRATOR")) {
                embed.setTitle(":x: You do not have Administrator permission!")
                return message.channel.send(embed)
            }

            const winlossarray = ["wins", "losses"]

            switch (secondarg) {
                case "channel": {

                    if (message.content.split(" ").length !== 2) {

                        embed.setTitle(":x: Invalid Parameters!")

                        return message.channel.send(embed)
                    }

                    for (let score of winlossarray) {
                        const a = `servers.$.${score}`
                        await dbCollection.update({
                            ["servers.channelID"]: channel_ID
                        }, {
                            $set: {
                                [a]: 0
                            }
                        });
                    }
                    embed.setTitle(":white_check_mark: Player's score reset!")
                    return message.channel.send(embed)
                }
                case "player": {
                    if (message.content.split(" ").length !== 3) {

                        embed.setTitle(":x: Invalid Parameters!")

                        return message.channel.send(embed)

                    }
                    for (let score of winlossarray) {
                        const a = `servers.$.${score}`
                        await dbCollection.update({
                            id: thirdparam,
                            ["servers.channelID"]: channel_ID
                        }, {
                            $set: {
                                [a]: 0
                            }

                        });
                    }
                    embed.setTitle(":white_check_mark: Player's score reset!")

                    return message.channel.send(embed)
                }
                default: {
                    embed.setTitle(":x: Invalid Parameters!")

                    return message.channel.send(embed);
                }
            }
        }

        case "q": {

            for (let person of sixmansarray) {
                if (person.id === userId) {

                    embed.setTitle(":x: You're already in the queue!");

                    return message.channel.send(embed);
                }
            };


            if (ongoingGames.flat().map(e => e.id).includes(userId)) {

                embed.setTitle(":x: You are in the middle of a game!");

                return message.channel.send(embed);
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

                    // yes i know having lots of requests isnt good ill change when i can be fucked to

                    if (await dbCollection.find({
                            id: user.id
                        }).toArray().then(dataDB => dataDB.length === 0)) {
                        (async function () {
                            await dbCollection.insert(newUser);
                        })()
                    };

                    if (await dbCollection.find({
                            id: user.id,
                            ["servers.channelID"]: channel_ID
                        }).toArray().then(dataDB => dataDB.length === 0)) {

                        (async function () {
                            await dbCollection.update({
                                id: user.id
                            }, {
                                $push: {
                                    servers: {
                                        channelID: channel_ID,
                                        wins: 0,
                                        losses: 0
                                    }
                                }
                            });
                        })()

                    };
                };

                const valuesforpm = {
                    name: Math.floor(Math.random() * 99999),
                    password: Math.floor(Math.random() * 99999)
                };

                /*                embed.setTitle("A game has been made! Please select your preferred gamemode: Captains (c) or Random (r) ")

                                message.channel.send(embed).then(() => {
                                    message.channel.awaitMessages( { maxMatches: 1, time: 30000, errors: ['time'] })
                                        .then(collected => {
                                            console.log(collected)
                                        })

                                    });*/

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
    name: ['q', "status", "leave", "report", "score", "cancel"],
    description: '6man bot',
    execute
};

//captains
//cancel