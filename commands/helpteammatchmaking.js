const Discord = require('discord.js')

const discordEmbed = new Discord.MessageEmbed()

    .setAuthor("MatchMaker Bot Help Page", "https://i.ibb.co/4drZsvN/Screenshot-4.png")
    .setColor('#F8534F')
    .setTitle("Team Matchmaking")
    .addField("!createteam", "Creates a team, usage: !createteam Maniacs, the bot then creates a role with the teams name and assigns a Team Captain role to the person that created the team")
    .addField("!invite", "Invites an user, usage: !invite @dany")
    .addField("!jointeam", "Join a team that invited you, usage: !jointeam Maniacs")
    .addField("!pendinginvites", "Check who invited you!")
    .addField("!leaveteam", "Leave your team")
    .addField("!giveownership", "Gives team ownership to a specific user. Usage: !giveownership @dany")
    .addField("!kickplayer", "Kicks a player from your team, usage:!kickplayer @dany")
    .addField("!whois", "Check for a team members, usage: !whois Maniacs")
    .addField("!disband", "Deletes your team, admins can also delete a team by typing !disband teamname")
    .addField("Info for teams:", " ONLY the captain has acess to some commands like !q, !leave!, !cancel etc...")
    .addField("!q", 'Sign up for the next queue, to do this do !q and tag your 4 other teammates(2 if your channelmode is 3v3teams) example: !q @Dany @Johny @Tony @David (removes team after 45 minutes if no game has been made)')
    .addField("!leave", 'Leave the queue')
    .addField("!status", 'Check the queue status')
    .addField("!cancel", 'Cancel the game (Only use this in the case of someone not playing etc...)')
    .addField("!report win/lose", 'Ends the game, giving the wining team one win and vice versa to the losing team')
    .addField("!score me/channel", 'Checks your current score. Usage: !score channel to check score in the channel youre in, !score channel (channelid)to check the score in a specific channel, just add a number after it to select a page')
    .addField("!reset player/channel", `Resets the score of an individual player (!reset player <discordid>) or the whole channel where this command is inserted (!reset channel)`)
    .addField("!ongoinggames", `Check the current games!`)
    .addField("!revertgame", `Cancels/reverts score of a finished game. Usage: !revertgame (gameid) cancel, this example will cancel the game, as it never happen. !revertgame (gameid) revert, this example will revert the scores`)

module.exports = {
    name: 'helpteammatchmaking',
    description: 'Gievs you a nice command list',
    execute(message) {
        message.channel.send(discordEmbed)
    }
}