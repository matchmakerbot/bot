const Discord = require('discord.js')

const rp = require("request-promise-native");

module.exports = {
  name: 'r',
  description: 'ur gay',
  execute(message) {

    //Before the reddit thingy actually works
    
    function WordCount() {
      let split2 = message.content
      return split2.split(" ").length;
    }

    const discordEmbed = new Discord.RichEmbed()
      .setColor('#F8534F')
      .setTitle(":x: Please only insert one word.")

    if (WordCount() > 2) {
      return message.channel.send(discordEmbed)
    }

    function messageEndswith() {
      const split = message.content.split(" ");

      return split[split.length - 1];
    }

    if (WordCount() === 1) {
      const discordEmbed = new Discord.RichEmbed()
        .setColor('#F8534F')
        .setDescription(":x: Please specify the subreddit you want to search.")
      return message.channel.send(discordEmbed)
    }

    //when all of the thingies are gud

    rp("https://www.reddit.com/r/" + messageEndswith() + ".json?limit=1000")
      .then(response => {

        const subreddit = JSON.parse(response);

        if (messageEndswith() === "fiftyfifty123") {
          message.channel.send("Let's not do that")
        }
        const data = subreddit.data;

        const childrenConst = data.children

        const randomnumber = Math.floor(Math.random() * childrenConst.length);

        if (subreddit.error === 404 || data.children.length === 0) {
          const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setTitle(":x: Error. Either the subreddit doesn't exist or Reddit made a Fuckie Wookie.");
          return message.channel.send(discordEmbed)
        }
        const nsfwpost = subreddit.data.children[randomnumber].data.over_18;

        if (nsfwpost && !message.channel.nsfw) {
          const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setDescription(":warning: This channel does not have a NSFW tag!");
          return message.channel.send(discordEmbed)
        }
        if (nsfwpost && message.channel.id === "416015319736385547") {
          const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setTitle(":warning: This subreddit is disabled in this channel. If you think this shouldn't be happening please ping Tweeno");
          return message.channel.send(discordEmbed)
        }

        //this code is a fucking mess pls not the belt daddy

        if (subreddit.data.children[randomnumber].data.is_self && childrenConst[randomnumber].data.selftext.length > 2048) {

          const first2048 = childrenConst[randomnumber].data.selftext.slice(0, 2048);

          const everythingAfterThat = childrenConst[randomnumber].data.selftext.slice(2048);

          const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setTitle(childrenConst[randomnumber].data.title)
            .setDescription(first2048)
            .setURL("https://reddit.com" + childrenConst[randomnumber].data.permalink)

          const discordEmbed2 = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setDescription(everythingAfterThat)
            .setFooter("👍 " + childrenConst[randomnumber].data.ups + " | 💬 " + childrenConst[randomnumber].data.num_comments)

          message.channel.send(discordEmbed)
          message.channel.send(discordEmbed2)
          return;
        }

        if (subreddit.data.children[randomnumber].data.is_self && childrenConst[randomnumber].data.selftext.length < 2048) {

          const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setTitle(childrenConst[randomnumber].data.title)
            .setDescription(childrenConst[randomnumber].data.selftext)
            .setFooter("👍 " + childrenConst[randomnumber].data.ups + " | 💬 " + childrenConst[randomnumber].data.num_comments)
            .setURL("https://reddit.com" + childrenConst[randomnumber].data.permalink)

          return message.channel.send(discordEmbed)
        }
        if (!subreddit.data.children[randomnumber].data.is_self) {
          const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setTitle(childrenConst[randomnumber].data.title)
            .setImage(childrenConst[randomnumber].data.url)
            .setFooter("👍 " + childrenConst[randomnumber].data.ups + " | 💬 " + childrenConst[randomnumber].data.num_comments)
            .setURL("https://reddit.com" + childrenConst[randomnumber].data.permalink)
          return message.channel.send(discordEmbed)
        }


      }).catch(error => {
        console.error(error)
        const discordEmbed = new Discord.RichEmbed()
          .setColor('#F8534F')
          .setTitle(":x: Error. Either the subreddit doesn't exist or Reddit made a Fuckie Wookie.");

        message.channel.send(discordEmbed);
      });



  }
}