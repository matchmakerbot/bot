const {prefix} = require('../config.json');


module.exports = {
    name: 'random',
    description: 'idk',
    execute(message) {
        if(message.content === "!random"){
            message.channel.send("Please specify your words.")
        }
        let messagewithoutrandom = message.content.slice(prefix.length + "random ".length);


        let array = messagewithoutrandom.split(' ')

        function random() {
            return array[Math.floor(Math.random() * array.length)]
        }
        if (isNaN(Number(array[array.length - 1]))) {
            message.channel.send(random())
        }
        else {
            
        }
    }
}