let sentences = [
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
    'Wanna win a snowball fight? Cover a rock with snow and throw it at your enemy.'
]
function lptrandom () { 
    return sentences[Math.floor(Math.random() * sentences.length)]
}


module.exports = {
	name: 'lpt',
	description: 'it pongs',
	execute(message) {
		message.channel.send(lptrandom());
	},
};