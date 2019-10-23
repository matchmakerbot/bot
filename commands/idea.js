const fs = require('fs');

const path = require("path");

const ideas = fs.readFileSync(path.join(__dirname, "ideadata.json"));

const storedideas = JSON.parse(ideas);

const {
  prefix
} = require('../config.json');

const Discord = require('discord.js')

const client = require("../client.js");

storedideas.sort(function (a, b) {
  return new Date(a.date) - new Date(b.date)
})

module.exports = {
  name: 'idea',
  description: 'ur gay',
  execute(message) {

    function messageEndswith() {
      const split = message.content.split(" ");

      return split[split.length - 1];
    }

    function WordCount() {
      let split2 = message.content
      return split2.split(" ").length;
    }
    //random idea and fetching name

    if (messageEndswith() === "random" && WordCount() == 2) {
      const idk = Math.floor(Math.random() * storedideas.length)

      const today2 = storedideas[idk].date

      const today3 = new Date(today2).toLocaleString()

      const rIdea = storedideas[idk].text

      const id2 = storedideas[idk].thegayassthatwrotethis

      async function idk2() {
        await client.fetchUser(id2).then(response => {

          const username = response.username

          const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setTitle(rIdea)
            .setFooter('Sent by: ' + username + " at " + today3);

          return message.channel.send(discordEmbed)


        }).catch(error => {
          console.log(error)
        })

      }

     return idk2()

    }

    //Deletes idea

    if (messageEndswith() === "delete" && WordCount() == 2) {

      let aaa = storedideas.find(THEARRAY => THEARRAY.thegayassthatwrotethis === message.author.id)

      let foundnumber = storedideas.indexOf(aaa)

      console.log(foundnumber)

      if (foundnumber === -1) {
        const discordEmbed = new Discord.RichEmbed()
        .setColor('#F8534F')
        .setTitle(":x: You have no ideas to delete!");

        return message.channel.send(discordEmbed)
      }

      storedideas.splice(foundnumber, 1)

      const returnstring = JSON.stringify(storedideas);

      fs.writeFileSync(path.join(__dirname, "ideadata.json"), returnstring);

      const discordEmbed = new Discord.RichEmbed()
        .setColor('#F8534F')
        .setTitle("Idea Deleted");

      return message.channel.send(discordEmbed)

    }

    //latest idea that also fetches name

    if (message.content === "!idea latest") {

      let sortedArray = storedideas.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date)
      })

      let lastArray = sortedArray[sortedArray.length - 1];

      const today4 = new Date(lastArray.date).toLocaleString()

      const idyeet = lastArray.thegayassthatwrotethis

      async function idk3() {
        await client.fetchUser(idyeet).then(response => {

          const username = response.username

          const discordEmbed = new Discord.RichEmbed()
            .setColor('#F8534F')
            .setTitle(lastArray.text)
            .setFooter('Sent by: ' + username + " at " + today4);
          return message.channel.send(discordEmbed)

            .catch(error => {
              console.log(error)
            })
        })

      }

      idk3()

    }
    //Inserting new ideas

    let blacklist = ["faggot", "nigger", "nigga", "fag", ]

    for (let person of storedideas) {
      if (person.thegayassthatwrotethis === message.author.id) {
        const discordEmbed = new Discord.RichEmbed()
          .setColor('#F8534F')
          .setTitle(":x: You can't send more than 1 idea. Do !idea delete do delete your old idea")
        message.channel.send(discordEmbed);
        return;
      }
    }


    for (let word of blacklist) {
      if (message.content.includes(word)) {
        const discordEmbed = new Discord.RichEmbed()
          .setColor('#F8534F')
          .setTitle(":x: Let's not use that word, shall we?");

        return message.channel.send(discordEmbed)
      }
    }

    function ideastring() {
      return message.content.slice(prefix.length + "idea ".length);
    }
    const storedvalue = ideastring()

    const today = new Date();

    let newIdea = {
      text: storedvalue,
      thegayassthatwrotethis: message.author.id,
      date: today
    };

    storedideas.push(newIdea);

    const returnstring = JSON.stringify(storedideas);

    fs.writeFileSync(path.join(__dirname, "ideadata.json"), returnstring);

    const discordEmbed = new Discord.RichEmbed()
      .setColor('#F8534F')
      .setTitle("Idea inserted into the database. ")
    return message.channel.send(discordEmbed)


  }
}