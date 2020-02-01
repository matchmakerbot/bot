const fs = require("fs");

const path = require("path");

const Discord = require("discord.js")

const client = require("../client.js");

const data = fs.readFileSync(path.join(__dirname, "sixmansdata.json"));

const storedData = JSON.parse(data);

const EMBED_COLOR = "#F8534F";

let ongoingGames = [];

let channelQueues = {
    '581097385367830568': [],
    '581097686342828052': [],
    '581097804890374154': [],
    '581097957257117707': [],
    '627260315851030530': [],
    '615184953721880617': [],
    '228581667038691329': []
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

const givewinLose = (score) => {
    for (let games of ongoingGames) {
        for (let j = 0; j < storedData.length; j++) {
            if (storedData[j].id === games[i].id /*&& storedData[j].id !== undefined*/ ) {

                storedData[j][score]++;

                const returnstring = JSON.stringify(storedData);

                fs.writeFileSync(path.join(__dirname, "sixmansdata.json"), returnstring);
            }
        }
    }
}

function messageEndswith(message) {

    const split = message.content.split(" ");

    return split[split.length - 1];
};

const args = message => {
    const arraywords = message.content.split(" ")
    return arraywords[0].substring(1)
}

const execute = (message) => {

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
                            }
                        }
        
                        let index = ongoingGames.indexOf(games);
        
                        ongoingGames.splice(index, 1);
        
                        return message.channel.send(embed);
                    }
                }
            }
        }

        case "score": {

            if (!storedData.map(e => e.id).includes(userId)) {

                embed.setTitle(":x: You haven't played any games yet!");

                return message.channel.send(embed);
            }

            for (let j = 0; j < storedData.length; j++) {
                if (storedData[j].id === userId) {

                    embed.addField("Wins:", storedData[j].wins);

                    embed.addField("Losses:", storedData[j].losses);

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
                        wins: 0,
                        losses: 0
                    };
        
                    if (!storedData.map(e => e.id).includes(user.id)) {
        
                        storedData.push(newUser);
        
                        const returnstring = JSON.stringify(storedData);
        
                        fs.writeFileSync(path.join(__dirname, "sixmansdata.json"), returnstring);
                    };
                };
        
                const valuesforpm = {
                    name: Math.floor(Math.random() * 99999),
                    password: Math.floor(Math.random() * 99999)
                };
        
                shuffle(sixmansarray);
        
                ongoingGames.push([...sixmansarray]);
        
                const discordEmbed1 = new Discord.RichEmbed()
                    .setColor(EMBED_COLOR)
                    .addField("Game is ready:", "Join your team's chat")
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
                    if (users.id !== sixmansarray[0].id) {
        
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
//voice chat