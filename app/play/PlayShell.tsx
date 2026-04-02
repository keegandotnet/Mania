"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  type GameResultsRosterRow,
  type MyGameState,
  getMyGameState,
  createGroup,
  joinGroup,
  leaveGroup,
  createGame,
  updateGameMaxRounds,
  updateGameAutoAdvance,
  startNextRound,
  submitAlbum,
  submitReview,
} from "@/app/actions/mania";

type Props = { initialState: MyGameState };

// ---------------------------------------------------------------------------
// Status banner
// ---------------------------------------------------------------------------

function statusFor(state: MyGameState): { title: string; detail: string; urgent: boolean } {
  const { group, game, round, hasReviewed } = state;

  if (!group) {
    return { title: "No group yet", detail: "Create a group or join one with an invite code below.", urgent: false };
  }
  if (!game) {
    return {
      title: `In group "${group.name}"`,
      detail: `Invite: ${group.inviteCode}. Once everyone has joined, create a game. Whoever creates the game is the host for that game.`,
      urgent: false,
    };
  }

  const cap = `Round ${game.currentRound} of ${game.maxRounds}`;

  if (game.status === "completed") {
    const last = round?.albumName
      ? `Last pick: "${round.albumName}"${round.artistName ? ` by ${round.artistName}` : ""}.`
      : "";
    return {
      title: "Game complete",
      detail: `${last} You reached the round limit (${game.maxRounds}). Start a new game below when you are ready.`,
      urgent: false,
    };
  }

  if (!round) {
    if (game.isHost) {
      return {
        title: "Game ready \u2014 no rounds yet",
        detail: `Up to ${game.maxRounds} rounds. Press \u201cStart round\u201d to kick things off.`,
        urgent: true,
      };
    }
    return {
      title: "Game ready \u2014 no rounds yet",
      detail: "Waiting for the host to start the first round.",
      urgent: false,
    };
  }

  if (round.status === "awaiting_album") {
    if (round.isPicker) {
      return {
        title: `${cap} — your pick`,
        detail: "It's your turn to submit an album for everyone to review.",
        urgent: true,
      };
    }
    return {
      title: `${cap} — waiting for album`,
      detail: "The picker hasn't chosen an album yet. Check back soon.",
      urgent: false,
    };
  }

  if (round.status === "awaiting_reviews") {
    const albumLabel = `"${round.albumName}" by ${round.artistName}`;
    if (round.isPicker) {
      return {
        title: `${cap} — awaiting reviews`,
        detail: `You submitted ${albumLabel}. Waiting for the others to review.`,
        urgent: false,
      };
    }
    if (!hasReviewed) {
      return {
        title: `${cap} — leave your review`,
        detail: `${albumLabel} is up. Rate it below.`,
        urgent: true,
      };
    }
    return {
      title: `${cap} — waiting for others`,
      detail: `You reviewed ${albumLabel}. Waiting for the rest of the group.`,
      urgent: false,
    };
  }

  // revealed
  const albumLabel = `"${round.albumName}" by ${round.artistName}`;
  if (game.isHost) {
    const autoHint =
      game.autoAdvance && game.currentRound < game.maxRounds
        ? " After the last review, the next round starts automatically until the round limit."
        : "";
    return {
      title: `${cap} — revealed`,
      detail: `${albumLabel}. Press "Start next round" when you are ready.${autoHint}`,
      urgent: !game.autoAdvance,
    };
  }
  return {
    title: `${cap} — revealed`,
    detail: `${albumLabel}. ${game.autoAdvance && game.currentRound < game.maxRounds ? "The host can start the next round early, or it will begin automatically after the last review." : "Waiting for the host to start the next round."}`,
    urgent: false,
  };
}

function averageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function seatLabel(viewerId: string, userId: string, roster: GameResultsRosterRow[]): string {
  const row = roster.find((r) => r.userId === userId);
  return row?.email ?? (userId === viewerId ? "You" : "Teammate");
}

// ---------------------------------------------------------------------------
// Inline feedback helpers
// ---------------------------------------------------------------------------

type FeedbackState = { kind: "error" | "ok"; message: string } | null;

function Feedback({ fb }: { fb: FeedbackState }) {
  if (!fb) return null;
  return (
    <p
      role={fb.kind === "error" ? "alert" : "status"}
      className={
        fb.kind === "error"
          ? "text-sm text-red-600 dark:text-red-400"
          : "text-sm text-foreground/70"
      }
    >
      {fb.message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function PlayShell({ initialState }: Props) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();

  const [groupFb, setGroupFb] = useState<FeedbackState>(null);
  const [joinFb, setJoinFb] = useState<FeedbackState>(null);
  const [gameFb, setGameFb] = useState<FeedbackState>(null);
  const [albumFb, setAlbumFb] = useState<FeedbackState>(null);
  const [reviewFb, setReviewFb] = useState<FeedbackState>(null);
  const [maxRoundsFb, setMaxRoundsFb] = useState<FeedbackState>(null);
  const [autoAdvanceFb, setAutoAdvanceFb] = useState<FeedbackState>(null);

  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaveFb, setLeaveFb] = useState<FeedbackState>(null);
  const [groupName, setGroupName] = useState("");
  const [joinInvite, setJoinInvite] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [albumUrl, setAlbumUrl] = useState("");
  const [rating, setRating] = useState("8");
  const [reviewText, setReviewText] = useState("");
  const [maxRoundsDraft, setMaxRoundsDraft] = useState(
    String(initialState.game?.maxRounds ?? 10)
  );

  const { group, game, round, hasReviewed, viewerId, revealedDetail } = state;
  const { title, detail, urgent } = statusFor(state);

  function refresh(prevRoundStatus?: string) {
    startTransition(async () => {
      const r = await getMyGameState();
      if (r.ok) {
        setState(r.data);
        if (r.data.game?.maxRounds != null) {
          setMaxRoundsDraft(String(r.data.game.maxRounds));
        }
        // Navigate to /results when the round transitions to revealed while on /play.
        if (
          r.data.round?.status === "revealed" &&
          prevRoundStatus !== "revealed"
        ) {
          router.push("/results");
        }
      }
    });
  }

  const groupId = group?.id ?? "";
  const gameId = game?.id ?? "";
  const roundId = round?.id ?? "";

  const noGroup = !group;
  const needsGameCreation = !!group && (!game || game.status === "completed");
  const canStartRound =
    !!game &&
    game.status !== "completed" &&
    game.isHost &&
    (!round || round.status === "revealed");
  const showAlbumForm =
    !!game &&
    game.status !== "completed" &&
    !!round &&
    round.status === "awaiting_album" &&
    round.isPicker;
  const showReviewForm =
    !!game &&
    game.status !== "completed" &&
    !!round &&
    round.status === "awaiting_reviews" &&
    !round.isPicker &&
    !hasReviewed;

  const showHostRoundControl =
    !!game?.isHost &&
    game.status !== "completed" &&
    (!round || round.status === "revealed");

  const playRoundAvg =
    revealedDetail && revealedDetail.reviews.length > 0
      ? averageRating(revealedDetail.reviews)
      : null;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Identity */}
      <p className="text-xs text-foreground/50">
        Signed in as{" "}
        <span className="font-mono text-foreground/80">{state.email}</span>
      </p>

      {/* Status banner */}
      <div
        className={`rounded-lg border p-4 ${
          urgent
            ? "border-foreground/40 bg-foreground/5"
            : "border-black/10 dark:border-white/15"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-0.5 text-sm text-foreground/70">{detail}</p>
            {game && game.status !== "completed" ? (
              <p className="mt-2 text-xs">
                <Link
                  href="/results"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  View round results
                </Link>{" "}
                <span className="text-foreground/45">(revealed rounds and scores)</span>
              </p>
            ) : null}
            {game && game.status === "completed" ? (
              <p className="mt-2 text-xs">
                <Link
                  href="/results"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  View final scores
                </Link>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => refresh(round?.status)}
            disabled={pending}
            className="shrink-0 text-xs text-foreground/50 underline-offset-2 hover:text-foreground hover:underline disabled:opacity-40"
          >
            {pending ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Latest revealed round — scores & reviews (timely per-round UX)     */}
      {/* ------------------------------------------------------------------ */}
      {revealedDetail && game && game.status !== "completed" && round?.status === "revealed" ? (
        <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15">
          <h2 className="text-sm font-semibold">
            Round {revealedDetail.roundNumber} results
          </h2>
          {round.albumName ? (
            <div className="min-w-0 space-y-1 border-b border-black/10 pb-3 dark:border-white/10">
              <p className="break-words text-sm text-foreground/90">
                <span className="font-medium">{round.albumName}</span>
                {round.artistName ? (
                  <>
                    {" "}
                    <span className="text-foreground/80">by {round.artistName}</span>
                  </>
                ) : null}
              </p>
              <p className="text-xs text-foreground/50">
                Picked by{" "}
                <span className="text-foreground/70">
                  {seatLabel(viewerId, revealedDetail.pickerId, revealedDetail.roster)}
                </span>
                {round.albumUrl ? (
                  <>
                    {" "}
                    <a
                      href={round.albumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      Open link
                    </a>
                  </>
                ) : null}
              </p>
              {playRoundAvg != null ? (
                <p className="text-sm font-medium text-foreground/80">
                  Average score: {playRoundAvg.toFixed(1)} / 10
                </p>
              ) : null}
            </div>
          ) : null}
          {revealedDetail.reviews.length === 0 ? (
            <p className="text-sm text-foreground/60">
              No reviews recorded (round was advanced early).
            </p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-3">
              {revealedDetail.reviews.map((rev) => (
                <li
                  key={`${round.id}-${rev.userId}`}
                  className="min-w-0 rounded-md bg-foreground/5 px-3 py-2 dark:bg-white/5"
                >
                  <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">
                      {seatLabel(viewerId, rev.userId, revealedDetail.roster)}
                    </span>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-foreground/80">
                      {rev.rating.toFixed(1)} / 10
                    </span>
                  </div>
                  {rev.reviewText.trim() ? (
                    <p className="mt-1 min-w-0 whitespace-pre-wrap break-words text-sm text-foreground/75">
                      {rev.reviewText}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs italic text-foreground/45">No written review</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-foreground/45">
            <Link
              href="/results"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              All revealed rounds
            </Link>{" "}
            <span className="text-foreground/40">(full history)</span>
          </p>
        </section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Host: start / advance round                                         */}
      {/* ------------------------------------------------------------------ */}
      {showHostRoundControl ? (
        <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15">
          <h2 className="text-sm font-semibold">Round control (host only)</h2>
          <p className="text-xs text-foreground/50">
            This game runs up to {game.maxRounds} rounds.
            {game.autoAdvance
              ? " Auto-advance is on: after the last review in a round, the next round starts automatically (until the limit)."
              : " Auto-advance is off: you start each new round with the button below."}
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-black/20 accent-foreground dark:border-white/30"
              checked={game.autoAdvance}
              disabled={pending}
              onChange={(e) => {
                const next = e.target.checked;
                setAutoAdvanceFb(null);
                setState((s) =>
                  s.game ? { ...s, game: { ...s.game, autoAdvance: next } } : s
                );
                startTransition(async () => {
                  const r = await updateGameAutoAdvance(gameId, next);
                  if (!r.ok) {
                    setAutoAdvanceFb({ kind: "error", message: r.message });
                    refresh();
                    return;
                  }
                  setAutoAdvanceFb({ kind: "ok", message: next ? "Auto-advance on." : "Auto-advance off." });
                  refresh();
                });
              }}
            />
            <span className="font-medium">Auto-advance after last review</span>
          </label>
          <Feedback fb={autoAdvanceFb} />
          {game.currentRound === 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">
                  Round limit (min {game.playerCount}–500)
                </span>
                <input
                  type="number"
                  min={game.playerCount}
                  max={500}
                  step={1}
                  value={maxRoundsDraft}
                  onChange={(e) => setMaxRoundsDraft(e.target.value)}
                  className="w-28 rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none focus:border-foreground/40 dark:border-white/20"
                />
              </label>
              <button
                type="button"
                disabled={pending}
                className="w-fit rounded-md border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20 disabled:opacity-40"
                onClick={() => {
                  setMaxRoundsFb(null);
                  const n = Number.parseInt(maxRoundsDraft, 10);
                  if (!Number.isInteger(n) || n < game.playerCount || n > 500) {
                    setMaxRoundsFb({
                      kind: "error",
                      message: `Enter a whole number from ${game.playerCount} to 500.`,
                    });
                    return;
                  }
                  startTransition(async () => {
                    const r = await updateGameMaxRounds(gameId, n);
                    if (!r.ok) {
                      setMaxRoundsFb({ kind: "error", message: r.message });
                      return;
                    }
                    setMaxRoundsFb({ kind: "ok", message: "Round limit saved." });
                    refresh();
                  });
                }}
              >
                Save round limit
              </button>
            </div>
          ) : (
            <p className="text-sm text-foreground/60">
              Round limit: <span className="font-semibold text-foreground">{game.maxRounds}</span>
              <span className="ml-2 text-xs text-foreground/45">(locked once play begins)</span>
            </p>
          )}
          <p className="text-xs text-foreground/45">
            Minimum {game.playerCount} round{game.playerCount !== 1 ? "s" : ""} — one per player so everyone gets to pick.
            {game.currentRound === 0
              ? " Can only be changed before the first round starts."
              : ""}
          </p>
          <Feedback fb={maxRoundsFb} />
          <button
            type="button"
            disabled={pending || !canStartRound}
            title={
              !canStartRound && round?.status === "awaiting_album"
                ? "Waiting for the picker to submit an album"
                : !canStartRound && round?.status === "awaiting_reviews"
                ? "Waiting for all reviews"
                : undefined
            }
            className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            onClick={() => {
              setGameFb(null);
              startTransition(async () => {
                const r = await startNextRound(gameId);
                if (!r.ok) {
                  setGameFb({ kind: "error", message: r.message });
                  return;
                }
                setGameFb({ kind: "ok", message: "Round started." });
                refresh();
              });
            }}
          >
            {round?.status === "revealed" ? "Start next round" : "Start round"}
          </button>
          {!canStartRound && round && (
            <p className="text-xs text-foreground/50">
              {round.status === "awaiting_album"
                ? "Blocked: picker hasn't submitted an album yet."
                : round.status === "awaiting_reviews"
                ? "Blocked: still waiting for all reviews."
                : null}
            </p>
          )}
          <Feedback fb={gameFb} />
        </section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Submit album (picker's turn)                                         */}
      {/* ------------------------------------------------------------------ */}
      {showAlbumForm ? (
        <section className="flex flex-col gap-3 rounded-lg border border-foreground/30 p-4">
          <h2 className="text-sm font-semibold">
            Submit album — Round {game?.currentRound}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Album</span>
              <input
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                className="rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none focus:border-foreground/40 dark:border-white/20"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Artist</span>
              <input
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none focus:border-foreground/40 dark:border-white/20"
              />
            </label>
            <label className="col-span-full flex flex-col gap-1 text-sm">
              <span className="font-medium">URL (optional)</span>
              <input
                value={albumUrl}
                onChange={(e) => setAlbumUrl(e.target.value)}
                className="rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none focus:border-foreground/40 dark:border-white/20"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={pending || !albumName.trim() || !artistName.trim()}
            className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            onClick={() => {
              setAlbumFb(null);
              startTransition(async () => {
                const r = await submitAlbum(gameId, albumName, artistName, albumUrl);
                if (!r.ok) {
                  setAlbumFb({ kind: "error", message: r.message });
                  return;
                }
                setAlbumFb({ kind: "ok", message: "Album submitted. Others can now review." });
                setAlbumName("");
                setArtistName("");
                setAlbumUrl("");
                refresh();
              });
            }}
          >
            Submit album
          </button>
          <Feedback fb={albumFb} />
        </section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Submit review                                                        */}
      {/* ------------------------------------------------------------------ */}
      {showReviewForm ? (
        <section className="flex flex-col gap-3 rounded-lg border border-foreground/30 p-4">
          <h2 className="text-sm font-semibold">
            Review — Round {game?.currentRound}
          </h2>
          {round?.albumName ? (
            <p className="min-w-0 break-words text-sm text-foreground/80">
              <span className="font-medium">{round.albumName}</span>
              {" by "}
              {round.artistName}
              {round.albumUrl ? (
                <>
                  {" "}
                  <a
                    href={round.albumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    Open
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Rating (1–10)</span>
              <input
                type="number"
                min={1}
                max={10}
                step={0.1}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none dark:border-white/20"
              />
            </label>
            <label className="col-span-full flex min-w-0 flex-col gap-1 text-sm">
              <span className="font-medium">Review (optional)</span>
              <textarea
                value={reviewText}
                rows={5}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-24 w-full resize-y rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none dark:border-white/20"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={pending}
            className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            onClick={() => {
              setReviewFb(null);
              startTransition(async () => {
                const r = await submitReview(roundId, Number(rating), reviewText);
                if (!r.ok) {
                  setReviewFb({ kind: "error", message: r.message });
                  return;
                }
                setReviewText("");
                if (r.data.revealed) {
                  router.push("/results");
                } else {
                  setReviewFb({ kind: "ok", message: "Review recorded." });
                  refresh(round?.status);
                }
              });
            }}
          >
            Submit review
          </button>
          <Feedback fb={reviewFb} />
        </section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Group & game setup (only when needed)                               */}
      {/* ------------------------------------------------------------------ */}
      {noGroup || needsGameCreation ? (
        <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
          <h2 className="text-sm font-semibold text-foreground/60">Setup</h2>

          {noGroup ? (
            <>
              {/* Create group */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium">Create a group</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                    <span className="sr-only">Group name</span>
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name"
                      className="rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none focus:border-foreground/40 dark:border-white/20"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending || !groupName.trim()}
                    className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
                    onClick={() => {
                      setGroupFb(null);
                      startTransition(async () => {
                        const r = await createGroup(groupName);
                        if (!r.ok) {
                          setGroupFb({ kind: "error", message: r.message });
                          return;
                        }
                        setGroupFb({
                          kind: "ok",
                          message: `Group created. Invite code: ${r.data.inviteCode}`,
                        });
                        setGroupName("");
                        refresh();
                      });
                    }}
                  >
                    Create
                  </button>
                </div>
                <Feedback fb={groupFb} />
              </div>

              <div className="border-t border-black/10 dark:border-white/10" />

              {/* Join group */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium">Join with invite code</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                    <span className="sr-only">Invite code</span>
                    <input
                      value={joinInvite}
                      onChange={(e) => setJoinInvite(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      maxLength={6}
                      className="rounded-md border border-black/15 bg-background px-3 py-2 font-mono text-foreground outline-none focus:border-foreground/40 dark:border-white/20"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending || joinInvite.length !== 6}
                    className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20 disabled:opacity-40"
                    onClick={() => {
                      setJoinFb(null);
                      startTransition(async () => {
                        const r = await joinGroup(joinInvite);
                        if (!r.ok) {
                          setJoinFb({ kind: "error", message: r.message });
                          return;
                        }
                        setJoinFb({ kind: "ok", message: "Joined group." });
                        setJoinInvite("");
                        refresh();
                      });
                    }}
                  >
                    Join
                  </button>
                </div>
                <Feedback fb={joinFb} />
              </div>
            </>
          ) : null}

          {needsGameCreation && group ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium">
                {game?.status === "completed"
                  ? "Start a new game for "
                  : "Start a game for "}
                <span className="font-semibold">{group.name}</span>
              </p>
              <p className="text-xs text-foreground/50">
                Invite code:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {group.inviteCode}
                </span>
              </p>
              {game?.status === "completed" ? (
                <p className="text-xs text-foreground/50">
                  You will be the host when you create the next game.
                </p>
              ) : null}
              <button
                type="button"
                disabled={pending}
                className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
                onClick={() => {
                  setGameFb(null);
                  startTransition(async () => {
                    const r = await createGame(groupId);
                    if (!r.ok) {
                      setGameFb({ kind: "error", message: r.message });
                      return;
                    }
                    setGameFb({ kind: "ok", message: "Game created." });
                    refresh();
                  });
                }}
              >
                Create game
              </button>
              <Feedback fb={gameFb} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Invite code reminder when in group with a non-completed game */}
      {group && game && game.status !== "completed" ? (
        <p className="text-xs text-foreground/40">
          Group invite:{" "}
          <span className="font-mono text-foreground/60">{group.inviteCode}</span>
        </p>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Leave group                                                          */}
      {/* ------------------------------------------------------------------ */}
      {group ? (
        <div className="border-t border-black/10 pt-4 dark:border-white/10">
          {!leaveConfirm ? (
            <button
              type="button"
              onClick={() => setLeaveConfirm(true)}
              className="text-xs text-foreground/40 underline-offset-2 hover:text-red-500 hover:underline"
            >
              Leave group &ldquo;{group.name}&rdquo;
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-foreground/70">
                Are you sure? If you are the sole member this will delete the
                group and all its game data. If others are in the group and you
                are the host of an active game, you must end the game first.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                  onClick={() => {
                    setLeaveFb(null);
                    startTransition(async () => {
                      const r = await leaveGroup(group.id);
                      if (!r.ok) {
                        setLeaveFb({ kind: "error", message: r.message });
                        setLeaveConfirm(false);
                        return;
                      }
                      setLeaveConfirm(false);
                      refresh();
                    });
                  }}
                >
                  Yes, leave
                </button>
                <button
                  type="button"
                  onClick={() => { setLeaveConfirm(false); setLeaveFb(null); }}
                  className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium dark:border-white/20"
                >
                  Cancel
                </button>
              </div>
              <Feedback fb={leaveFb} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
