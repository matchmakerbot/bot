const Discord = require("discord.js");

const sentences = [
  "Paint yourself white to avoid getting shot by the cops",
  "Keep wasps or hornets in your car to prevent it from being stolen",
  "You can save time on pre heating your oven by leaving it on until you need to use it",
  "Eat food laying down so the crumbs fall back in your mouth",
  "Avoid the death penalty by finding out where your states governor is immediately following your crime. Bump into them, say, “pardon me,” and they’ll say something along the lines of “of course.” Boom, you are now pardoned of your crimes.",
  "“Accidentally” tip your almost empty wine glass over at a restaurant and get a new and full one for free.",
  "Have you seen those Lost cat posters offering a reward? You could make a living kidnapping cats and claiming the money after finding them.",
  "If you order online, message the seller saying your item is broken and fake the broken item, they send a replacement. Boom more free stuff.",
  "Waiters taking too long to bring the check? Try to walk out of the restaurant and see if they bring you the check then.",
  "https://i.imgur.com/9bG1cJg.png",
  'Spraypaint "cheater" on your car to make it look like you are sexually active.',
  "Want to check if your cocaine is good? Put it in your pocket and head to the airport. If the dogs can smell it, that means its good.",
  "Get a ruler tattooed to your arm or leg so you can measure anything, anytime.",
  "Don't live in the US.",
  "To avoid the last pee droplets from wetting your boxers, squeeze all the leftover pee out of your balls.",
  "Dont embarass a guy in public by telling him his fly is open. Be a man and zip it up youself.",
  "Wanna win a snowball fight? Cover a rock with snow and throw it at your enemy.",
  "Running water in your toilet helps to constantly clean the bowl so you won't have to.",
  "If you need advice, ask other Redditors for advice.... They are probably equally as successful as you are.",
  "Can’t afford mint? Brush your teeth before eating your home cooked meals",
  "Cut your gasoline with water for increased mpg.",
  "Vodka looks like water when you put it in a water bottle.",
  "Have trouble sleeping? Turn on your car in the garage. The carbon monoxide from the exhaust will help you fall asleep quickly.",
  "Conceive and adopt 365 kids each with a different birthday, then enjoy a free kids' meal every time you go out.",
  "On hot days, open your fridge; the cold air will cool down your house!",
  "Tired of hearing about school shootings? Try enouraging local teens to use bombs instead.",
  "tired of waiting at airport security? Pull out a gun. Most airports don't allow guns so it's unlikely anyone else will have one. Everyone will be at your mercy, you will be on your upgraded to first class flight in no time.",
  "Don't laugh at your friend for getting hurt from a paper cut cause you might make the pussy cry even more.",
  "Don't cough while you're taking a shit, trust me.",
  "Just pretend to be a hot girl to make your room mate clean the apartment.",
  "https://i.redd.it/i4c9ygijglq31.jpg",
  "Spice up your panic attack by using a harmonica.",
  "Prisons could cut down on cost, by giving inmates knives instead of having them ruin 1000s of spoons a year",
  "Act like a pedophile to get free candy on Halloween.",
  "If you're sad, or depressed because you're ugly, don't blame yourself. Blame the ugly fuckers that made you.",
  "Devote your life to religion so when you need to lie, just put it on god and they’ll believe you.",
  "Stop Saving for Retirement. Start spending that money on whiskey.",
  "Legally change yourself to a female so that you have a longer life expectancy",
  "Spice up any Social media comment with random quotation marks: \n “Congrats“ on your baby. \n Congrats on “your“ baby. \n Congrats on your “baby“.",
  "To save money on wet wipes, and to be more environmentally friendly, piss on toilet paper",
  "Did you know a motorcycle engine uses much more gas when going uphill rather than downhill ? You can save significant quantity of gas by pushing your motorcycle.",
  "Having a dirty house and feeling too lazy to clean your house.? Did you know your local council will send someone to clean your house if you are morbidly obese and unfit to clean your house.?What you waiting for?Pile on the pounds for a free house clean!",
  "Getting bacon on your burger at Five Guys costs extra, but it doesn't cost extra to get bacon in your milkshake. So get a milkshake and take the bacon out to put on your burger.",
  "Getting electrocuted will rid of any microchips the government might have planted in your arm by frying them.",
  "If you live in a place where prostitution isn’t legal, but pornography is, just film it. The prostitute is an actor or actress now, and that’s legal.",
  "You cant get down if you're always high",
  "Use white car painting to make your teeth shiny and bright",
  "Fold up an extra glass screen protector so you always have a spare",
  "If you ever have a bit too much to drink and do something that you then regret, you can forget about it by getting even MORE drunk and do something even worse.",
];

function lptrandom() {
  return sentences[Math.floor(Math.random() * sentences.length)];
}

module.exports = {
  name: "lpt",
  description: "it pongs",
  execute(message) {
    const discordEmbed = new Discord.MessageEmbed().setColor("#F8534F").setTitle(lptrandom());
    message.channel.send(discordEmbed);
  },
};
