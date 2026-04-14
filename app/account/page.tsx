import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { getMyGameHistory, getMyGroups } from "@/app/actions/mania";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { CopyInviteButton } from "./CopyInviteButton";
import { DisplayNameForm } from "./DisplayNameForm";
import { LeaveGroupButton } from "./LeaveGroupButton";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  completed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

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
    <main className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-foreground/70">
          You are signed in. Supabase session cookies were validated on this request.
        </p>
      </div>
      <DisplayNameForm
        key={initialDisplayName ?? "__none__"}
        initialDisplayName={initialDisplayName}
      />
      <dl className="space-y-3 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
        <div>
          <dt className="text-foreground/60">User id</dt>
          <dd className="mt-1 font-mono text-xs break-all">{user.id}</dd>
        </div>
        {user.email ? (
          <div>
            <dt className="text-foreground/60">Email</dt>
            <dd className="mt-1">{user.email}</dd>
          </div>
        ) : null}
      </dl>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Your groups</h2>
        {myGroups.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-foreground/60 dark:border-white/15">
            Not a member of any groups yet. Join or create a group from the{" "}
            <Link href="/play" className="underline underline-offset-2">
              Play
            </Link>{" "}
            page.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {myGroups.map((g) => (
              <li
                key={g.groupId}
                className="rounded-lg border border-black/10 p-4 text-sm dark:border-white/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium">{g.groupName}</span>
                    <span className="text-xs text-foreground/50">
                      Joined {formatDate(g.joinedAt)}
                    </span>
                    <span className="flex items-center text-xs text-foreground/50">
                      <span className="font-mono">{g.inviteCode}</span>
                      <CopyInviteButton inviteCode={g.inviteCode} />
                    </span>
                  </div>
                  <LeaveGroupButton groupId={g.groupId} groupName={g.groupName} memberCount={g.memberCount} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-foreground/40">
          Leaving a group does not remove your game history.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Your games</h2>
        <p className="mb-4 text-xs text-foreground/50">Most recent first · up to 20 shown</p>
        {gameHistory.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-foreground/60 dark:border-white/15">
            No games yet. Join a group and start a game to see your history here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {gameHistory.map((g) => {
              const statusLabel = STATUS_LABELS[g.status] ?? g.status;
              const statusColor =
                STATUS_COLORS[g.status] ??
                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
              const roundLabel =
                g.status === "pending"
                  ? "Not started"
                  : `Round ${g.currentRound} of ${g.maxRounds}`;
              return (
                <li
                  key={g.gameId}
                  className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{g.groupName}</span>
                    <span className="text-xs text-foreground/50">{roundLabel}</span>
                    <span className="text-xs text-foreground/40">{formatDate(g.createdAt)}</span>
                  </div>
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/"
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Home
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
