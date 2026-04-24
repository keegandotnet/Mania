"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  type GroupRosterRow,
  type MyGameState,
  createGame,
  createGroup,
  getMyGameState,
  joinGroup,
  leaveGroup,
  startNextRound,
  submitAlbum,
  submitReview,
  updateGameAutoAdvance,
  updateGameMaxRounds,
} from "@/app/actions/mania";
import { memberLabel } from "@/lib/mania/memberLabel";
import { normalizeOptionalHttpUrl } from "@/lib/mania/url";

type Props = { initialState: MyGameState };
type FeedbackState = { kind: "error" | "ok"; message: string } | null;
type Tone = "neutral" | "orange" | "yellow" | "green" | "pink" | "lime" | "peach";

const surfaceCardClass =
  "rounded-[30px] border border-border bg-surface p-5 shadow-sm";
const subtleCardClass =
  "rounded-[26px] border border-border bg-surface-raised/65 p-4 shadow-sm";
const inputClass =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-secondary focus:border-border-strong disabled:opacity-50";
const textareaClass =
  "min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-foreground-secondary focus:border-border-strong disabled:opacity-50";
const primaryButtonClass =
  "rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover disabled:opacity-40";
const secondaryButtonClass =
  "rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised disabled:opacity-40";
const destructiveButtonClass =
  "rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function statusFor(state: MyGameState): {
  eyebrow: string;
  title: string;
  detail: string;
  tone: Tone;
  tag: string;
  urgent: boolean;
} {
  const { group, game, round, hasReviewed } = state;

  if (!group) {
    return {
      eyebrow: "Welcome",
      title: "No group yet",
      detail: "Create a group or join one with an invite code to get your club started.",
      tone: "pink",
      tag: "Setup",
      urgent: false,
    };
  }

  if (!game) {
    return {
      eyebrow: "Club ready",
      title: `You're in ${group.name}`,
      detail: `Invite code ${group.inviteCode}. Once everyone is in, create a game and start the first round.`,
      tone: "lime",
      tag: "No game",
      urgent: false,
    };
  }

  const cap = `Round ${game.currentRound} of ${game.maxRounds}`;

  if (game.status === "completed") {
    const last = round?.albumName
      ? `Last pick: "${round.albumName}"${round.artistName ? ` by ${round.artistName}` : ""}. `
      : "";
    return {
      eyebrow: "Finished",
      title: "Game complete",
      detail: `${last}Open the scoreboard for the full table, then decide whether to start another run.`,
      tone: "yellow",
      tag: "Complete",
      urgent: false,
    };
  }

  if (!round) {
    if (game.isHost) {
      return {
        eyebrow: "Host desk",
        title: "Game ready to start",
        detail: `You control the round limit and kickoff. ${cap} begins once you start round one.`,
        tone: "orange",
        tag: "Action",
        urgent: true,
      };
    }

    return {
      eyebrow: "Waiting room",
      title: "Game created, first round pending",
      detail: "The host has not started the first round yet.",
      tone: "neutral",
      tag: "Waiting",
      urgent: false,
    };
  }

  if (round.status === "awaiting_album") {
    if (round.isPicker) {
      return {
        eyebrow: cap,
        title: "Your pick is due",
        detail: "Choose the album, add the artist, and set the round in motion.",
        tone: "orange",
        tag: "Your turn",
        urgent: true,
      };
    }

    return {
      eyebrow: cap,
      title: "Waiting for the pick",
      detail: "The round exists, but the picker has not posted the album yet.",
      tone: "peach",
      tag: "Waiting",
      urgent: false,
    };
  }

  if (round.status === "awaiting_reviews") {
    const albumLabel = `"${round.albumName}" by ${round.artistName}`;

    if (round.isPicker) {
      return {
        eyebrow: cap,
        title: "Your pick is out for review",
        detail: `${albumLabel} is live. Now the room listens and writes back.`,
        tone: "lime",
        tag: "Submitted",
        urgent: false,
      };
    }

    if (!hasReviewed) {
      return {
        eyebrow: cap,
        title: "Leave your review",
        detail: `${albumLabel} is waiting on your score and notes.`,
        tone: "orange",
        tag: "Your turn",
        urgent: true,
      };
    }

    return {
      eyebrow: cap,
      title: "Review sent",
      detail: `You already reviewed ${albumLabel}. Waiting for the rest of the room.`,
      tone: "green",
      tag: "Submitted",
      urgent: false,
    };
  }

  return {
    eyebrow: cap,
    title: "Round revealed",
    detail: game.isHost
      ? "Scores are in. Start the next round when the room is ready."
      : "Scores are in. Waiting for the host to move the club forward.",
    tone: "yellow",
    tag: "Revealed",
    urgent: false,
  };
}

function averageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function scoreToneClass(rating: number) {
  if (rating >= 8.5) return "bg-accent-lime/60 text-accent-lime-fg";
  if (rating >= 7) return "bg-accent-yellow/70 text-accent-yellow-fg";
  if (rating >= 5) return "bg-accent-peach/60 text-accent-peach-fg";
  return "bg-accent-pink/55 text-accent-pink-fg";
}

function scoreLabel(rating: number) {
  if (rating >= 9) return "All timer";
  if (rating >= 8) return "Strong yes";
  if (rating >= 7) return "Works on me";
  if (rating >= 6) return "Mixed bag";
  if (rating >= 4) return "Not landing";
  return "Hard no";
}

function wordCount(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function groupMemberLabel(viewerId: string, userId: string, roster: GroupRosterRow[]) {
  return memberLabel(viewerId, userId, roster);
}

function toneCardClass(tone: Tone) {
  switch (tone) {
    case "orange":
      return "border-accent-orange/45 bg-accent-orange/10 ring-1 ring-accent-orange/15";
    case "yellow":
      return "border-accent-yellow/45 bg-accent-yellow/18";
    case "green":
      return "border-accent-green/35 bg-accent-green/10";
    case "pink":
      return "border-accent-pink/35 bg-accent-pink/12";
    case "lime":
      return "border-accent-lime/35 bg-accent-lime/12";
    case "peach":
      return "border-accent-peach/40 bg-accent-peach/12";
    default:
      return "border-border bg-surface";
  }
}

function toneBadgeClass(tone: Tone) {
  switch (tone) {
    case "orange":
      return "bg-accent-orange text-white";
    case "yellow":
      return "bg-accent-yellow/75 text-accent-yellow-fg";
    case "green":
      return "bg-accent-green/15 text-accent-green-fg";
    case "pink":
      return "bg-accent-pink/55 text-accent-pink-fg";
    case "lime":
      return "bg-accent-lime/60 text-accent-lime-fg";
    case "peach":
      return "bg-accent-peach/60 text-accent-peach-fg";
    default:
      return "bg-surface-raised text-foreground-secondary";
  }
}

function Feedback({ fb }: { fb: FeedbackState }) {
  return (
    <div className="min-h-6">
      {fb ? (
        <p
          role={fb.kind === "error" ? "alert" : "status"}
          className={cx(
            "text-sm",
            fb.kind === "error" ? "text-red-600 dark:text-red-400" : "text-foreground-secondary"
          )}
        >
          {fb.message}
        </p>
      ) : null}
    </div>
  );
}

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
  const [leaveFb, setLeaveFb] = useState<FeedbackState>(null);

  const [leaveConfirm, setLeaveConfirm] = useState(false);
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
  const status = statusFor(state);

  function refresh(prevRoundStatus?: string) {
    startTransition(async () => {
      const result = await getMyGameState();
      if (!result.ok) return;

      setState(result.data);
      if (result.data.game?.maxRounds != null) {
        setMaxRoundsDraft(String(result.data.game.maxRounds));
      }

      if (
        result.data.round?.status === "revealed" &&
        prevRoundStatus !== "revealed"
      ) {
        router.push("/results");
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
  const parsedRating = Number.parseFloat(rating);
  const ratingValue = Number.isFinite(parsedRating) ? parsedRating : 0;
  const reviewWords = wordCount(reviewText);

  const quickFacts = [
    {
      label: "Identity",
      value: state.viewerDisplayName?.trim() || state.email,
      tone: "pink" as const,
    },
    {
      label: "Group",
      value: group?.name ?? "Not joined yet",
      tone: "lime" as const,
    },
    {
      label: "Invite",
      value: group?.inviteCode ?? "------",
      tone: "yellow" as const,
    },
    {
      label: "Round",
      value: game ? `${game.currentRound}/${game.maxRounds}` : "Not started",
      tone: "peach" as const,
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className={cx("rounded-[34px] p-6 shadow-sm", toneCardClass(status.tone))}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
                {status.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {status.title}
              </h2>
              <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                {status.detail}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={cx(
                  "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
                  toneBadgeClass(status.tone)
                )}
              >
                {status.tag}
              </span>
              <button
                type="button"
                onClick={() => refresh(round?.status)}
                disabled={pending}
                className={secondaryButtonClass}
              >
                {pending ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickFacts.map((fact) => (
              <div
                key={fact.label}
                className={cx("rounded-[24px] border p-4", toneCardClass(fact.tone))}
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  {fact.label}
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-foreground">
                  {fact.value}
                </p>
                {fact.label === "Identity" && state.viewerDisplayName?.trim() ? (
                  <p className="mt-1 break-all font-mono text-xs text-foreground-secondary">
                    {state.email}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {(game || revealedDetail) && (
              <Link href="/results" className={secondaryButtonClass}>
                View results
              </Link>
            )}
            <Link href="/account" className={secondaryButtonClass}>
              Manage account
            </Link>
            {status.urgent ? (
              <span className="rounded-full bg-surface/75 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Needs your action
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {game?.status === "completed" ? (
        <section className={cx(surfaceCardClass, "border-accent-yellow/45 bg-accent-yellow/10")}>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-yellow-fg">
            Finished run
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">This game is wrapped.</h2>
          <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
            Every round is complete. Use the scoreboard for the full history, then
            start a new game from the setup section when your group is ready.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/results" className={secondaryButtonClass}>
              View final scores
            </Link>
            <Link href="/account" className={secondaryButtonClass}>
              Edit display name
            </Link>
          </div>
        </section>
      ) : null}

      {group && state.groupRoster && state.groupRoster.length > 0 ? (
        <section className={surfaceCardClass}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Club roster
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Who is in the room</h2>
            </div>
            <p className="text-xs text-foreground-secondary">
              {state.groupRoster.length} member{state.groupRoster.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {state.groupRoster.map((member, index) => (
              <div
                key={member.userId}
                className="rounded-[24px] border border-border bg-surface-raised/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-foreground-secondary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {member.userId === viewerId ? (
                    <span className="rounded-full bg-accent-pink/55 px-2 py-1 text-xs font-medium text-accent-pink-fg">
                      You
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {groupMemberLabel(viewerId, member.userId, state.groupRoster)}
                </p>
                <p className="mt-1 break-all text-xs text-foreground-secondary">
                  {member.email}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {revealedDetail && game && game.status !== "completed" && round?.status === "revealed" ? (
        <section className={cx(surfaceCardClass, "border-accent-yellow/45 bg-accent-yellow/10")}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-yellow-fg">
                Round {revealedDetail.roundNumber} revealed
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {round.albumName}
              </h2>
              <p className="mt-2 text-sm text-foreground-secondary">
                {round.artistName}
                {round.albumUrl ? (
                  <>
                    {" "}
                    <a
                      href={round.albumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Open link
                    </a>
                  </>
                ) : null}
              </p>
              <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                Picked by{" "}
                <span className="font-medium text-foreground">
                  {memberLabel(viewerId, revealedDetail.pickerId, revealedDetail.roster)}
                </span>
                . Every score and note from the room is open now.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[26rem] lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Average
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {playRoundAvg != null ? playRoundAvg.toFixed(1) : "--"}
                </p>
              </div>
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Reviews
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {revealedDetail.reviews.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Mood
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {playRoundAvg != null ? scoreLabel(playRoundAvg) : "No verdict"}
                </p>
              </div>
            </div>
          </div>

          {revealedDetail.reviews.length === 0 ? (
            <p className="mt-5 text-sm text-foreground-secondary">
              No reviews were recorded for this round.
            </p>
          ) : (
            <ul className="mt-5 grid gap-3">
              {revealedDetail.reviews.map((review) => (
                <li
                  key={`${round.id}-${review.userId}`}
                  className="rounded-[24px] border border-surface/70 bg-surface/85 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {memberLabel(viewerId, review.userId, revealedDetail.roster)}
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
                  {review.reviewText.trim() ? (
                    <p
                      className="mt-3 max-w-prose whitespace-pre-wrap text-sm leading-7 text-foreground-secondary [overflow-wrap:anywhere]"
                      style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}
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
        </section>
      ) : null}

      {showHostRoundControl ? (
        <section className={cx(surfaceCardClass, "border-accent-peach/40 bg-accent-peach/10")}>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-peach-fg">
            Host controls
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Move the club forward</h2>
          <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
            Set the round limit before play begins, choose whether rounds auto-advance,
            and start the next round when the room is ready.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className={subtleCardClass}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-border accent-[var(--accent-orange)]"
                  checked={game.autoAdvance}
                  disabled={pending}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setAutoAdvanceFb(null);
                    setState((current) =>
                      current.game ? { ...current, game: { ...current.game, autoAdvance: next } } : current
                    );
                    startTransition(async () => {
                      const result = await updateGameAutoAdvance(gameId, next);
                      if (!result.ok) {
                        setAutoAdvanceFb({ kind: "error", message: result.message });
                        refresh();
                        return;
                      }
                      setAutoAdvanceFb({
                        kind: "ok",
                        message: next ? "Auto-advance is on." : "Auto-advance is off.",
                      });
                      refresh();
                    });
                  }}
                />
                <span>
                  <span className="block font-medium text-foreground">
                    Auto-advance after the last review
                  </span>
                  <span className="mt-1 block text-foreground-secondary">
                    {game.autoAdvance
                      ? "The next round starts automatically until the round limit is reached."
                      : "You start every round manually."}
                  </span>
                </span>
              </label>
              <div className="mt-3">
                <Feedback fb={autoAdvanceFb} />
              </div>
            </div>

            <div className={subtleCardClass}>
              {game.currentRound === 0 ? (
                <>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      Round limit (minimum {game.playerCount}, maximum 500)
                    </span>
                    <input
                      type="number"
                      min={game.playerCount}
                      max={500}
                      step={1}
                      value={maxRoundsDraft}
                      onChange={(event) => setMaxRoundsDraft(event.target.value)}
                      className={cx(inputClass, "w-32")}
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      className={secondaryButtonClass}
                      onClick={() => {
                        setMaxRoundsFb(null);
                        const nextMax = Number.parseInt(maxRoundsDraft, 10);
                        if (
                          !Number.isInteger(nextMax) ||
                          nextMax < game.playerCount ||
                          nextMax > 500
                        ) {
                          setMaxRoundsFb({
                            kind: "error",
                            message: `Enter a whole number from ${game.playerCount} to 500.`,
                          });
                          return;
                        }
                        startTransition(async () => {
                          const result = await updateGameMaxRounds(gameId, nextMax);
                          if (!result.ok) {
                            setMaxRoundsFb({ kind: "error", message: result.message });
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
                </>
              ) : (
                <p className="text-sm text-foreground-secondary">
                  Round limit is locked at{" "}
                  <span className="font-semibold text-foreground">{game.maxRounds}</span>{" "}
                  because play has already started.
                </p>
              )}

              <p className="mt-3 text-xs text-foreground-secondary">
                There must be at least one round per player so everyone gets a pick.
              </p>
              <div className="mt-3">
                <Feedback fb={maxRoundsFb} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending || !canStartRound}
              title={
                !canStartRound && round?.status === "awaiting_album"
                  ? "Waiting for the picker to submit an album."
                  : !canStartRound && round?.status === "awaiting_reviews"
                    ? "Waiting for every review to come in."
                    : undefined
              }
              className={primaryButtonClass}
              onClick={() => {
                setGameFb(null);
                startTransition(async () => {
                  const result = await startNextRound(gameId);
                  if (!result.ok) {
                    setGameFb({ kind: "error", message: result.message });
                    return;
                  }
                  setGameFb({ kind: "ok", message: "Round started." });
                  refresh();
                });
              }}
            >
              {round?.status === "revealed" ? "Start next round" : "Start round"}
            </button>
            {!canStartRound && round ? (
              <span className="text-sm text-foreground-secondary">
                {round.status === "awaiting_album"
                  ? "Blocked until the picker posts the album."
                  : round.status === "awaiting_reviews"
                    ? "Blocked until every review is in."
                    : null}
              </span>
            ) : null}
          </div>
          <div className="mt-3">
            <Feedback fb={gameFb} />
          </div>
        </section>
      ) : null}

      {showAlbumForm ? (
        <section className={cx(surfaceCardClass, "border-accent-orange/45 bg-accent-orange/10 ring-1 ring-accent-orange/15")}>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-orange-fg">
            Picker action
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Submit your album for round {game?.currentRound}
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
            This is the record everyone will live with for the round. Keep the link
            optional, but the album and artist are required.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Album</span>
              <input
                value={albumName}
                onChange={(event) => setAlbumName(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Artist</span>
              <input
                value={artistName}
                onChange={(event) => setArtistName(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="sm:col-span-2 flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Album URL (optional)</span>
              <input
                value={albumUrl}
                onChange={(event) => setAlbumUrl(event.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending || !albumName.trim() || !artistName.trim()}
              className={primaryButtonClass}
              onClick={() => {
                setAlbumFb(null);
                const normalizedAlbumUrl = normalizeOptionalHttpUrl(albumUrl);
                if (!normalizedAlbumUrl.ok) {
                  setAlbumFb({ kind: "error", message: normalizedAlbumUrl.message });
                  return;
                }
                startTransition(async () => {
                  const result = await submitAlbum(
                    gameId,
                    albumName,
                    artistName,
                    normalizedAlbumUrl.value ?? ""
                  );
                  if (!result.ok) {
                    setAlbumFb({ kind: "error", message: result.message });
                    return;
                  }
                  setAlbumFb({
                    kind: "ok",
                    message: "Album submitted. The room can review now.",
                  });
                  setAlbumName("");
                  setArtistName("");
                  setAlbumUrl("");
                  refresh();
                });
              }}
            >
              Submit album
            </button>
          </div>
          <div className="mt-3">
            <Feedback fb={albumFb} />
          </div>
        </section>
      ) : null}

      {showReviewForm ? (
        <section className={cx(surfaceCardClass, "border-accent-pink/35 bg-accent-pink/10")}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-pink-fg">
                Review panel
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Write your take for round {game?.currentRound}
              </h2>
              <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                Score the album, leave a note if you have one, and your review stays hidden
                until the room reaches the reveal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[26rem] lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Current score
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {Number.isFinite(parsedRating) ? ratingValue.toFixed(1) : "--"}
                </p>
              </div>
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Feeling
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {Number.isFinite(parsedRating) ? scoreLabel(ratingValue) : "Pick a score"}
                </p>
              </div>
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Note length
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {reviewWords}
                </p>
              </div>
            </div>
          </div>

          {round?.albumName ? (
            <div className="mt-5 rounded-[24px] border border-accent-yellow/40 bg-accent-yellow/12 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-yellow-fg">
                    Current album
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{round.albumName}</p>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {round.artistName}
                    {round.albumUrl ? (
                      <>
                        {" "}
                        <a
                          href={round.albumUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          Open link
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-foreground-secondary">
                  <span className="rounded-full bg-surface/85 px-3 py-2">
                    Hidden until reveal
                  </span>
                  <span className="rounded-full bg-surface/85 px-3 py-2">
                    Decimals allowed
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
            <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-foreground">Rating (1-10)</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  className={cx(inputClass, "w-32")}
                />
              </label>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Quick picks
                </p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={cx(
                        "rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors",
                        Number.isFinite(parsedRating) && Math.abs(ratingValue - value) < 0.05
                          ? "border-accent-orange bg-accent-orange text-white"
                          : "border-border bg-surface hover:bg-surface-raised"
                      )}
                      onClick={() => setRating(String(value))}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-5 flex flex-col gap-2 text-sm">
                <span className="font-medium text-foreground">Review (optional)</span>
                <textarea
                  value={reviewText}
                  rows={6}
                  onChange={(event) => setReviewText(event.target.value)}
                  className={textareaClass}
                  placeholder="What landed? What missed? What would you bring up if the group argued about this one?"
                />
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={pending}
                  className={primaryButtonClass}
                  onClick={() => {
                    setReviewFb(null);
                    startTransition(async () => {
                      const result = await submitReview(roundId, Number(rating), reviewText);
                      if (!result.ok) {
                        setReviewFb({ kind: "error", message: result.message });
                        return;
                      }
                      setReviewText("");
                      if (result.data.revealed) {
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
              </div>
              <div className="mt-3">
                <Feedback fb={reviewFb} />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[24px] border border-accent-lime/35 bg-accent-lime/10 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
                  Live read
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span
                    className={cx(
                      "rounded-full px-3 py-1 text-sm font-medium",
                      Number.isFinite(parsedRating)
                        ? scoreToneClass(ratingValue)
                        : "bg-surface text-foreground-secondary"
                    )}
                  >
                    {Number.isFinite(parsedRating) ? `${ratingValue.toFixed(1)} / 10` : "No score yet"}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {Number.isFinite(parsedRating) ? scoreLabel(ratingValue) : "Waiting on your score"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-foreground-secondary">
                  Your note is private until reveal. Once submitted, you cannot keep editing here while the room waits.
                </p>
              </div>

              <div className="rounded-[24px] border border-accent-peach/40 bg-accent-peach/10 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-peach-fg">
                  Good review prompts
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground-secondary">
                  <li>What is this album trying to do?</li>
                  <li>Which track or moment changed your score the most?</li>
                  <li>Would you revisit it outside the game?</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {noGroup || needsGameCreation ? (
        <section className={surfaceCardClass}>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
            Setup
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Build the room before the round starts
          </h2>

          {noGroup ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className={cx(subtleCardClass, "border-accent-pink/35 bg-accent-pink/10")}>
                <p className="text-sm font-semibold text-foreground">Create a group</p>
                <p className="mt-2 text-sm leading-7 text-foreground-secondary">
                  Start a new private album club and get an invite code for everyone else.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="Group name"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    disabled={pending || !groupName.trim()}
                    className={primaryButtonClass}
                    onClick={() => {
                      setGroupFb(null);
                      startTransition(async () => {
                        const result = await createGroup(groupName);
                        if (!result.ok) {
                          setGroupFb({ kind: "error", message: result.message });
                          return;
                        }
                        setGroupFb({
                          kind: "ok",
                          message: `Group created. Invite code: ${result.data.inviteCode}`,
                        });
                        setGroupName("");
                        refresh();
                      });
                    }}
                  >
                    Create group
                  </button>
                </div>
                <div className="mt-3">
                  <Feedback fb={groupFb} />
                </div>
              </div>

              <div className={cx(subtleCardClass, "border-accent-lime/35 bg-accent-lime/10")}>
                <p className="text-sm font-semibold text-foreground">Join with an invite code</p>
                <p className="mt-2 text-sm leading-7 text-foreground-secondary">
                  Already invited? Enter the six-character code to join the room.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    value={joinInvite}
                    onChange={(event) => setJoinInvite(event.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className={cx(inputClass, "font-mono")}
                  />
                  <button
                    type="button"
                    disabled={pending || joinInvite.length !== 6}
                    className={secondaryButtonClass}
                    onClick={() => {
                      setJoinFb(null);
                      startTransition(async () => {
                        const result = await joinGroup(joinInvite);
                        if (!result.ok) {
                          setJoinFb({ kind: "error", message: result.message });
                          return;
                        }
                        setJoinFb({ kind: "ok", message: "Joined group." });
                        setJoinInvite("");
                        refresh();
                      });
                    }}
                  >
                    Join group
                  </button>
                </div>
                <div className="mt-3">
                  <Feedback fb={joinFb} />
                </div>
              </div>
            </div>
          ) : null}

          {needsGameCreation && group ? (
            <div className="mt-5 rounded-[26px] border border-accent-peach/40 bg-accent-peach/10 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-peach-fg">
                Game setup
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {game?.status === "completed" ? "Start another run" : `Start a game for ${group.name}`}
              </h3>
              <p className="mt-3 text-sm leading-7 text-foreground-secondary">
                Invite code{" "}
                <span className="font-mono font-semibold text-foreground">{group.inviteCode}</span>.
                {game?.status === "completed"
                  ? " This starts a fresh scoreboard for the same group."
                  : " The creator becomes the host for this game."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={pending}
                  className={primaryButtonClass}
                  onClick={() => {
                    setGameFb(null);
                    startTransition(async () => {
                      const result = await createGame(groupId);
                      if (!result.ok) {
                        setGameFb({ kind: "error", message: result.message });
                        return;
                      }
                      setGameFb({ kind: "ok", message: "Game created." });
                      refresh();
                    });
                  }}
                >
                  Create game
                </button>
              </div>
              <div className="mt-3">
                <Feedback fb={gameFb} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {group && game && game.status !== "completed" ? (
        <section className={cx(surfaceCardClass, "border-accent-lime/35 bg-accent-lime/10")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
                Club access
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">Invite code</h2>
            </div>
            <span className="font-mono text-lg font-semibold tracking-[0.2em] text-foreground">
              {group.inviteCode}
            </span>
          </div>
        </section>
      ) : null}

      {group ? (
        <section className={surfaceCardClass}>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
            Membership
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            Leave {group.name}
          </h2>

          {!leaveConfirm ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setLeaveConfirm(true)}
                className={secondaryButtonClass}
              >
                Leave group
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-red-200 bg-red-50 p-4 dark:border-red-950/50 dark:bg-red-950/20">
              <p className="text-sm leading-7 text-foreground-secondary">
                If you are the only member, the group and its game data will be removed.
                If other members remain and you host an active game, end that game first.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={pending}
                  className={destructiveButtonClass}
                  onClick={() => {
                    setLeaveFb(null);
                    startTransition(async () => {
                      const result = await leaveGroup(group.id);
                      if (!result.ok) {
                        setLeaveFb({ kind: "error", message: result.message });
                        setLeaveConfirm(false);
                        return;
                      }
                      setLeaveConfirm(false);
                      refresh();
                    });
                  }}
                >
                  Yes, leave group
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLeaveConfirm(false);
                    setLeaveFb(null);
                  }}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3">
                <Feedback fb={leaveFb} />
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
