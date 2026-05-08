import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { getMyGameHistory, getMyGroups } from "@/app/actions/mania";
import {
  PageShell,
  StatTile,
  cx,
  primaryButtonClass,
  primaryButtonLgClass,
  secondaryButtonClass,
  secondaryButtonLgClass,
  secondaryButtonSmClass,
  toneBadgeClass,
} from "@/app/components/ui";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { CopyInviteButton } from "./CopyInviteButton";
import { DisplayNameForm } from "./DisplayNameForm";
import { LeaveGroupButton } from "./LeaveGroupButton";

export const dynamic = "force-dynamic";

function statusTone(status: string): "lime" | "yellow" | "neutral" {
  if (status === "active") return "lime";
  if (status === "pending") return "yellow";
  return "neutral";
}

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "pending") return "Pending";
  if (status === "completed") return "Completed";
  return status;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const initialDisplayName = (profile?.display_name as string | null) ?? null;

  const historyResult = await getMyGameHistory();
  const gameHistory = historyResult.ok ? historyResult.data : [];

  const groupsResult = await getMyGroups();
  const myGroups = groupsResult.ok ? groupsResult.data : [];

  return (
    <PageShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border-2 border-foreground/15 bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-pink-fg landing-sticker-sm">
              Account
            </span>
            <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-6xl">
              Your club identity and history.
            </h1>
            <p className="mt-4 max-w-prose text-base leading-7 text-foreground-secondary sm:text-lg sm:leading-8">
              Set how the room sees you, track the groups you belong to, and
              keep a clean record of the games you have played.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/play" className={primaryButtonLgClass}>
              Go to Play
            </Link>
            <Link href="/results" className={secondaryButtonLgClass}>
              View Results
            </Link>
          </div>
        </header>

        <section className="rounded-[2.5rem] border-2 border-foreground bg-accent-yellow/30 p-6 landing-sticker sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-yellow-fg">
                  Profile summary
                </p>
                <h2 className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-4xl">
                  {initialDisplayName?.trim() || user.email || "Account"}
                </h2>
                <p className="mt-3 max-w-prose text-sm leading-7 text-foreground/85">
                  Signed in and ready. Your display name appears on Play and
                  Results, while your email remains your underlying account
                  identity.
                </p>
              </div>

              <span
                className={cx(
                  toneBadgeClass("lime"),
                  "uppercase tracking-[0.2em]"
                )}
              >
                Session active
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                label="Display name"
                value={initialDisplayName?.trim() || "Using email"}
              />
              <StatTile label="Groups" value={myGroups.length} />
              <StatTile label="Games" value={gameHistory.length} />
              <StatTile
                label="Email"
                value={
                  <span className="break-all text-sm font-bold">
                    {user.email ?? "No email"}
                  </span>
                }
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-6">
            <DisplayNameForm
              key={initialDisplayName ?? "__none__"}
              initialDisplayName={initialDisplayName}
            />

            <section className="rounded-[2rem] border-2 border-foreground bg-surface p-6 landing-sticker sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
                Account info
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Underlying identity
              </h2>
              <dl className="mt-5 grid gap-4">
                <div className="rounded-2xl border-2 border-foreground/10 bg-surface-raised/70 p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
                    User ID
                  </dt>
                  <dd className="mt-2 break-all font-mono text-xs text-foreground">
                    {user.id}
                  </dd>
                </div>
                {user.email ? (
                  <div className="rounded-2xl border-2 border-foreground/10 bg-surface-raised/70 p-4">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
                      Email
                    </dt>
                    <dd className="mt-2 break-all text-sm font-bold text-foreground">
                      {user.email}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>

          <section className="rounded-[2rem] border-2 border-foreground bg-surface p-6 landing-sticker sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
                  Groups
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  Your club memberships
                </h2>
              </div>
              <p className="text-xs text-foreground-secondary">
                Leaving a group does not remove your game history.
              </p>
            </div>

            {myGroups.length === 0 ? (
              <div className="mt-5 rounded-2xl border-2 border-foreground bg-accent-pink/30 p-5 landing-sticker-sm">
                <p className="text-sm leading-7 text-foreground/85">
                  Not a member of any groups yet. Join or create one from{" "}
                  <Link
                    href="/play"
                    className="font-bold text-foreground underline-offset-4 hover:underline"
                  >
                    Play
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ul className="mt-5 grid gap-3">
                {myGroups.map((group) => (
                  <li
                    key={group.groupId}
                    className="rounded-2xl border-2 border-foreground/10 bg-surface-raised/70 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-lg font-black tracking-tight">
                          {group.groupName}
                        </p>
                        <p className="mt-1 text-sm text-foreground-secondary">
                          Joined {formatDate(group.joinedAt)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center rounded-full border-2 border-foreground/15 bg-surface px-3 py-1 font-bold text-foreground-secondary">
                            {group.memberCount} member
                            {group.memberCount === 1 ? "" : "s"}
                          </span>
                          <span className="inline-flex items-center rounded-full border-2 border-foreground/15 bg-surface px-3 py-1 font-mono font-bold text-foreground">
                            {group.inviteCode}
                          </span>
                          <CopyInviteButton inviteCode={group.inviteCode} />
                        </div>
                      </div>
                      <LeaveGroupButton
                        groupId={group.groupId}
                        groupName={group.groupName}
                        memberCount={group.memberCount}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        <section className="rounded-[2rem] border-2 border-foreground bg-surface p-6 landing-sticker sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
                Game history
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Your recent runs
              </h2>
            </div>
            <p className="text-xs text-foreground-secondary">
              Most recent first, up to 20 shown
            </p>
          </div>

          {gameHistory.length === 0 ? (
            <div className="mt-5 rounded-2xl border-2 border-foreground bg-accent-lime/30 p-5 landing-sticker-sm">
              <p className="text-sm leading-7 text-foreground/85">
                No games yet. Join a group and start a game to build your record.
              </p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3">
              {gameHistory.map((game) => {
                const roundLabel =
                  game.status === "pending"
                    ? "Not started"
                    : `Round ${game.currentRound} of ${game.maxRounds}`;

                return (
                  <li
                    key={game.gameId}
                    className="rounded-2xl border-2 border-foreground/10 bg-surface-raised/70 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black tracking-tight">
                          {game.groupName}
                        </p>
                        <p className="mt-1 text-sm text-foreground-secondary">
                          {roundLabel}
                        </p>
                        <p className="mt-1 text-xs text-foreground-secondary">
                          {formatDate(game.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {game.status !== "pending" ? (
                          <Link
                            href={`/results?game=${game.gameId}`}
                            className={secondaryButtonSmClass}
                          >
                            View results
                          </Link>
                        ) : null}
                        <span className={toneBadgeClass(statusTone(game.status))}>
                          {statusLabel(game.status)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-[2.5rem] border-2 border-foreground bg-accent-peach/35 p-6 landing-sticker sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-peach-fg">
                Session controls
              </p>
              <h2 className="mt-2 text-balance text-2xl font-black tracking-tight sm:text-3xl">
                Leave cleanly.
              </h2>
              <p className="mt-3 text-sm leading-7 text-foreground/85">
                Go home, jump back into the game room, or sign out of this device.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/" className={secondaryButtonClass}>
                Home
              </Link>
              <form action={signOutAction}>
                <button type="submit" className={primaryButtonClass}>
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </section>
      </section>
    </PageShell>
  );
}
