import type { GameResultsData, GameResultsRosterRow } from "../../app/actions/mania.ts";
import { memberLabel } from "./memberLabel.ts";

function averageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function statusLabel(status: string) {
  if (status === "completed") return "Game complete";
  if (status === "active") return "In progress";
  if (status === "pending") return "Pending";
  return status;
}

function rosterOrder(userId: string, roster: GameResultsRosterRow[]) {
  const index = roster.findIndex((member) => member.userId === userId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function formatReviewText(reviewText: string) {
  return reviewText.trim().replace(/\r\n?/g, "\n").replace(/\n/g, "\n  ");
}

export function buildResultsShareSummary(data: GameResultsData): string {
  const groupName = data.group?.name ?? "Mania";
  const lines: string[] = [`${groupName} results`];

  if (data.game) {
    const revealedLabel = `${data.rounds.length} revealed round${data.rounds.length === 1 ? "" : "s"}`;
    lines.push(`${statusLabel(data.game.status)} - Round ${data.game.currentRound} of ${data.game.maxRounds} - ${revealedLabel}`);
  } else {
    lines.push(`${data.rounds.length} revealed round${data.rounds.length === 1 ? "" : "s"}`);
  }

  if (data.rounds.length === 0) {
    lines.push("", "No revealed rounds yet.");
    return lines.join("\n");
  }

  const rounds = [...data.rounds].sort((left, right) => left.roundNumber - right.roundNumber);

  for (const round of rounds) {
    const average = averageRating(round.reviews);
    const picker = memberLabel(data.viewerId, round.pickerId, data.roster);
    const title = round.artistName ? `${round.albumName ?? "Album TBA"} by ${round.artistName}` : (round.albumName ?? "Album TBA");
    const reviews = [...round.reviews].sort((left, right) => {
      const orderDelta = rosterOrder(left.userId, data.roster) - rosterOrder(right.userId, data.roster);
      if (orderDelta !== 0) return orderDelta;
      return memberLabel(data.viewerId, left.userId, data.roster).localeCompare(
        memberLabel(data.viewerId, right.userId, data.roster)
      );
    });

    lines.push("", `Round ${round.roundNumber}: ${title}`);
    lines.push(`Picked by ${picker}`);
    lines.push(
      average == null
        ? `Average: -- from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
        : `Average: ${formatScore(average)} from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
    );

    if (round.albumUrl) {
      lines.push(`Listen: ${round.albumUrl}`);
    }

    if (reviews.length === 0) {
      lines.push("Scores: none recorded");
      continue;
    }

    lines.push(`Scores: ${reviews.map((review) => `${memberLabel(data.viewerId, review.userId, data.roster)} ${formatScore(review.rating)}`).join(", ")}`);

    const writtenReviews = reviews
      .map((review) => ({
        reviewer: memberLabel(data.viewerId, review.userId, data.roster),
        rating: review.rating,
        text: formatReviewText(review.reviewText),
      }))
      .filter((review) => review.text.length > 0);

    if (writtenReviews.length > 0) {
      lines.push("Reviews:");
      for (const review of writtenReviews) {
        lines.push(`- ${review.reviewer} (${formatScore(review.rating)}): ${review.text}`);
      }
    }
  }

  return lines.join("\n");
}
