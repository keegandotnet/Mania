import { redirect } from "next/navigation";
import { PageShell } from "@/app/components/ui";
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
    <PageShell>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <span className="inline-flex rounded-full border-2 border-foreground/15 bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-peach-fg landing-sticker-sm">
            Live club room
          </span>
          <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-6xl">
            Play the round.
          </h1>
          <p className="mt-4 max-w-prose text-base leading-7 text-foreground-secondary sm:text-lg sm:leading-8">
            This is the working room for your group: check whose turn it is,
            submit picks, leave reviews, and keep the round moving without
            losing the club feeling.
          </p>
        </header>

        <PlayShell initialState={initialState} />
      </section>
    </PageShell>
  );
}
