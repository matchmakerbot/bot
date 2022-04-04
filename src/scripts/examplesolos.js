const Discord = require("discord.js");

const { sendReply } = require("../utils/utils");

const discordEmbed = new Discord.MessageEmbed()

  .setAuthor({ name: "Matchmaker Bot Help Page", iconURL: "https://i.ibb.co/4drZsvN/Screenshot-4.png" })
  .setColor("#F8534F")
  .setTitle("Matchmaking example")
  .setDescription(
    "Alright, let's say you want to start using the bot, how to start? Easy, we just do \"/queueType 6 solos\" if we want to do a 3v3 game, or for example 8, if we want a 4v4 game, etc...\n Now, we're ready to start a game, so we just do /q and we wait for x amount of people to also join the queue (you can also type /leave to leave the queue or /status to check the people in the queue), once they do, the bot will give you the option to play in randoms mode(random teams), captains(bot randomly chooses 2 captains and dms them so they can pick players) or balanced mode(balances teams by mmr). And after this you can start playing!\n Now, let's say the game is over, after this only one person needs to do /report win (if they won) or /report lose (if they lost), OR /cancel to cancel the match, but this needs numberOfPeopleInQueue + 1 to cancel, but an admin can do /cancel force gameId\n What if someone lost/ didnt play, and reported as a win? In this case, an admin can do /changegame gameid revert/cancel to cancel or revert the game, so this way people dont fake vote\n To check your score, or the score of the channel you're in, just do /leaderboard me, or /leaderboard channel <page>(default is 1), but if you want to check on a different channel, just do /leaderboard channel <page> <channelid> and to check the current games on that channel, just do /ongoinggames. If you want to reset the score of an individual player, you can also do /reset player discordid, or if you want to reset the whole channel, just do /reset channel"
  )
  .setTimestamp();

module.exports = {
  name: "examplesolos",
  description: "Gives you an example of how to use the solos version for the bot.",
  execute(interaction) {
    sendReply(interaction, discordEmbed);
  },
};
