import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PageShell,
  primaryButtonLgClass,
  secondaryButtonLgClass,
} from "@/app/components/ui";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameResults, getMyGroups, type GameResultsData } from "@/app/actions/mania";
import { ResultsView } from "./ResultsView";

export const dynamic = "force-dynamic";

type ResultsPageProps = {
  searchParams?: Promise<{ game?: string; group?: string }>;
};

export default async function ResultsPage(props: ResultsPageProps) {
  const searchParams = (await props.searchParams) ?? {};
  const scopedGameId = searchParams.game?.trim() || undefined;
  const scopedGroupId = searchParams.group?.trim() || undefined;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextQuery = new URLSearchParams();
    if (scopedGameId) nextQuery.set("game", scopedGameId);
    if (scopedGroupId) nextQuery.set("group", scopedGroupId);
    const nextPath = nextQuery.size > 0 ? `/results?${nextQuery}` : "/results";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const result = await getGameResults(scopedGameId, scopedGroupId);
  if (!result.ok) throw new Error(result.message);
  const data: GameResultsData = result.data;
  const backGroupId = scopedGroupId ?? data.group?.id;
  const groupsResult = await getMyGroups();
  if (!groupsResult.ok) throw new Error(groupsResult.message);
  const groups = groupsResult.data;

  return (
    <PageShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border-2 border-foreground/15 bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-yellow-fg landing-sticker-sm">
              Scoreboard
            </span>
            <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-6xl">
              Round reveals and the running table.
            </h1>
            <p className="mt-4 max-w-prose text-base leading-7 text-foreground-secondary sm:text-lg sm:leading-8">
              Results is the memory of the club: every revealed pick, every
              written take, and the shape of the room once the scores settle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={backGroupId ? `/play?group=${encodeURIComponent(backGroupId)}` : "/play"} className={primaryButtonLgClass}>
              Back to Play
            </Link>
            <Link href="/account" className={secondaryButtonLgClass}>
              Manage Account
            </Link>
          </div>
        </header>

        {groups.length > 1 ? (
          <nav aria-label="Choose results group" className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <Link
                key={group.groupId}
                href={`/results?group=${encodeURIComponent(group.groupId)}`}
                aria-current={backGroupId === group.groupId ? "page" : undefined}
                className={backGroupId === group.groupId ? primaryButtonLgClass : secondaryButtonLgClass}
              >
                {group.groupName}
              </Link>
            ))}
          </nav>
        ) : null}

        <ResultsView data={data} />
      </section>
    </PageShell>
  );
}
