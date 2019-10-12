const Discord = require('discord.js')

const rp = require("request-promise-native");

module.exports = {
    name: 'reddit',
    description: 'ur gay',
    execute(message) {
        //Before the reddit thingy actually works
        function WordCount() {
            let split2 = message.content
            return split2.split(" ").length;
        }
        const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setDescription(":x: Please only insert one word.")

        if (WordCount() > 2) {
            message.channel.send(discordEmbed)
        } else {
            function messageEndswith() {
                const split = message.content.split(" ");

                return split[split.length - 1];
            }
            const discordEmbed = new Discord.RichEmbed()
                .setColor('#F8534F')
                .setDescription(":x: Please specify the subreddit you want to search.")

            if (message.content === "!reddit") {
                message.channel.send(discordEmbed)

            } else {

                //when all of the thingies are gud

                rp("https://www.reddit.com/r/" + messageEndswith() + ".json?limit=1000")
                    .then(response => {

                        const subreddit = JSON.parse(response);

                        if (messageEndswith() === "fiftyfifty123") {
                            message.channel.send("Let's not do that")
                        } else {
                            const data = subreddit.data;
                            const allowed = message.channel.nsfw ? data.children : data.children.filter(post => !post.over_18);
                            const randomnumber = Math.floor(Math.random() * allowed.length);

                            if (subreddit.error === 404 || data.children.length === 0) {
                                return message.channel.send(discordEmbed)
                            }
                            const nsfwpost = subreddit.data.children[randomnumber].data.over_18;

                            if (nsfwpost && !message.channel.nsfw) {
                                const discordEmbed = new Discord.RichEmbed()
                                    .setColor('#F8534F')
                                    .setDescription(":warning: This channel does not have a NSFW tag!");
                                message.channel.send(discordEmbed)
                            } else {
                                if (nsfwpost && message.channel.id === "416015319736385547") {
                                    const discordEmbed = new Discord.RichEmbed()
                                        .setColor('#F8534F')
                                        .setTitle(":warning: This subreddit is disabled in this channel. If you think this shouldn't be happening please contact the developer");
                                    message.channel.send(discordEmbed)
                                } else {
                                    if (subreddit.data.children[randomnumber].data.is_self) {
                                        /*let descriptionlength = allowed[randomnumber].data.selftext.length
                                        for (let i of descriptionlength) {
                                            while (i > 2048) {
                                                const discordEmbed = new Discord.RichEmbed()
                                                    .setColor('#F8534F')
                                                    .setTitle(":x: Let's not use that word, shall we?");
                        
                                                return message.channel.send(discordEmbed)
                                            }
                                        }
                                        */
                                        const discordEmbed = new Discord.RichEmbed()
                                            .setColor('#F8534F')
                                            .setTitle(allowed[randomnumber].data.title)
                                            .setFooter("👍 " + allowed[randomnumber].data.ups + " | 💬 " + allowed[randomnumber].data.num_comments)
                                            .setURL("https://reddit.com" + allowed[randomnumber].data.permalink)
                                        return message.channel.send(discordEmbed)
                                    } else {
                                        const discordEmbed = new Discord.RichEmbed()
                                            .setColor('#F8534F')
                                            .setTitle(allowed[randomnumber].data.title)
                                            .setImage(allowed[randomnumber].data.url)
                                            .setFooter("👍 " + allowed[randomnumber].data.ups + " | 💬 " + allowed[randomnumber].data.num_comments)
                                            .setURL("https://reddit.com" + allowed[randomnumber].data.permalink)
                                        return message.channel.send(discordEmbed)
                                    }
                                }
                            }
                        }
                    }).catch(error => {
                        console.error(error)
                        const discordEmbed = new Discord.RichEmbed()
                            .setColor('#F8534F')
                            .setDescription(":x: Error");

                        message.channel.send(discordEmbed);
                    });

            }
        }
    }
}