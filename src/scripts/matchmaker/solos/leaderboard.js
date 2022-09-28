const Discord = require("discord.js");

const MatchmakerUsersScoreCollection = require("../../../utils/schemas/matchmakerUsersScoreSchema");

const { sendReply, EMBED_COLOR_CHECK, EMBED_COLOR_ERROR, getContent } = require("../../../utils/utils");

const execute = async (interaction) => {
  const wrongEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_ERROR);

  const correctEmbed = new Discord.MessageEmbed().setColor(EMBED_COLOR_CHECK);

  const [secondArg, thirdArg, fourthArg] = getContent(interaction);

  const channelId = interaction.channel.id;

  const userId = interaction.member.id;
  switch (secondArg) {
    case "me": {
      const user = await MatchmakerUsersScoreCollection.findOne({
        userId,
        channelId,
      });

      if (!user) {
        wrongEmbed.setTitle(":x: You haven't played any games yet!");

        await sendReply(interaction, wrongEmbed);
        return;
      }

      correctEmbed.addField("Wins:", user.wins.toString());

      correctEmbed.addField("Losses:", user.losses.toString());

      correctEmbed.addField(
        "Winrate:",
        Number.isNaN(Math.floor((user.wins / (user.wins + user.losses)) * 100))
          ? "0%"
          : `${Math.floor((user.wins / (user.wins + user.losses)) * 100)}%`
      );

      correctEmbed.addField("MMR:", user.mmr.toString());

      await sendReply(interaction, correctEmbed);
      return;
    }
    case "channel": {
      let skipCount = thirdArg;

      if (Number.isNaN(Number(thirdArg)) || !thirdArg || thirdArg <= 1) {
        skipCount = 1;
      }

      if (fourthArg != null && !interaction.guild.channels.cache.map((e) => e.id).includes(fourthArg)) {
        wrongEmbed.setTitle(":x: That channel does not belong to this server, or the channel is not in the bot cache!");

        await sendReply(interaction, wrongEmbed);
        return;
      }

      const storedUsersList = await MatchmakerUsersScoreCollection.find({
        channelId: fourthArg ?? channelId,
      })
        .sort({ mmr: -1 })
        .skip(10 * (skipCount - 1))
        .limit(10);

      if (storedUsersList.length === 0) {
        wrongEmbed.setTitle(`:x: No games have been played in ${skipCount !== 1 ? "this page" : "here"}!`);

        await sendReply(interaction, wrongEmbed);
        return;
      }

      const storedUsersCount = await MatchmakerUsersScoreCollection.countDocuments({
        channelId: fourthArg ?? channelId,
      });

      storedUsersList.forEach((user) => {
        const winrate = user.losses === 0 ? 100 : Math.floor((user.wins / (user.wins + user.losses)) * 100);
        correctEmbed.addField(
          user.username,
          `Wins: ${user.wins} | Losses: ${user.losses} | Winrate: ${winrate}% | MMR: ${user.mmr}`
        );
        correctEmbed.setFooter({ text: `Showing page ${skipCount}/${Math.ceil(storedUsersCount / 10)}` });
      });

      await sendReply(interaction, correctEmbed);
      break;
    }
    default: {
      wrongEmbed.setTitle(
        "Invalid Parameters, please use /leaderboard <me/channel> <page>(optional) <channelId>(optional)"
      );

      await sendReply(interaction, wrongEmbed);
    }
  }
};

module.exports = {
  name: "leaderboard",
  description: "Checks your current score",
  helpDescription:
    "Checks your current score. Usage: /leaderboard channel <page> (default is 1) to check score in the channel youre in, /leaderboard channel <page> <channelid> to check the score of another channel, or /leaderboard me to check your current score",
  args: [
    { name: "leaderboard_type", description: "channel or me", required: true, type: "string" },
    { name: "page", description: "page", required: false, type: "string" },
    { name: "channel_id", description: "channelId", required: false, type: "string" },
  ],
  execute,
};
