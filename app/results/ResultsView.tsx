import Link from "next/link";
import type { GameResultsData, GameResultsRosterRow } from "@/app/actions/mania";
import { memberLabel } from "@/lib/mania/memberLabel";

function rosterLabel(viewerId: string, userId: string, roster: GameResultsRosterRow[]): string {
  return memberLabel(viewerId, userId, roster);
}

function averageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** Inline fallbacks — survives stale CSS where Tailwind utilities do not apply. */
function ratingTextColor(score: number): string {
  if (score >= 8) return "#059669";
  if (score >= 6) return "#d97706";
  return "#ef4444";
}

function ratingBarFillColor(score: number): string {
  if (score >= 8) return "#10b981";
  if (score >= 6) return "#fbbf24";
  return "#f87171";
}

type Props = { data: GameResultsData };

export function ResultsView({ data }: Props) {
  const { viewerId, email, viewerDisplayName, group, game, roster, rounds } = data;

  const bestRoundId =
    rounds.length > 1
      ? rounds.reduce(
          (best, r) => {
            const avg = averageRating(r.reviews);
            if (avg == null) return best;
            if (best.avg == null || avg > best.avg) return { id: r.id, avg };
            return best;
          },
          { id: "", avg: null as number | null }
        ).id
      : "";

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <p className="text-xs text-foreground/50">
        Signed in as{" "}
        <span className="text-foreground/80">{viewerDisplayName?.trim() || email}</span>
        {viewerDisplayName?.trim() ? (
          <span className="mt-0.5 block font-mono text-[0.7rem] text-foreground/45">{email}</span>
        ) : null}
      </p>

      {!group ? (
        <p className="text-sm text-foreground/70">
          Join a group on{" "}
          <Link href="/play" className="underline underline-offset-2">
            Play
          </Link>{" "}
          to see round results here.
        </p>
      ) : null}

      {group && !game ? (
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm font-medium">{group.name}</p>
          <p className="mt-2 text-sm text-foreground/70">
            No active or latest game yet. Start one from{" "}
            <Link href="/play" className="underline underline-offset-2">
              Play
            </Link>
            .
          </p>
        </div>
      ) : null}

      {group && game ? (
        <>
          {game.status === "completed" ? (
            <div className="rounded-lg border border-foreground/20 bg-foreground/[0.04] p-4 dark:border-white/20 dark:bg-white/[0.04]">
              <p className="text-sm font-semibold">Game over</p>
              <p className="mt-1 text-sm text-foreground/75">
                This session has ended. You are viewing the final scoreboard. Start a new game from Play when your group
                is ready.
              </p>
              <Link href="/play" className="mt-2 inline-block text-sm font-medium text-foreground underline-offset-2 hover:underline">
                Back to Play
              </Link>
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <p className="text-sm text-foreground/60">
              Group <span className="font-medium text-foreground">{group.name}</span>
              <span className="text-foreground/40"> · </span>
              <span className="font-mono text-foreground/70">{group.inviteCode}</span>
            </p>
            <p className="text-sm text-foreground/70">
              Round {game.currentRound} of {game.maxRounds}
              {game.status === "completed" ? " · Game complete" : ""}
            </p>
          </div>

          {rounds.length === 0 ? (
            <p className="text-sm text-foreground/70">
              No revealed rounds yet. After everyone reviews an album, scores show up here. You can keep
              playing on{" "}
              <Link href="/play" className="underline underline-offset-2">
                Play
              </Link>
              .
            </p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-6">
              {rounds.map((round) => {
                const avg = averageRating(round.reviews);
                const isBest = round.id === bestRoundId;

                return (
                  <li
                    key={round.id}
                    className="min-w-0 overflow-x-hidden rounded-xl border border-black/10 dark:border-white/15"
                  >
                    {/* Round header */}
                    <div className="border-b border-black/10 bg-foreground/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                              Round {round.roundNumber}
                            </span>
                            {isBest && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                style={{
                                  backgroundColor: "rgba(254, 243, 199, 1)",
                                  color: "#b45309",
                                }}
                              >
                                🏆 Top pick
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 min-w-0 [overflow-wrap:anywhere] text-base font-semibold leading-tight">
                            {round.albumName ?? "Album TBA"}
                          </p>
                          {round.artistName ? (
                            <p className="[overflow-wrap:anywhere] text-sm text-foreground/70">
                              by {round.artistName}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs text-foreground/50">
                            Picked by{" "}
                            <span className="text-foreground/80">
                              {rosterLabel(viewerId, round.pickerId, roster)}
                            </span>
                            {round.albumUrl ? (
                              <>
                                {" · "}
                                <a
                                  href={round.albumUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2"
                                >
                                  Listen
                                </a>
                              </>
                            ) : null}
                          </p>
                        </div>

                        {/* Average score badge */}
                        {avg != null ? (
                          <div
                            className="flex flex-col items-center rounded-lg border px-3 py-1.5"
                            style={{
                              borderColor: "rgba(0, 0, 0, 0.1)",
                              boxShadow:
                                avg >= 8
                                  ? "inset 0 0 0 2px rgba(16, 185, 129, 0.35)"
                                  : undefined,
                            }}
                          >
                            <span
                              className="text-2xl font-bold tabular-nums"
                              style={{ color: ratingTextColor(avg) }}
                            >
                              {avg.toFixed(1)}
                            </span>
                            <span className="text-xs text-foreground/45">avg / 10</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Reviews */}
                    {round.reviews.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-foreground/60">
                        No reviews recorded (round was advanced early).
                      </p>
                    ) : (
                      <ul className="flex min-w-0 flex-col divide-y divide-black/5 dark:divide-white/5">
                        {round.reviews.map((rev) => (
                          <li
                            key={`${round.id}-${rev.userId}`}
                            className="min-w-0 overflow-x-hidden px-4 py-3"
                          >
                            <div className="flex min-w-0 items-baseline justify-between gap-2">
                              <span className="min-w-0 truncate text-sm font-medium">
                                {rosterLabel(viewerId, rev.userId, roster)}
                              </span>
                              <span
                                className="shrink-0 font-mono text-sm font-semibold tabular-nums"
                                style={{ color: ratingTextColor(rev.rating) }}
                              >
                                {rev.rating.toFixed(1)}
                              </span>
                            </div>
                            {/* Visual rating bar */}
                            <div
                              className="mt-1.5 h-1 w-full overflow-hidden rounded-full"
                              style={{ backgroundColor: "rgba(128, 128, 128, 0.22)" }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(rev.rating / 10) * 100}%`,
                                  backgroundColor: ratingBarFillColor(rev.rating),
                                }}
                              />
                            </div>
                            {rev.reviewText.trim() ? (
                              <p
                                className="mt-2 min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm text-foreground/70"
                                style={{
                                  whiteSpace: "pre-wrap",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word",
                                }}
                              >
                                {rev.reviewText}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs italic text-foreground/40">No written review</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex gap-4 text-sm">
            <Link
              href="/play"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              ← Back to Play
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
