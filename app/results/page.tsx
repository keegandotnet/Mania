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
        group: null,
        game: null,
        roster: [],
        rounds: [],
      };

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
        <Link
          href="/play"
          className="text-sm font-medium text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
        >
          Back to Play
        </Link>
      </div>
      <ResultsView data={data} />
    </main>
  );
}
