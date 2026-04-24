import Link from "next/link";
import type { GameResultsData, GameResultsRosterRow, GameResultsRound } from "@/app/actions/mania";
import { memberLabel } from "@/lib/mania/memberLabel";

type Props = { data: GameResultsData };

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function rosterLabel(viewerId: string, userId: string, roster: GameResultsRosterRow[]) {
  return memberLabel(viewerId, userId, roster);
}

function averageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function wordCount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function scoreToneClass(score: number) {
  if (score >= 8.5) return "bg-accent-lime/60 text-accent-lime-fg";
  if (score >= 7) return "bg-accent-yellow/70 text-accent-yellow-fg";
  if (score >= 5) return "bg-accent-peach/60 text-accent-peach-fg";
  return "bg-accent-pink/55 text-accent-pink-fg";
}

function scoreBarClass(score: number) {
  if (score >= 8.5) return "bg-accent-lime";
  if (score >= 7) return "bg-accent-yellow";
  if (score >= 5) return "bg-accent-peach";
  return "bg-accent-pink";
}

function scoreLabel(score: number) {
  if (score >= 9) return "All timer";
  if (score >= 8) return "Strong yes";
  if (score >= 7) return "Works on me";
  if (score >= 6) return "Mixed bag";
  if (score >= 4) return "Not landing";
  return "Hard no";
}

function statusLabel(status: string) {
  if (status === "completed") return "Game complete";
  if (status === "active") return "In progress";
  if (status === "pending") return "Pending";
  return status;
}

function statusToneClass(status: string) {
  if (status === "completed") return "bg-accent-yellow/70 text-accent-yellow-fg";
  if (status === "active") return "bg-accent-green/15 text-accent-green-fg";
  return "bg-surface-raised text-foreground-secondary";
}

function roundSummary(round: GameResultsRound) {
  const avg = averageRating(round.reviews);
  const reviewCount = round.reviews.length;
  const wordTotal = round.reviews.reduce((total, review) => total + wordCount(review.reviewText), 0);
  return { avg, reviewCount, wordTotal };
}

export function ResultsView({ data }: Props) {
  const { viewerId, email, viewerDisplayName, group, game, roster, rounds } = data;

  const roundStats = rounds.map((round) => ({
    round,
    ...roundSummary(round),
  }));

  const bestRound =
    roundStats.length > 0
      ? roundStats.reduce((best, current) => {
          if (current.avg == null) return best;
          if (!best || best.avg == null || current.avg > best.avg) return current;
          return best;
        }, null as (typeof roundStats)[number] | null)
      : null;

  const totalReviews = rounds.reduce((total, round) => total + round.reviews.length, 0);
  const totalWords = rounds.reduce(
    (total, round) =>
      total + round.reviews.reduce((roundTotal, review) => roundTotal + wordCount(review.reviewText), 0),
    0
  );

  const scoreboard = roster
    .map((member) => {
      const pickedRounds = roundStats.filter((entry) => entry.round.pickerId === member.userId);
      const pickedAverages = pickedRounds
        .map((entry) => entry.avg)
        .filter((value): value is number => value != null);
      const averagePickedScore =
        pickedAverages.length > 0
          ? Math.round(
              (pickedAverages.reduce((total, score) => total + score, 0) / pickedAverages.length) * 10
            ) / 10
          : null;
      const reviewsWritten = rounds.flatMap((round) => round.reviews).filter((review) => review.userId === member.userId);
      const averageGivenScore =
        reviewsWritten.length > 0
          ? Math.round(
              (reviewsWritten.reduce((total, review) => total + review.rating, 0) / reviewsWritten.length) * 10
            ) / 10
          : null;

      return {
        ...member,
        pickedRounds: pickedRounds.length,
        averagePickedScore,
        reviewsWritten: reviewsWritten.length,
        averageGivenScore,
        topPickCount: pickedRounds.filter((entry) => bestRound?.round.id === entry.round.id).length,
      };
    })
    .sort((left, right) => {
      const leftScore = left.averagePickedScore ?? -1;
      const rightScore = right.averagePickedScore ?? -1;
      if (rightScore !== leftScore) return rightScore - leftScore;
      if (right.topPickCount !== left.topPickCount) return right.topPickCount - left.topPickCount;
      if (right.pickedRounds !== left.pickedRounds) return right.pickedRounds - left.pickedRounds;
      return left.playerOrder - right.playerOrder;
    });

  const latestRound = roundStats.at(-1) ?? null;
  const averageAcrossRounds =
    roundStats.length > 0
      ? roundStats
          .map((entry) => entry.avg)
          .filter((value): value is number => value != null)
      : [];
  const clubAverage =
    averageAcrossRounds.length > 0
      ? Math.round(
          (averageAcrossRounds.reduce((total, score) => total + score, 0) / averageAcrossRounds.length) * 10
        ) / 10
      : null;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-[34px] border border-accent-yellow/45 bg-accent-yellow/12 p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-yellow-fg">
                Results
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {group ? group.name : "No club selected"}
              </h2>
              <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                {group && game
                  ? `Invite code ${group.inviteCode}. ${statusLabel(game.status)} with ${rounds.length} revealed round${rounds.length === 1 ? "" : "s"} so far.`
                  : group
                    ? `Invite code ${group.inviteCode}. Start a game from Play to begin building a scoreboard.`
                    : "Join a group from Play to start building a results history."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {game ? (
                <span
                  className={cx(
                    "rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.16em]",
                    statusToneClass(game.status)
                  )}
                >
                  {statusLabel(game.status)}
                </span>
              ) : null}
              <span className="rounded-full bg-surface/80 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                {viewerDisplayName?.trim() || email}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Current game
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {game ? statusLabel(game.status) : "No game"}
              </p>
            </div>
            <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Round
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {game ? `${game.currentRound} / ${game.maxRounds}` : "--"}
              </p>
            </div>
            <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Latest reveal
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {latestRound?.round.albumName ?? "None yet"}
              </p>
            </div>
            <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Best round
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {bestRound?.round.albumName ?? "Waiting"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/play"
              className="rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover"
            >
              Back to Play
            </Link>
            <Link
              href="/account"
              className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised"
            >
              Manage Account
            </Link>
          </div>
        </div>
      </section>

      {!group ? (
        <section className="rounded-[30px] border border-accent-pink/35 bg-accent-pink/12 p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-pink-fg">
            No club yet
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Nothing to reveal yet.</h2>
          <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
            Join a group on{" "}
            <Link href="/play" className="font-medium text-foreground underline-offset-4 hover:underline">
              Play
            </Link>{" "}
            to see round results here once albums start getting reviewed.
          </p>
        </section>
      ) : null}

      {group && !game ? (
        <section className="rounded-[30px] border border-accent-lime/35 bg-accent-lime/12 p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
            Club waiting room
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {group.name} has no game yet.
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
            Start the first game from{" "}
            <Link href="/play" className="font-medium text-foreground underline-offset-4 hover:underline">
              Play
            </Link>{" "}
            and the reveal history will build here automatically.
          </p>
        </section>
      ) : null}

      {group && game ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
            <div className="rounded-[30px] border border-accent-peach/40 bg-accent-peach/12 p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-peach-fg">
                Current game
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Round {game.currentRound} of {game.maxRounds}
              </h2>
              <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                {game.status === "completed"
                  ? "This session is complete. The archive below is the final record."
                  : "This session is live. New reveal cards appear below as rounds close."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-[28px] border border-accent-pink/35 bg-accent-pink/12 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-pink-fg">
                  Latest reveal
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {latestRound?.round.albumName ?? "No reveal yet"}
                </h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {latestRound?.avg != null
                    ? `${latestRound.avg.toFixed(1)} average from ${latestRound.reviewCount} reviews`
                    : "No reviews yet"}
                </p>
              </div>

              <div className="rounded-[28px] border border-accent-lime/35 bg-accent-lime/12 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
                  This game
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {rounds.length} revealed round{rounds.length === 1 ? "" : "s"}
                </h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {totalReviews} reviews logged in this session
                </p>
              </div>
            </div>
          </section>

          {rounds.length === 0 ? (
            <section className="rounded-[30px] border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Waiting on the first reveal
              </p>
              <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                Once a round closes and the room reveals scores, it will appear here with
                written notes, averages, and the running table.
              </p>
            </section>
          ) : (
            <section className="flex min-w-0 flex-col gap-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                    Revealed rounds
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Round archive
                  </h2>
                </div>
                <p className="text-xs text-foreground-secondary">
                  Newest reveal at the bottom
                </p>
              </div>

              <ul className="grid gap-4">
                {roundStats.map((entry) => {
                  const { round, avg, reviewCount, wordTotal } = entry;
                  const isBest = bestRound?.round.id === round.id;

                  return (
                    <li
                      key={round.id}
                      className={cx(
                        "rounded-[30px] border p-5 shadow-sm",
                        isBest
                          ? "border-accent-yellow/45 bg-accent-yellow/12"
                          : "border-border bg-surface"
                      )}
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                              Round {round.roundNumber}
                            </span>
                            {isBest ? (
                              <span className="rounded-full bg-accent-yellow/70 px-2 py-1 text-xs font-medium text-accent-yellow-fg">
                                Top pick
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                            {round.albumName ?? "Album TBA"}
                          </h3>
                          {round.artistName ? (
                            <p className="mt-1 text-sm text-foreground-secondary">
                              {round.artistName}
                            </p>
                          ) : null}
                          <p className="mt-3 text-sm text-foreground-secondary">
                            Picked by{" "}
                            <span className="font-medium text-foreground">
                              {rosterLabel(viewerId, round.pickerId, roster)}
                            </span>
                            {round.albumUrl ? (
                              <>
                                {" "}
                                <a
                                  href={round.albumUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-foreground underline-offset-4 hover:underline"
                                >
                                  Listen
                                </a>
                              </>
                            ) : null}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:w-[27rem] lg:grid-cols-1 xl:grid-cols-3">
                          <div className="rounded-[24px] border border-border bg-surface-raised/70 p-4">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                              Average
                            </p>
                            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                              {avg != null ? avg.toFixed(1) : "--"}
                            </p>
                          </div>
                          <div className="rounded-[24px] border border-border bg-surface-raised/70 p-4">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                              Reviews
                            </p>
                            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                              {reviewCount}
                            </p>
                          </div>
                          <div className="rounded-[24px] border border-border bg-surface-raised/70 p-4">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                              Words
                            </p>
                            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                              {wordTotal}
                            </p>
                          </div>
                        </div>
                      </div>

                      {round.reviews.length === 0 ? (
                        <p className="mt-5 text-sm text-foreground-secondary">
                          No reviews were recorded for this round.
                        </p>
                      ) : (
                        <ul className="mt-5 grid gap-3">
                          {round.reviews.map((review) => (
                            <li
                              key={`${round.id}-${review.userId}`}
                              className="rounded-[24px] border border-border bg-surface-raised/60 p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                      {rosterLabel(viewerId, review.userId, roster)}
                                    </span>
                                    <span
                                      className={cx(
                                        "rounded-full px-2 py-1 text-xs font-medium uppercase tracking-[0.16em]",
                                        scoreToneClass(review.rating)
                                      )}
                                    >
                                      {scoreLabel(review.rating)}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={cx(
                                    "shrink-0 rounded-full px-3 py-1 font-mono text-sm",
                                    scoreToneClass(review.rating)
                                  )}
                                >
                                  {review.rating.toFixed(1)} / 10
                                </span>
                              </div>

                              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border/60">
                                <div
                                  className={cx("h-full rounded-full", scoreBarClass(review.rating))}
                                  style={{ width: `${Math.max(0, Math.min(100, review.rating * 10))}%` }}
                                />
                              </div>

                              {review.reviewText.trim() ? (
                                <p
                                  className="mt-3 max-w-prose whitespace-pre-wrap text-sm leading-7 text-foreground-secondary [overflow-wrap:anywhere]"
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {review.reviewText}
                                </p>
                              ) : (
                                <p className="mt-3 text-xs italic text-foreground-secondary">
                                  No written review
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-[30px] border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                    Club record
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Album table
                  </h2>
                </div>
                <p className="text-xs text-foreground-secondary">
                  Ranked by average score on picked albums
                </p>
              </div>

              {scoreboard.length === 0 ? (
                <p className="mt-5 text-sm text-foreground-secondary">No players yet.</p>
              ) : (
                <ul className="mt-5 grid gap-3">
                  {scoreboard.map((entry, index) => (
                    <li
                      key={entry.userId}
                      className={cx(
                        "rounded-[24px] border p-4",
                        index === 0 && entry.averagePickedScore != null
                          ? "border-accent-yellow/45 bg-accent-yellow/12"
                          : "border-border bg-surface-raised/60"
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-foreground-secondary">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {rosterLabel(viewerId, entry.userId, roster)}
                            </span>
                            {entry.userId === viewerId ? (
                              <span className="rounded-full bg-accent-pink/55 px-2 py-1 text-xs font-medium text-accent-pink-fg">
                                You
                              </span>
                            ) : null}
                            {index === 0 && entry.averagePickedScore != null ? (
                              <span className="rounded-full bg-accent-yellow/70 px-2 py-1 text-xs font-medium text-accent-yellow-fg">
                                Leading
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-secondary">
                            <span className="rounded-full bg-surface px-2 py-1">
                              {entry.pickedRounds} pick{entry.pickedRounds === 1 ? "" : "s"}
                            </span>
                            <span className="rounded-full bg-surface px-2 py-1">
                              {entry.reviewsWritten} review{entry.reviewsWritten === 1 ? "" : "s"}
                            </span>
                            {entry.topPickCount > 0 ? (
                              <span className="rounded-full bg-accent-lime/60 px-2 py-1 text-accent-lime-fg">
                                {entry.topPickCount} top pick
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-2 text-right">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                              Pick average
                            </p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                              {entry.averagePickedScore != null
                                ? entry.averagePickedScore.toFixed(1)
                                : "--"}
                            </p>
                          </div>
                          <p className="text-xs text-foreground-secondary">
                            Gives {entry.averageGivenScore != null ? entry.averageGivenScore.toFixed(1) : "--"} on average
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-accent-yellow/45 bg-accent-yellow/12 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-yellow-fg">
                  Club stats
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-surface/70 bg-surface/85 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                      Club average
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                      {clubAverage != null ? clubAverage.toFixed(1) : "--"}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-surface/70 bg-surface/85 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                      Words written
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                      {totalWords}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-accent-lime/35 bg-accent-lime/12 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
                  Best round
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {bestRound?.round.albumName ?? "Nothing revealed yet"}
                </h3>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {bestRound?.avg != null
                    ? `${bestRound.avg.toFixed(1)} average`
                    : "Waiting on the first reveal"}
                </p>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
