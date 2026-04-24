import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameResults, type GameResultsData } from "@/app/actions/mania";
import { ResultsView } from "./ResultsView";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/results");
  }

  const result = await getGameResults();
  const data: GameResultsData = result.ok
    ? result.data
    : {
        viewerId: user.id,
        email: user.email ?? user.id,
        viewerDisplayName: null,
        group: null,
        game: null,
        roster: [],
        rounds: [],
      };

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent-yellow/25 blur-3xl" />
        <div className="absolute right-[-4rem] top-24 h-72 w-72 rounded-full bg-accent-pink/28 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/3 h-80 w-80 rounded-full bg-accent-lime/24 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-gradient-to-b from-surface/75 via-background/45 to-transparent" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-yellow/45 bg-accent-yellow/16 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-yellow-fg">
              Scoreboard
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Round reveals and the running table.
            </h1>
            <p className="mt-4 max-w-prose text-sm leading-7 text-foreground-secondary sm:text-base">
              Results is the memory of the club: every revealed pick, every written
              take, and the shape of the room once the scores settle.
            </p>
          </div>

          <Link
            href="/play"
            className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-raised"
          >
            Back to Play
          </Link>
        </div>

        <ResultsView data={data} />
      </section>
    </main>
  );
}
