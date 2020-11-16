const Discord = require('discord.js');
999;
const sentences = [
	'Paint yourself white to avoid getting shot by the cops',
	'Keep wasps or hornets in your car to prevent it from being stolen',
	'You can save time on pre heating your oven by leaving it on until you need to use it',
	'Eat food laying down so the crumbs fall back in your mouth',
	'Avoid the death penalty by finding out where your states governor is immediately following your crime. Bump into them, say, “pardon me,” and they’ll say something along the lines of “of course.” Boom, you are now pardoned of your crimes.',
	'“Accidentally” tip your almost empty wine glass over at a restaurant and get a new and full one for free.',
	'Have you seen those Lost cat posters offering a reward? You could make a living kidnapping cats and claiming the money after finding them.',
	'If you order online, message the seller saying your item is broken and fake the broken item, they send a replacement. Boom more free stuff.',
	'Waiters taking too long to bring the check? Try to walk out of the restaurant and see if they bring you the check then.',
	'https://i.imgur.com/9bG1cJg.png',
	'Spraypaint "cheater" on your car to make it look like you are sexually active.',
	'Want to check if your cocaine is good? Put it in your pocket and head to the airport. If the dogs can smell it, that means its good.',
	'Get a ruler tattooed to your arm or leg so you can measure anything, anytime.',
	'Don\'t live in the US.',
	'To avoid the last pee droplets from wetting your boxers, squeeze all the leftover pee out of your balls.',
	'Dont embarass a guy in public by telling him his fly is open. Be a man and zip it up youself.',
	'Wanna win a snowball fight? Cover a rock with snow and throw it at your enemy.',
	'Running water in your toilet helps to constantly clean the bowl so you won\'t have to.',
	'If you need advice, ask other Redditors for advice.... They are probably equally as successful as you are.',
	'Can’t afford mint? Brush your teeth before eating your home cooked meals',
	'Cut your gasoline with water for increased mpg.',
	'Vodka looks like water when you put it in a water bottle.',
	'Have trouble sleeping? Turn on your car in the garage. The carbon monoxide from the exhaust will help you fall asleep quickly.',
	'Conceive and adopt 365 kids each with a different birthday, then enjoy a free kids\' meal every time you go out.',
	'On hot days, open your fridge; the cold air will cool down your house!',
	'Tired of hearing about school shootings? Try enouraging local teens to use bombs instead.',,
	'tired of waiting at airport security? Pull out a gun. Most airports don\'t allow guns so it\'s unlikely anyone else will have one. Everyone will be at your mercy, you will be on your upgraded to first class flight in no time.',
	'Don\'t laugh at your friend for getting hurt from a paper cut cause you might make the pussy cry even more.',
	'Don\'t cough while your taking a shit, trust me.',
	'Just pretend to be a hot girl to make your room mate clean the apartment.',
	'https://i.redd.it/i4c9ygijglq31.jpg',
	'Spice up your panic attack by using a harmonica.',
	'Prisons could cut down on cost, by giving inmates knives instead of having them ruin 1000s of spoons a year',
	'Act like a pedophile to get free candy on Halloween.',
	'If you\'re sad, or depressed because you\'re ugly, don\'t blame yourself. Blame the ugly fuckers that made you.',
	'Devote your life to religion so when you need to lie, just put it on god and they’ll believe you.',
	'Stop Saving for Retirement. Start spending that money on whiskey.',
	'Legally change yourself to a female so that you have a longer life expectancy',
	'Spice up any Social media comment with random quotation marks: \n “Congrats“ on your baby. \n Congrats on “your“ baby. \n Congrats on your “baby“.',
];
function lptrandom() {
	return sentences[Math.floor(Math.random() * sentences.length)];
}
module.exports = {
	name: 'lpt',
	description: 'it pongs',
	execute(message) {
		const discordEmbed = new Discord.MessageEmbed()
			.setColor('#F8534F')
			.setTitle(lptrandom());
		message.channel.send(discordEmbed);
	},
};