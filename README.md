# Matchmaker Bot API

The Discord bot, which is the main part of the whole project, that allows users to play games agaisnt each other with a leaderboard.

## Contents
- [Introduction](#introduction)
- [Enviroment Variables](#enviroment_variables)
- [Development](#development)
- [Deployment](#deployment)
- [Authors](#authors)

## Introduction
# Wanna play against friends but no way to set it up? Want to build a competitive community?

Hi there. I'm Tweeno and I've developed a Matchmaking/Pugs/Scrims bot that can be used in any discord.

The bot creates teams with a size defined by you, so it can be 3v3, 5v5 etc..., randomized, with random captains or even Pre made teams, where users can create their own team, invite players and play agaisnt others.
The bot comes with its own Leaderboard, based on a mmr system.

# How to play ?
Once enough players have queued up using the correct command, the bot will ask you to pick between random teams or captain mode, or if you're playing in the teams mode, this gets skipped..

The bot will then create the teams and 2 different voice chats for each team to join, and then you play the game, as a normal private game.

Once the game has been completed, one player reports a win or loss to the bot. the bot will then automaticly give or take mmr from each player, dependent on wich team they were on, if abused, admins can revert the game.

All commands can be seen using !helpsolosmatchmaking or !helpteammatchmaking

Hope you enjoy the bot. If you need any help feel free to use the !credits command to either report issues on my github or send me a pm on discord with questions, as i'll be there to answer any questions you may have.

https://top.gg/bot/571839826744180736

## Enviroment_Variables

The following environment variabled are required to run the container:
- **PREFIX**: Bot Prefix.
- **TOKEN**: Discord Bot Token.
- **REDIS_USERNAME_AND_PASSWORD**: The Redis Username and Password String, joined with :

## Development

Local development requires the following software:
- NodeJS
- Yarn
- MongoDB
- Redis

The environment variables mentioned in the [Enviroment Variables](#enviroment_variables) section can be placed in a .env file in the project's root.

If everything is set up correctly, run the following command for an optimal development environment, which will watch for changes in the typescript files and auto-restart the server if necessary.
- `yarn dev`

For Deployment, the correct command is:
- `yarn prod`

Linting can be run using the following commands:
- `yarn lint`

For any additional commands, check out the package.json.

## Deployment

I use GitHub Actions CI/CD and Kubernetes for my deployments. All required into regarding deployments can be found in /.github and /chart.


## Authors

- **David Pinto** *(iTweeno)*
