const Discord = require("discord.js")

const client = require("../client.js");

const MongoDB = require("../mongodb");

const db = MongoDB.getDB()

const serversCollection = db.collection('guilds')

const teamsCollection = db.collection('teams')

const CSGOMaps = ["Cache", "Dust II", "Inferno", "Mirage", "Train"]

const EMBED_COLOR_ERROR = "#F8534F";

const EMBED_COLOR_CHECK = "#77B255";

const EMBED_COLOR_WARNING = "#77B255";

const ongoingGames = []

const channelQueues = {};

const cancelQueue = {}

const avaiableGames = ["Valorant", "CSGO", "LeagueOfLegends"]

let gameCount = 0;

let storedTeams;

let storedGuilds;

let teamsInQueue = [];

const invites = {};

setInterval(async () => {

    let embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING)

    if (Object.entries(channelQueues).length !== 0) {
        for (let channel of Object.values(channelQueues)) {
            for (let team of channel) {
                if ((Date.now() - team[7]) > 45 * 60 * 1000) {

                    const actualChannel = await client.channels.fetch(Object.keys(channelQueues).find(key => channelQueues[key] === channel))

                    embedRemove.setTitle(`You were removed from the queue after no game has been made in 45 minutes!`)

                    await actualChannel.send(`<@${team[1]}>`)

                    actualChannel.send(embedRemove)

                    embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING)

                    channel.splice(channel.indexOf(team), 1)
                }
            }
        }
    }

    if (ongoingGames.length !== 0) {
        for (let games of ongoingGames) {
            if ((Date.now() - games[2].date) > 3 * 60 * 60 * 1000) {
                for (let channel of await client.channels.fetch(games[2].channel).then(e => e.guild.channels.cache.array())) {

                    if (channel.name === `🔸Team-${games[0][0]}-Game-${games[2].gameNumber}`) {

                        channel.delete();
                    }

                    if (channel.name === `🔹Team-${games[1][0]}-Game-${games[2].gameNumber}`) {

                        channel.delete();
                    }
                }

                embedRemove.setTitle(`:white_check_mark: Game ${games[2].gameNumber} Cancelled due to not being finished in 3 Hours!`)

                let index = ongoingGames.indexOf(games);

                const a = await client.channels.fetch(games[2].channel)

                a.send(embedRemove)

                ongoingGames.splice(index, 1)

                embedRemove = new Discord.MessageEmbed().setColor(EMBED_COLOR_WARNING)
            }
        }
    }
}, 60 * 1000)

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
    const arraywords = message.content.split(" ");
    return arraywords[0].substring(1);
}

const messageArgs = message => {
    return message.content.split(" ").slice(1).join(" ");
}

const execute = async (message) => {

    const getroleID = (name) => {
        return message.guild.roles.cache.find(e => e.name === name).id
    }

    const fetchFromID = async (id) => {
        return (await client.users.fetch(id).catch(error => {
            wrongEmbed.setTitle("Please tag the user");
            console.log(error)
            message.channel.send(wrongEmbed);
        }))
    }

    const channel_ID = message.channel.id;

    if (!Object.keys(channelQueues).includes(channel_ID)) {

        channelQueues[channel_ID] = [];
    }

    await serversCollection.find().toArray().then(dataDB => {
        storedGuilds = dataDB;
    })

    await teamsCollection.find().toArray().then(dataDB => {
        storedTeams = dataDB;
    })

    const secondArg = message.content.split(" ")[1];

    const thirdArg = message.content.split(" ")[2];

    const gameName = storedGuilds[storedGuilds.map(e => e.id).indexOf(message.guild.id)].game;

    const teamsArray = channelQueues[channel_ID];

    const userId = message.author.id;

    const getIDByTag = (tag) => {
        return tag.substring(3, tag.length - 1);
    }

    const teamsInsert = {
        name: messageArgs(message),
        channels: [],
        members: [
            userId
        ]
    }

    const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR)

    const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK)

    const isCaptain = () => {
        for (let team of storedTeams) {
            if (team.members.indexOf(userId) === 0) {
                return true;
            }
        }
    }

    const teamsInfo = () => {
        for (let team of storedTeams) {
            if (team.members.includes(userId)) {
                return team;
            }
        }
    }

    const teamsIngame = () => {
        teamsInQueue = [];
        for (let game of ongoingGames) {
            for (let stats of game) {
                if (typeof stats[0] == "string") {
                    teamsInQueue.push(stats[0]);
                }
            }
        }
        return teamsInQueue;
    }

    const givewinLose = async (score, pos) => {

        const channelPos = teamsInfo().channels.map(e => e.channelID).indexOf(channel_ID);

        const sort = `channels.${channelPos}.${score}`;

        const mmr = `channels.${channelPos}.mmr`

        for (let games of ongoingGames) {
            for (let team of storedTeams) {

                if (games[pos][0] === team.name && games.map(e => e[0]).includes(teamsInfo().name))
                    await teamsCollection.update({
                        name: games[pos][0]
                    }, {
                        $set: {
                            [sort]: team.channels[channelPos][score] + 1,
                            [mmr]: score === "wins" ? team.channels[channelPos].mmr + 13 : team.channels[channelPos].mmr - 10
                        }
                    });
            }
        }
    }

    if (!storedGuilds.map(e => e.id).includes(message.guild.id) && args(message) !== "game") {

        wrongEmbed.setTitle(`:x: You haven't set your game yet! Please ask an Admin to do !game ${avaiableGames.join(", ")}`);

        return message.channel.send(wrongEmbed);
    }

    switch (args(message)) {

        case "createteam": {

            if (messageArgs(message).length > 31) {
                wrongEmbed.setTitle(":x: Name too big! Maximum characters allowed are 32.");

                return message.channel.send(wrongEmbed);
            }

            if (messageArgs(message).length < 2) {
                wrongEmbed.setTitle(":x: Name too short! Minimum characters allowed are 3.");

                return message.channel.send(wrongEmbed);
            }

            if (storedTeams.map(e => e.name).includes(messageArgs(message))) {
                wrongEmbed.setTitle(":x: Name already in use");

                return message.channel.send(wrongEmbed);
            }

            if (storedTeams.map(e => e.members).flat().includes(userId)) {
                wrongEmbed.setTitle(":x: You already belong to a team!");

                return message.channel.send(wrongEmbed);
            }

            if (message.guild.roles.cache.array().map(e => e.name).includes(messageArgs(message))) {
                wrongEmbed.setTitle(":x: You can't name yourself after roles that already exist!");

                return message.channel.send(wrongEmbed);
            }

            teamsCollection.insert(teamsInsert);

            correctEmbed.setTitle(`:white_check_mark: ${messageArgs(message)} Created!`);

            await message.guild.roles.create({
                data: {
                    name: messageArgs(message),
                    color: 'BLUE',
                },
                reason: 'idk lol',
            }).catch(e => console.error(e))

            await message.member.roles.add(getroleID(messageArgs(message))).catch(e => console.error(e))

            return message.channel.send(correctEmbed);
        }

        case "disband": {

            if (messageArgs(message) !== "" && message.member.hasPermission("ADMINISTRATOR")) {

                if (!storedTeams.map(e => e.name).includes(messageArgs(message))) {

                    wrongEmbed.setTitle(`:x: Team does not exist!`);

                    return message.channel.send(wrongEmbed);
                }
                await teamsCollection.remove({
                    name: messageArgs(message)
                }, true);
            }


            if (teamsInfo() == undefined) {
                wrongEmbed.setTitle(`:x: You do not belong to a team!`);

                return message.channel.send(wrongEmbed);
            }

            if (!isCaptain()) {
                wrongEmbed.setTitle(":x: You are not the captain!");

                return message.channel.send(wrongEmbed);
            }

            for (let team of storedTeams) {
                if (team.members.indexOf(userId) === 0) {

                    message.guild.roles.cache.find(role => role.name === team.name).delete();

                    await teamsCollection.remove({
                        name: team.name
                    }, true);

                    correctEmbed.setTitle(`:white_check_mark: ${team.name} Deleted!`);

                    return message.channel.send(correctEmbed);
                }
            }
        }

        case "leaveteam": {

            if (!storedTeams.map(e => e.members).flat().includes(userId)) {
                wrongEmbed.setTitle(":x: You do not belong to a team");

                return message.channel.send(wrongEmbed);
            }

            const leftTeam = teamsInfo().name;

            await message.member.roles.remove(getroleID(teamsInfo().name)).catch(e => console.error(e))

            await teamsCollection.update({
                name: leftTeam
            }, {
                $pull: {
                    members: userId
                }
            });

            correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just left ${leftTeam}`);

            return message.channel.send(correctEmbed);
        }

        case "kickplayer": {

            if (!isCaptain()) {
                wrongEmbed.setTitle(":x: You are not the captain!");

                return message.channel.send(wrongEmbed);
            }

            const leftTeam = teamsInfo().name;

            await message.guild.members.fetch(getIDByTag(secondArg)).then(e => {
                e.roles.remove(getroleID(teamsInfo().name)).catch(e => console.error(e))
            })

            await teamsCollection.update({
                name: leftTeam
            }, {
                $pull: {
                    members: getIDByTag(secondArg)
                }
            });

            correctEmbed.setTitle(`:white_check_mark: ${message.author.username} just kicked ${(await fetchFromID(getIDByTag(secondArg))).username} from ${leftTeam}`);

            return message.channel.send(correctEmbed);
        }

        case "whois": {

            if (messageArgs(message) == undefined) {
                wrongEmbed.setTitle(":x: Please specify the team.");

                return message.channel.send(wrongEmbed);
            }

            if (!storedTeams.map(e => e.name).includes(messageArgs(message))) {
                wrongEmbed.setTitle(":x: This team doesn't exist")

                return message.channel.send(wrongEmbed);
            }

            wrongEmbed.setTitle(storedTeams[storedTeams.map(e => e.name).indexOf(messageArgs(message))].name)

            let memberNames = [];

            for (let id of storedTeams[storedTeams.map(e => e.name).indexOf(messageArgs(message))].members) {

                memberNames.push((await fetchFromID(id)).username);
            }

            wrongEmbed.addField("Members:", memberNames.join(", "))

            memberNames = [];

            return message.channel.send(wrongEmbed);
        }

        case "invite": {

            if (!isCaptain()) {
                wrongEmbed.setTitle(":x: You are not the captain!");

                return message.channel.send(wrongEmbed);
            }

            if (!Object.keys(invites).includes(teamsInfo().name)) {

                invites[teamsInfo().name] = []
            }

            if (invites[teamsInfo().name].includes(getIDByTag(secondArg))) {
                wrongEmbed.setTitle(`:x: ${ (await fetchFromID(getIDByTag(secondArg))).username} was already invited`);

                return message.channel.send(wrongEmbed);
            }

            if (storedTeams.map(e => e.members).flat().includes(getIDByTag(secondArg))) {
                wrongEmbed.setTitle(":x: User already belongs to a team!");

                return message.channel.send(wrongEmbed);
            }

            correctEmbed.setTitle(`:white_check_mark: Invited ${ (await fetchFromID(getIDByTag(secondArg))).username} to ${teamsInfo().name}!`);

            invites[teamsInfo().name].push(getIDByTag(secondArg));

            return message.channel.send(correctEmbed);
        }

        case "jointeam": {
            if (storedTeams.map(e => e.members).flat().includes(userId)) {
                wrongEmbed.setTitle(":x: You already belong to a team!")

                return message.channel.send(wrongEmbed);
            }

            if (!storedTeams.map(e => e.name).includes(messageArgs(message))) {
                wrongEmbed.setTitle(":x: This team doesn't exist")

                return message.channel.send(wrongEmbed);
            }

            if (!Object.keys(invites).includes(messageArgs(message))) {
                wrongEmbed.setTitle(":x: This team didn't invite anyone!")

                return message.channel.send(wrongEmbed);
            }

            if (!invites[messageArgs(message)].includes(userId)) {
                wrongEmbed.setTitle(":x: This team didn't invite you!");

                return message.channel.send(wrongEmbed)
            }
            await teamsCollection.update({
                name: messageArgs(message)
            }, {
                $push: {
                    members: userId
                }
            });

            invites[messageArgs(message)].splice(invites[messageArgs(message)].indexOf(userId), 1)

            await message.member.roles.add(getroleID(messageArgs(message))).catch(e => console.error(e))

            correctEmbed.setTitle(`:white_check_mark: ${message.author.username} joined ${messageArgs(message)}!`)

            return message.channel.send(correctEmbed);
        }

        case "game": {
            if (!avaiableGames.includes(secondArg)) {

                wrongEmbed.setTitle(":x: Invalid argument")

                return message.channel.send(wrongEmbed);
            }

            if (storedGuilds.map(e => e.id).includes(message.guild.id) && message.member.hasPermission("ADMINISTRATOR") && avaiableGames.includes(secondArg)) {

                await serversCollection.update({
                    id: message.guild.id
                }, {
                    $set: {
                        game: secondArg
                    }
                });
                correctEmbed.setTitle(":white_check_mark: Game updated!")

                return message.channel.send(correctEmbed);
            }
        }

        case "leave": {

            if (!isCaptain()) {
                wrongEmbed.setTitle(":x: You are not the captain!");

                return message.channel.send(wrongEmbed);
            }

            if (teamsArray.length === 2) {

                wrongEmbed.setTitle(":x: You can't leave now!");

                return message.channel.send(wrongEmbed);
            }

            if (teamsArray.length === 0) {

                wrongEmbed.setTitle(":x: You aren't in the queue!");

                return message.channel.send(wrongEmbed);

            };

            if (teamsArray[0][0] === teamsInfo().name) {

                teamsArray.splice(0, teamsArray.length);

                correctEmbed.setTitle(`:white_check_mark: ${teamsInfo().name} left the queue! ${teamsArray.length}/2`);

                return message.channel.send(correctEmbed);
            };
        }

        case "status": {

            wrongEmbed.setTitle(`Team in queue: ${teamsArray[0][0]}`);

            wrongEmbed.addField(`Players:`, `<@${teamsArray[0][1]}>, <@${teamsArray[0][2]}>, <@${teamsArray[0][3]}>, <@${teamsArray[0][4]}>, <@${teamsArray[0][5]}>`);

            return message.channel.send(wrongEmbed);
        }

        case "pendinginvites": {

            if (Object.keys(invites).filter(e => invites[e].includes(userId)).length === 0) {

                wrongEmbed.setTitle(`:x: You have no pending invites.`);

                return message.channel.send(wrongEmbed);
            }

            wrongEmbed.setTitle(`Pending Invites:`);

            wrongEmbed.setDescription(Object.keys(invites).filter(e => invites[e].includes(userId)).join(", "), "Show what you can do in order to get more invites!");

            return message.channel.send(wrongEmbed);
        }

        case "report": {

            if (!isCaptain()) {
                wrongEmbed.setTitle(":x: You are not the captain!");

                return message.channel.send(wrongEmbed);
            }

            if (!teamsIngame().includes(teamsInfo().name) || ongoingGames.length === 0) {

                wrongEmbed.setTitle(":x: You aren't in a game!");

                return message.channel.send(wrongEmbed);
            }

            switch (messageEndswith(message)) {
                case "win": {

                    for (let games of ongoingGames) {

                        if (!games[0][0] === teamsInfo().name || !games[1][0] === teamsInfo().name) {

                            continue;
                        }

                        correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

                        if (teamsInQueue.indexOf(teamsInfo().name) % 2 === 0) {

                            givewinLose("wins", 0);

                            givewinLose("losses", 1);
                        } else {
                            givewinLose("wins", 1);

                            givewinLose("losses", 0);
                        }

                        let index = ongoingGames.indexOf(games);

                        ongoingGames.splice(index, 1);

                        for (let channel of message.guild.channels.cache.array()) {

                            if (channel.name === `🔸Team-${games[0][0]}-Game-${games[2].gameNumber}`) {

                                channel.delete();
                            }

                            if (channel.name === `🔹Team-${games[1][0]}-Game-${games[2].gameNumber}`) {

                                channel.delete();
                            }
                        }

                        return message.channel.send(correctEmbed);
                    }
                }

                case "lose": {

                    for (let games of ongoingGames) {

                        if (!games[0][0] === teamsInfo().name || !games[1][0] === teamsInfo().name) {

                            continue;
                        }

                        correctEmbed.setTitle(":white_check_mark: Game Completed! Thank you for Playing!");

                        if (teamsInQueue.indexOf(teamsInfo().name) % 2 === 0) {

                            givewinLose("wins", 1);

                            givewinLose("losses", 0);
                        } else {
                            givewinLose("wins", 0);

                            givewinLose("losses", 1);
                        }

                        let index = ongoingGames.indexOf(games);

                        ongoingGames.splice(index, 1);

                        for (let channel of message.guild.channels.cache.array()) {

                            if (channel.name === `🔸Team-${games[0][0]}-Game-${games[2].gameNumber}`) {

                                channel.delete();
                            }

                            if (channel.name === `🔹Team-${games[1][0]}-Game-${games[2].gameNumber}`) {

                                channel.delete();
                            }
                        }

                        return message.channel.send(correctEmbed);
                    }
                }
                default: {
                    wrongEmbed.setTitle(":x: Invalid Parameters!")
                    return message.channel.send(wrongEmbed);
                }
            }
        }

        case "cancel": {

            if (!isCaptain()) {
                wrongEmbed.setTitle(":x: You are not the captain!");

                return message.channel.send(wrongEmbed);
            }

            if (!teamsIngame().includes(teamsInfo().name) || ongoingGames.length === 0) {

                wrongEmbed.setTitle(":x: You aren't in a game!");

                return message.channel.send(wrongEmbed);
            }

            for (let games of ongoingGames) {

                if (!games[0][0] === teamsInfo().name || !games[1][0] === teamsInfo().name) {

                    continue
                }

                const IDGame = games[2].gameNumber.toString();

                if (!Object.keys(cancelQueue).includes(IDGame)) {

                    cancelQueue[IDGame] = [];
                }

                const cancelqueuearray = cancelQueue[IDGame]

                if (cancelqueuearray.includes(teamsInfo().name)) {
                    wrongEmbed.setTitle(":x: You've already voted to cancel!");

                    return message.channel.send(wrongEmbed);
                }

                cancelqueuearray.push(teamsInfo().name);

                wrongEmbed.setTitle(`:exclamation: ${teamsInfo().name} wants to cancel game ${IDGame}. (${cancelqueuearray.length}/2)`);

                message.channel.send(wrongEmbed);

                if (cancelqueuearray.length === 2) {

                    for (let channel of message.guild.channels.cache.array()) {

                        if (channel.name === `🔸Team-${games[0][0]}-Game-${IDGame}`) {

                            channel.delete();
                        }

                        if (channel.name === `🔹Team-${games[1][0]}-Game-${IDGame}`) {

                            channel.delete();
                        }
                    }

                    correctEmbed.setTitle(`:white_check_mark: Game ${IDGame} Cancelled!`);

                    let index = ongoingGames.indexOf(games);

                    cancelQueue[IDGame] = [];

                    ongoingGames.splice(index, 1);

                    return message.channel.send(correctEmbed);
                }

            }
        }

        case "score": {
            switch (secondArg) {
                case "me": {
                    if (!storedTeams.map(e => e.name).includes(teamsInfo().name)) {

                        wrongEmbed.setTitle(":x: You haven't played any games yet!");

                        return message.channel.send(wrongEmbed);
                    }

                    for (let j = 0; j < storedTeams.length; j++) {

                        if (storedTeams[j].name === teamsInfo().name) {

                            const scoreDirectory = storedTeams[j].channels[storedTeams[j].channels.map(e => e.channelID).indexOf(message.channel.id)]

                            if (scoreDirectory === undefined) {

                                wrongEmbed.setTitle(":x: You haven't played any games in here yet!");

                                return message.channel.send(wrongEmbed);
                            }

                            wrongEmbed.addField("Wins:", scoreDirectory.wins);

                            wrongEmbed.addField("Losses:", scoreDirectory.losses);

                            wrongEmbed.addField("Winrate:", isNaN(Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100)) ? "0%" : Math.floor((scoreDirectory.wins / (scoreDirectory.wins + scoreDirectory.losses)) * 100) + "%");

                            wrongEmbed.addField("MMR:", scoreDirectory.mmr)

                            return message.channel.send(wrongEmbed);
                        }
                    }
                }

                case "channel": {

                    if (!message.member.hasPermission("ADMINISTRATOR")) {

                        wrongEmbed.setTitle(":x: You do not have Administrator permission!")

                        return message.channel.send(wrongEmbed)
                    }

                    storedTeams = storedTeams.filter(a => a.channels.map(e => e.channelID).indexOf(thirdArg) !== -1 && a.channels[a.channels.map(e => e.channelID).indexOf(thirdArg)].wins + a.channels[a.channels.map(e => e.channelID).indexOf(thirdArg)].losses !== 0)

                    if (storedTeams.length === 0) {
                        wrongEmbed.setTitle(":x: No games have been played in here!");

                        return message.channel.send(wrongEmbed);
                    }

                    storedTeams.sort((a, b) => {
                        const indexA = a.channels.map(e => e.channelID).indexOf(thirdArg);

                        const indexB = b.channels.map(e => e.channelID).indexOf(thirdArg);

                        return b.channels[indexB].mmr - a.channels[indexA].mmr
                    })
                    //maybe add something like get score channel on the channel that you are and on nother channels and, instead of just typing the id, type the name aka optimize
                    if (!isNaN(fourthArg) && fourthArg > 0) {
                        let indexes = 20 * (fourthArg - 1);
                        for (indexes; indexes < 20 * fourthArg; indexes++) {
                            if (storedTeams[indexes] == undefined) {

                                correctEmbed.addField(`No more members to list in this page!`, "Encourage your friends to play!");

                                break
                            }
                            for (let channels of storedTeams[indexes].channels) {
                                if (channels.channelID === thirdArg) {

                                    correctEmbed.addField(storedTeams[indexes].name, `Wins: ${channels.wins} | Losses: ${channels.losses} | Winrate: ${isNaN(Math.floor((channels.wins/(channels.wins + channels.losses)) * 100))? "0" : Math.floor((channels.wins/(channels.wins + channels.losses)) * 100)}% | MMR: ${channels.mmr}`)

                                    correctEmbed.setFooter(`Showing page ${fourthArg}/${Math.ceil(storedTeams.length / 20)}`);
                                }
                            }
                        }
                    } else {
                        for (i = 0; i < 20; i++) {
                            if (storedTeams[i] == undefined) {
                                correctEmbed.addField(`No more members to list in this page!`, "Encourage your friends to play!");
                                break
                            }
                            for (let channels of storedTeams[i].channels) {
                                if (channels.channelID === thirdArg) {

                                    correctEmbed.addField(storedTeams[i].name, `Wins: ${channels.wins} | Losses: ${channels.losses} | Winrate: ${isNaN(Math.floor((channels.wins/(channels.wins + channels.losses)) * 100))? "0" : Math.floor((channels.wins/(channels.wins + channels.losses)) * 100)}% | MMR: ${channels.mmr} `)

                                    correctEmbed.setFooter(`Showing page ${1}/${Math.ceil(storedTeams.length / 20)}`);
                                }
                            }
                        }
                    }
                    message.channel.send(correctEmbed)
                }
            }
            break;
        }

        case "ongoinggames": {

            if (ongoingGames.length === 0) {
                wrongEmbed.setTitle(":x: No games are currently having place!");

                return message.channel.send(wrongEmbed);
            }

            for (i = 0; i < 20; i++) {

                const game = ongoingGames[i]

                if (game == undefined) {
                    wrongEmbed.addField(`No more games to list `, "Encourage your friends to play!");
                    break
                }

                if (game[2].channel === channel_ID) {

                    wrongEmbed.addField(`Game :`, game[2].gameNumber)

                    wrongEmbed.addField(`🔸 Team: ${game[0][0]}`, `<@${game[0][1]}>, <@${game[0][2]}>, <@${game[0][3]}>, <@${game[0][4]}>, <@${game[0][5]}>`);
                    wrongEmbed.addField(`🔹 Team: ${game[1][0]}`, `<@${game[1][1]}>, <@${game[1][2]}>, <@${game[1][3]}>, <@${game[1][4]}>, <@${game[1][5]}>`);

                    wrongEmbed.setFooter(`Showing page ${1}/${Math.ceil(ongoingGames.length / 20)}`);
                }
            }
            return message.channel.send(wrongEmbed);
        }

        case "reset": {
            if (message.content.split(" ").length === 1) {

                wrongEmbed.setTitle(":x: Invalid Parameters!");

                return message.channel.send(wrongEmbed);
            }

            if (!message.member.hasPermission("ADMINISTRATOR")) {

                wrongEmbed.setTitle(":x: You do not have Administrator permission!");

                return message.channel.send(wrongEmbed);
            }

            switch (secondArg) {
                case "channel": {
                    if (message.content.split(" ").length !== 2) {

                        wrongEmbed.setTitle(":x: Invalid Parameters!")

                        return message.channel.send(wrongEmbed)
                    }

                    for (let team of storedTeams) {

                        const channelPos = team.channels.map(e => e).map(e => e.channelID).indexOf(channel_ID);

                        if (channelPos !== -1) {

                            await teamsCollection.update({
                                name: team.name
                            }, {
                                $pull: {
                                    channels: {
                                        channelID: channel_ID
                                    }
                                }
                            });
                        };
                    };

                    correctEmbed.setTitle(":white_check_mark: Player's score reset!");

                    return message.channel.send(correctEmbed);
                }
                case "team": {
                    if (message.content.split(" ").length !== 3) {

                        wrongEmbed.setTitle(":x: Invalid Parameters!");

                        return message.channel.send(wrongEmbed)

                    }

                    const channelPos = storedTeams[storedTeams.map(e => e.name).indexOf(thirdArg)].channels.map(e => e.channelID).indexOf(channel_ID)

                    if (channelPos == -1) {

                        wrongEmbed.setTitle(":x: This user hasn't played any games in this channel!")

                        return message.channel.send(wrongEmbed)
                    } else {
                        await teamsCollection.update({
                            name: thirdArg
                        }, {
                            $pull: {
                                channels: {
                                    channelID: channel_ID
                                }
                            }
                        });
                    }

                    correctEmbed.setTitle(":white_check_mark: Player's score reset!");

                    return message.channel.send(correctEmbed);
                }
                default: {
                    wrongEmbed.setTitle(":x: Invalid Parameters!");

                    return message.channel.send(wrongEmbed);
                }
            }
        }

        case "q": {

            if (!isCaptain()) {
                wrongEmbed.setTitle(":x: You are not the captain!");

                return message.channel.send(wrongEmbed);
            }

            for (let a of teamsArray) {
                if (a[0] === teamsInfo().name) {

                    wrongEmbed.setTitle(":x: You're already in the queue!");

                    return message.channel.send(wrongEmbed);
                }

            }

            for (let games of ongoingGames) {
                if (games[0][0] === teamsInfo().name && games[1][0] === teamsInfo().name) {

                    wrongEmbed.setTitle(":x: You are in the middle of a game!");

                    return message.channel.send(wrongEmbed);
                };
            }

            if (teamsInfo().members.length < 5) {

                wrongEmbed.setTitle(":x: You need at least 5 members on your team to join the queue");

                return message.channel.send(wrongEmbed);
            }

            if (message.content.split(" ").length !== 5) {

                wrongEmbed.setTitle(":x: Please tag 4 teammates that you want to play with");

                return message.channel.send(wrongEmbed);
            }

            for (let user of message.content.split(" ").splice(1, 4)) {
                if (!teamsInfo().members.includes(getIDByTag(user))) {
                    wrongEmbed.setTitle(`:x: ${(await fetchFromID(getIDByTag(user))).username} is not in your team!`);

                    return message.channel.send(wrongEmbed);
                }
            }

            if (message.content.split(" ").length > 5) {
                wrongEmbed.setTitle(":x: Please tag your 4 other teammates");

                return message.channel.send(wrongEmbed);
            }

            teamsArray.push([teamsInfo().name, userId]);

            for (let user of message.content.split(" ").splice(1, 4)) {
                if (teamsArray.length === 1) {
                    teamsArray[0].push(getIDByTag(user));
                } else {
                    teamsArray[1].push(getIDByTag(user));
                }

            }
            if (teamsArray.length === 1) {
                teamsArray[0].push(new Date());
            } else {
                teamsArray[1].push(new Date());
            }

            correctEmbed.setTitle(`:white_check_mark: Added to queue! ${teamsArray.length}/2`);

            message.channel.send(correctEmbed);

            if (teamsArray.length === 2) {

                const valuesforpm = {
                    name: Math.floor(Math.random() * 99999),
                    password: Math.floor(Math.random() * 99999)
                };

                shuffle(teamsArray)

                teamsArray.push({
                    gameNumber: gameCount,
                    channel: channel_ID,
                    date: new Date()
                })

                for (let team of teamsArray) {
                    if (await teamsCollection.find({
                            name: team[0],
                            ["channels.channelID"]: channel_ID
                        }).toArray().then(dataDB => dataDB.length === 0)) {

                        (async function () {
                            await teamsCollection.update({
                                name: team[0]
                            }, {
                                $push: {
                                    channels: {
                                        channelID: channel_ID,
                                        wins: 0,
                                        losses: 0,
                                        mmr: 1000
                                    }
                                }
                            });
                        })()
                    };
                }

                message.channel.send(`<@${teamsArray[0][1]}>, <@${teamsArray[0][2]}>, <@${teamsArray[0][3]}>, <@${teamsArray[0][4]}>, <@${teamsArray[0][5]}>, <@${teamsArray[1][1]}>, <@${teamsArray[1][2]}>, <@${teamsArray[1][3]}>, <@${teamsArray[1][4]}>, <@${teamsArray[1][5]}>`)

                ongoingGames.push([...teamsArray]);

                const discordEmbed1 = new Discord.MessageEmbed()
                    .setColor(EMBED_COLOR_CHECK)
                    .addField("Game is ready:", `Game ID is: ${gameCount}`)
                    .addField(`:small_orange_diamond: Team ${teamsArray[0][0]}`, `<@${teamsArray[0][1]}>, <@${teamsArray[0][2]}>, <@${teamsArray[0][3]}>, <@${teamsArray[0][4]}>, <@${teamsArray[0][5]}>,`)
                    .addField(`:small_blue_diamond: Team ${teamsArray[1][0]}`, `<@${teamsArray[1][1]}>, <@${teamsArray[1][2]}>, <@${teamsArray[1][3]}>, <@${teamsArray[1][4]}>, <@${teamsArray[1][5]}>`);

                if (gameName !== "LeagueOfLegends") {

                    discordEmbed1.addField(`Map: ${gameName === "Valorant" ? "veto(each team bans a map, with the first team choosing the first ban)" : CSGOMaps[Math.floor(Math.random() * CSGOMaps.length)]}`, `Please organize a match with your teammates and opponents. ${teamsArray[0][0]} attacks and ${teamsArray[1][0]} defends. Good luck!`)
                }

                message.channel.send(discordEmbed1);

                if (gameName === "LeagueOfLegends") {

                    const JoinMatchEmbed = new Discord.MessageEmbed()
                        .setColor(EMBED_COLOR_CHECK)
                        .addField("Name:", valuesforpm.name)
                        .addField("Password:", valuesforpm.password)
                        .addField("You have to:", `Join match(Created by ${teamsArray[0].name})`);

                    for (let users of teamsArray) {
                        if (users.id !== teamsArray[0].id && users.id !== teamsArray[10].id) {

                            await client.users.fetch(users.id).send(JoinMatchEmbed).catch(error => {
                                const errorEmbed = new Discord.MessageEmbed()
                                    .setColor(EMBED_COLOR_ERROR)
                                    .setTitle(`:x: Couldn't sent message to ${users.name}, please check if your DM'S aren't set to friends only.`);

                                console.error(error);

                                message.channel.send(errorEmbed)
                            });
                        };
                    };

                    const CreateMatchEmbed = new Discord.MessageEmbed()
                        .setColor(EMBED_COLOR_CHECK)
                        .addField("Name:", valuesforpm.name)
                        .addField("Password:", valuesforpm.password)
                        .addField("You have to:", "Create Custom Match");

                    await client.users.fetch(teamsArray[0].id).send(CreateMatchEmbed).catch(error => {
                        const errorEmbed = new Discord.MessageEmbed()
                            .setColor(EMBED_COLOR_ERROR)
                            .setTitle(`:x: Couldn't sent message to ${teamsArray[0].name}, please check if your DM'S aren't set to friends only.`);

                        message.channel.send(errorEmbed)
                        console.error(error);
                    });
                }

                message.guild.channels.create(`🔸Team-${teamsArray[0][0]}-Game-${gameCount}`, {
                        type: 'voice',
                        parent: message.channel.parentID,
                        permissionOverwrites: [{
                                id: message.guild.id,
                                deny: "CONNECT"
                            },
                            {
                                id: teamsArray[0][1],
                                allow: "CONNECT"
                            },
                            {
                                id: teamsArray[0][2],
                                allow: "CONNECT"
                            },
                            {
                                id: teamsArray[0][3],
                                allow: "CONNECT"
                            },
                            {
                                id: teamsArray[0][4],
                                allow: "CONNECT"
                            },
                            {
                                id: teamsArray[0][5],
                                allow: "CONNECT"
                            }
                        ]
                    })
                    .catch(error => {
                        const errorEmbed = new Discord.MessageEmbed()
                            .setColor(EMBED_COLOR_ERROR)
                            .setTitle(`:x: You shouldn't be getting this message, if you do tag tweeno`);

                        message.channel.send(errorEmbed)
                        console.error(error);
                    })

                message.guild.channels.create(`🔹Team-${teamsArray[1][0]}-Game-${gameCount}`, {
                        type: 'voice',
                        parent: message.channel.parentID,
                        permissionOverwrites: [{
                                id: message.guild.id,
                                deny: "CONNECT"
                            },
                            {
                                id: teamsArray[1][1],
                                allow: "CONNECT"
                            },
                            {
                                id: teamsArray[1][2],
                                allow: "CONNECT"
                            },
                            {
                                id: teamsArray[1][3],
                                allow: "CONNECT"
                            },
                            {
                                id: teamsArray[1][4],
                                allow: "CONNECT"
                            },
                            {
                                id: teamsArray[1][5],
                                allow: "CONNECT"
                            }
                        ]
                    })
                    .catch(error => {
                        const errorEmbed = new Discord.MessageEmbed()
                            .setColor(EMBED_COLOR_ERROR)
                            .setTitle(`:x: You shouldn't be getting this message, if you do tag tweeno`);

                        message.channel.send(errorEmbed)
                        console.error(error);
                    })

                teamsArray.splice(0, teamsArray.length);

                gameCount++
            };
        };
    };
};

module.exports = {
    name: ['q', "status", "leave", "report", "score", "cancel", "reset", "game", "whitelist", "ongoinggames", "createteam", "invite", "disband", "jointeam", "pendinginvites", "leaveteam", "whois", "kickplayer", "mode"],
    description: '6man bot',
    execute
};