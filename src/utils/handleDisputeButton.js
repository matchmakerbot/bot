const Discord = require("discord.js");
const EloRank = require("elo-rank");
const logger = require("pino")();

const OngoingGamesTeamsCollection = require("./schemas/ongoingGamesTeamsSchema");
const MatchmakerTeamsScoreCollection = require("./schemas/matchmakerTeamsScoreSchema");
const { redisInstance } = require("./createRedisInstance");
const client = require("./createClientInstance");

/**
 * Handles button interactions for dispute resolution
 * @param {Discord.ButtonInteraction} interaction - The button interaction
 */
async function handleDisputeButton(interaction) {
  const { customId } = interaction;

  if (!customId.startsWith("dispute_")) {
    return;
  }

  const parts = customId.split("_");
  const action = parts[1];
  const gameId = parseInt(parts[2], 10);
  const winner = parts[3] ? parseInt(parts[3], 10) : null;

  if (!interaction.member.permissions.has("ADMINISTRATOR")) {
    await interaction.reply({ content: ":x: Only administrators can resolve disputes!", ephemeral: true });
    return;
  }

  const ongoingGame = await OngoingGamesTeamsCollection.findOne({ gameId });

  if (!ongoingGame) {
    await interaction.reply({ content: ":x: Game not found or already resolved!", ephemeral: true });
    return;
  }

  if (action === "cancel") {
    await OngoingGamesTeamsCollection.deleteOne({ gameId });

    const deletableChannels = await redisInstance.getObject("deletableChannels");
    deletableChannels.push({
      originalChannelId: ongoingGame.channelId,
      channelIds: [...ongoingGame.channelIds],
    });
    await redisInstance.setObject("deletableChannels", deletableChannels);

    const cancelEmbed = new Discord.MessageEmbed()
      .setColor("#F8534F")
      .setTitle("��� Game Cancelled")
      .setDescription(`Game **${gameId}** has been cancelled by <@${interaction.user.id}>.\n\nNo scores were updated.`);

    await interaction.update({ embeds: [cancelEmbed], components: [] });

    try {
      const gameChannel = await client.channels.fetch(ongoingGame.channelId);
      await gameChannel.send({ embeds: [cancelEmbed] });
      // eslint-disable-next-line no-empty
    } catch (e) {}

    logger.info(`Admin ${interaction.user.tag} cancelled disputed game ${gameId}`);
  }

  if (action === "resolve" && winner) {
    const elo = new EloRank(16);
    const winningTeam = winner === 1 ? 0 : 1;

    const mmrOfEachTeam = {
      team1: ongoingGame.team1.mmr,
      team2: ongoingGame.team2.mmr,
    };

    const winningTeamMmr = winningTeam === 0 ? mmrOfEachTeam.team1 : mmrOfEachTeam.team2;

    const mmrDifference = Math.abs(
      Math.round(
        elo.updateRating(
          elo.getExpected(
            winningTeamMmr,
            winningTeamMmr === ongoingGame.team1.mmr ? mmrOfEachTeam.team2 : mmrOfEachTeam.team1
          ),
          1,
          winningTeamMmr
        ) - winningTeamMmr
      )
    );

    const promises = [];
    [ongoingGame.team1, ongoingGame.team2].forEach((team) => {
      const won =
        (winningTeam === 0 && ongoingGame.team1.name === team.name) ||
        (winningTeam === 1 && ongoingGame.team2.name === team.name);
      const score = won ? "wins" : "losses";

      promises.push(
        MatchmakerTeamsScoreCollection.updateOne(
          { channelId: ongoingGame.channelId, name: team.name },
          { $inc: { [score]: 1, mmr: won ? mmrDifference : -mmrDifference } }
        )
      );
    });
    await Promise.all(promises);

    const finishedGames = await redisInstance.getObject("finishedGames");
    finishedGames.push({
      channelId: ongoingGame.channelId,
      guildId: ongoingGame.guildId,
      gameId: ongoingGame.gameId,
      winningTeam,
      mmrOfEachTeam,
      mmrDifference,
      team1: ongoingGame.team1,
      team2: ongoingGame.team2,
    });
    await redisInstance.setObject("finishedGames", finishedGames);

    await OngoingGamesTeamsCollection.deleteOne({ gameId });

    const deletableChannels = await redisInstance.getObject("deletableChannels");
    deletableChannels.push({
      originalChannelId: ongoingGame.channelId,
      channelIds: [...ongoingGame.channelIds],
    });
    await redisInstance.setObject("deletableChannels", deletableChannels);

    const resolveEmbed = new Discord.MessageEmbed()
      .setColor("#57F287")
      .setTitle("✅ Dispute Resolved")
      .setDescription(
        `Game **${gameId}** has been resolved by <@${interaction.user.id}>.\n\n` +
          `**Winner:** Team **${winningTeam === 0 ? ongoingGame.team1.name : ongoingGame.team2.name}**`
      );

    if (ongoingGame.disputeReason) {
      resolveEmbed.addField("Original Dispute", ongoingGame.disputeReason, false);
    }

    await interaction.update({ embeds: [resolveEmbed], components: [] });

    try {
      const gameChannel = await client.channels.fetch(ongoingGame.channelId);
      await gameChannel.send({ embeds: [resolveEmbed] });
      // eslint-disable-next-line no-empty
    } catch (e) {}

    logger.info(`Admin ${interaction.user.tag} resolved disputed game ${gameId} with winner: Team ${winner}`);
  }
}

module.exports = { handleDisputeButton };
