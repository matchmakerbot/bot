const Discord = require("discord.js");

const rp = require("request-promise-native");

const execute = (message) => {
  function WordCount() {
    const split2 = message.content;
    return split2.split(" ").length;
  }

  const discordEmbed = new Discord.MessageEmbed().setColor("#F8534F");

  if (WordCount() > 2) {
    discordEmbed.setTitle(":x: Please only insert one word.");
    return message.channel.send(discordEmbed);
  }

  function messageEndswith() {
    const split = message.content.split(" ");

    return split[split.length - 1];
  }

  if (WordCount() === 1) {
    discordEmbed.setDescription(":x: Please specify the subreddit you want to search.");
    return message.channel.send(discordEmbed);
  }

  rp(`https://www.reddit.com/r/${messageEndswith()}.json?limit=1000`)
    .then((response) => {
      const subreddit = JSON.parse(response);

      if (messageEndswith() === "fiftyfifty123") {
        message.channel.send("Let's not do that");
      }
      const { data } = subreddit;

      const childrenConst = data.children;

      const randomnumber = Math.floor(Math.random() * childrenConst.length);

      if (subreddit.error === 404 || data.children.length === 0) {
        discordEmbed.setTitle(":x: Error. Either the subreddit doesn't exist or Reddit made a Fuckie Wookie.");

        return message.channel.send(discordEmbed);
      }
      const nsfwpost = subreddit.data.children[randomnumber].data.over_18;

      if (nsfwpost && !message.channel.nsfw) {
        discordEmbed.setDescription(":warning: This channel does not have a NSFW tag!");
        return message.channel.send(discordEmbed);
      }
      if (nsfwpost && message.channel.id === "416015319736385547") {
        discordEmbed.setTitle(
          ":warning: This subreddit is disabled in this channel. If you think this shouldn't be happening please ping Tweeno"
        );
        return message.channel.send(discordEmbed);
      }

      if (
        subreddit.data.children[randomnumber].data.is_self &&
        childrenConst[randomnumber].data.selftext.length > 2048
      ) {
        const first2048 = childrenConst[randomnumber].data.selftext.slice(0, 2048);

        const everythingAfterThat = childrenConst[randomnumber].data.selftext.slice(2048);

        discordEmbed
          .setTitle(childrenConst[randomnumber].data.title)
          .setDescription(first2048)
          .setURL(`https://reddit.com${childrenConst[randomnumber].data.permalink}`);

        const discordEmbed2 = new Discord.MessageEmbed()
          .setColor("#F8534F")
          .setDescription(everythingAfterThat)
          .setFooter(
            `👍 ${childrenConst[randomnumber].data.ups} | 💬 ${childrenConst[randomnumber].data.num_comments}`
          );

        message.channel.send(discordEmbed);
        return message.channel.send(discordEmbed2);
      }

      if (
        subreddit.data.children[randomnumber].data.is_self &&
        childrenConst[randomnumber].data.selftext.length < 2048
      ) {
        discordEmbed
          .setTitle(childrenConst[randomnumber].data.title)
          .setDescription(childrenConst[randomnumber].data.selftext)
          .setFooter(`👍 ${childrenConst[randomnumber].data.ups} | 💬 ${childrenConst[randomnumber].data.num_comments}`)
          .setURL(`https://reddit.com${childrenConst[randomnumber].data.permalink}`);

        return message.channel.send(discordEmbed);
      }
      if (!subreddit.data.children[randomnumber].data.is_self) {
        discordEmbed
          .setTitle(childrenConst[randomnumber].data.title)
          .setFooter(`👍 ${childrenConst[randomnumber].data.ups} | 💬 ${childrenConst[randomnumber].data.num_comments}`)
          .setURL(`https://reddit.com${childrenConst[randomnumber].data.permalink}`);

        message.channel.send(childrenConst[randomnumber].data.url);
        return message.channel.send(discordEmbed);
      }
      return null;
    })
    .catch((error) => {
      console.error(error);
      discordEmbed.setTitle(":x: Error. Either the subreddit doesn't exist or Reddit made a Fuckie Wookie.");

      message.channel.send(discordEmbed);
    });
  return null;
};
module.exports = {
  name: "reddit",
  description: "ur gay",
  execute,
};
