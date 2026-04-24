import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { getMyGameHistory, getMyGroups } from "@/app/actions/mania";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { CopyInviteButton } from "./CopyInviteButton";
import { DisplayNameForm } from "./DisplayNameForm";
import { LeaveGroupButton } from "./LeaveGroupButton";

export const dynamic = "force-dynamic";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function statusToneClass(status: string) {
  if (status === "active") return "bg-accent-lime/60 text-accent-lime-fg";
  if (status === "pending") return "bg-accent-yellow/70 text-accent-yellow-fg";
  if (status === "completed") return "bg-surface-raised text-foreground-secondary";
  return "bg-surface-raised text-foreground-secondary";
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
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent-pink/28 blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-72 w-72 rounded-full bg-accent-lime/24 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/3 h-80 w-80 rounded-full bg-accent-yellow/22 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-gradient-to-b from-surface/75 via-background/45 to-transparent" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-pink/35 bg-accent-pink/12 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-pink-fg">
              Account
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Your club identity and history.
            </h1>
            <p className="mt-4 max-w-prose text-sm leading-7 text-foreground-secondary sm:text-base">
              Set how the room sees you, track the groups you belong to, and keep a
              clean record of the games you have played.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/play"
              className="rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover"
            >
              Go to Play
            </Link>
            <Link
              href="/results"
              className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised"
            >
              View Results
            </Link>
          </div>
        </div>

        <section className="rounded-[34px] border border-accent-yellow/45 bg-accent-yellow/12 p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-yellow-fg">
                  Profile summary
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {initialDisplayName?.trim() || user.email || "Account"}
                </h2>
                <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                  Signed in and ready. Your display name appears on Play and Results,
                  while your email remains your underlying account identity.
                </p>
              </div>

              <div className="rounded-[24px] border border-surface/70 bg-surface/85 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Session
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  Active
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Display name
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-foreground">
                  {initialDisplayName?.trim() || "Using email"}
                </p>
              </div>
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Groups
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {myGroups.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Games
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {gameHistory.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-surface/70 bg-surface/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Email
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-foreground">
                  {user.email ?? "No email"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-6">
            <DisplayNameForm
              key={initialDisplayName ?? "__none__"}
              initialDisplayName={initialDisplayName}
            />

            <section className="rounded-[30px] border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Account info
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Underlying identity</h2>
              <dl className="mt-5 grid gap-4">
                <div className="rounded-[24px] border border-border bg-surface-raised/65 p-4">
                  <dt className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                    User ID
                  </dt>
                  <dd className="mt-2 break-all font-mono text-xs text-foreground">
                    {user.id}
                  </dd>
                </div>
                {user.email ? (
                  <div className="rounded-[24px] border border-border bg-surface-raised/65 p-4">
                    <dt className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                      Email
                    </dt>
                    <dd className="mt-2 break-all text-sm font-semibold text-foreground">
                      {user.email}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>

          <section className="rounded-[30px] border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Groups
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your club memberships</h2>
              </div>
              <p className="text-xs text-foreground-secondary">
                Leaving a group does not remove your game history.
              </p>
            </div>

            {myGroups.length === 0 ? (
              <div className="mt-5 rounded-[24px] border border-accent-pink/35 bg-accent-pink/12 p-5">
                <p className="text-sm leading-7 text-foreground-secondary">
                  Not a member of any groups yet. Join or create one from{" "}
                  <Link
                    href="/play"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
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
                    className="rounded-[24px] border border-border bg-surface-raised/60 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold tracking-tight text-foreground">
                          {group.groupName}
                        </p>
                        <p className="mt-1 text-sm text-foreground-secondary">
                          Joined {formatDate(group.joinedAt)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
                          <span className="rounded-full bg-surface px-2 py-1">
                            {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                          </span>
                          <span className="rounded-full bg-surface px-2 py-1 font-mono">
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

        <section className="rounded-[30px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                Game history
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your recent runs</h2>
            </div>
            <p className="text-xs text-foreground-secondary">Most recent first, up to 20 shown</p>
          </div>

          {gameHistory.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-accent-lime/35 bg-accent-lime/12 p-5">
              <p className="text-sm leading-7 text-foreground-secondary">
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
                    className="rounded-[24px] border border-border bg-surface-raised/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{game.groupName}</p>
                        <p className="mt-1 text-sm text-foreground-secondary">{roundLabel}</p>
                        <p className="mt-1 text-xs text-foreground-secondary">
                          {formatDate(game.createdAt)}
                        </p>
                      </div>
                      <span
                        className={cx(
                          "w-fit rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
                          statusToneClass(game.status)
                        )}
                      >
                        {statusLabel(game.status)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-[30px] border border-accent-peach/40 bg-accent-peach/12 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-peach-fg">
                Session controls
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Leave cleanly</h2>
              <p className="mt-3 text-sm leading-7 text-foreground-secondary">
                Go home, jump back into the game room, or sign out of this device.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised"
              >
                Home
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
