import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getMyGameState, type MyGameState } from "@/app/actions/mania";
import { PlayShell } from "./PlayShell";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/play");
  }

  const result = await getMyGameState();
  const initialState: MyGameState = result.ok
    ? result.data
    : {
        viewerId: user.id,
        email: user.email ?? user.id,
        viewerDisplayName: null,
        group: null,
        game: null,
        round: null,
        hasReviewed: false,
        revealedDetail: null,
        groupRoster: null,
      };

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent-pink/30 blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-72 w-72 rounded-full bg-accent-yellow/24 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/3 h-80 w-80 rounded-full bg-accent-lime/24 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-gradient-to-b from-surface/70 via-background/40 to-transparent" />
      </div>

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-peach/40 bg-accent-peach/14 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-peach-fg">
            Live club room
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Play the round.
          </h1>
          <p className="mt-4 max-w-prose text-sm leading-7 text-foreground-secondary sm:text-base">
            This is the working room for your group: check whose turn it is,
            submit picks, leave reviews, and keep the round moving without losing
            the club feeling.
          </p>
        </div>

        <PlayShell initialState={initialState} />
      </section>
    </main>
  );
}
