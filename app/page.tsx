import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { hasSupabasePublicEnv } from "@/lib/supabaseEnv";

export default async function Home() {
  let user = null;

  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  }

  const primaryHref = user ? "/play" : "/signup";
  const primaryLabel = user ? "Jump Back In" : "Start Your League";
  const secondaryHref = user ? "/account" : "/login";
  const secondaryLabel = user ? "Manage Account" : "Sign In";

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.2),transparent_36%),radial-gradient(circle_at_85%_10%,rgba(250,204,21,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_36%),radial-gradient(circle_at_85%_10%,rgba(253,224,71,0.16),transparent_28%),linear-gradient(180deg,rgba(20,20,18,0.6),rgba(20,20,18,0))]" />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-orange/20 bg-accent-orange/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-orange-fg">
              Private Album Rating Game
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              Album night, rebuilt as a competitive ritual.
            </h1>
            <p className="mt-6 max-w-prose text-base leading-7 text-foreground-secondary sm:text-lg">
              Mania is a private, turn-based game for groups who want more than a
              shared playlist. Pick an album, write the review, reveal the scores,
              and let the leaderboard settle the argument.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-orange-hover"
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-raised"
              >
                {secondaryLabel}
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface/90 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Async Rounds
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  Your group can play on its own schedule. No one needs to be online at once.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface/90 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Reviews Matter
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  Every pick gets a score and a written take, not just a passive thumbs-up.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface/90 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                  Reveals & Results
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  Rounds resolve into rankings, reviews, and bragging rights.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 h-32 w-32 rounded-full bg-accent-yellow/20 blur-3xl" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-accent-orange/20 blur-3xl" />
            <div className="relative space-y-4">
              <div className="rounded-[28px] border border-accent-orange/40 bg-surface p-5 shadow-sm ring-1 ring-accent-orange/15">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-orange-fg">
                      Your Turn
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                      Round 03: Submit your album
                    </h2>
                  </div>
                  <span className="rounded-full bg-accent-orange px-3 py-1 text-xs font-medium text-white">
                    Live
                  </span>
                </div>
                <div className="mt-5 rounded-2xl border border-border bg-surface-raised p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                    Pick Window
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-tight">
                    Hounds of Love
                  </p>
                  <p className="text-sm text-foreground-secondary">Kate Bush</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="rounded-full bg-accent-yellow/70 px-2 py-1 text-xs font-medium text-accent-yellow-fg">
                      5 reviews pending
                    </span>
                    <span className="rounded-full bg-surface px-2 py-1 text-xs font-medium text-foreground-secondary">
                      Reveal after last score
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                      League Table
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                      Current Leaders
                    </h2>
                  </div>
                  <span className="rounded-full bg-accent-green/15 px-3 py-1 text-xs font-medium text-accent-green-fg">
                    Round revealed
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { place: "01", name: "Nina", score: "8.9", tone: "bg-accent-yellow/70 text-accent-yellow-fg" },
                    { place: "02", name: "Theo", score: "8.6", tone: "bg-accent-green/15 text-accent-green-fg" },
                    { place: "03", name: "Avery", score: "8.2", tone: "bg-surface-raised text-foreground" },
                  ].map((entry) => (
                    <div
                      key={entry.place}
                      className="flex items-center justify-between rounded-2xl border border-border bg-surface-raised px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-foreground-secondary">
                          {entry.place}
                        </span>
                        <span className="text-sm font-medium text-foreground">{entry.name}</span>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${entry.tone}`}>
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps from first pick to final standings.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create a private group",
                body: "Spin up a room, invite up to six players, and lock in the people whose opinions should count.",
              },
              {
                step: "02",
                title: "Take turns picking albums",
                body: "Each round belongs to one picker. Everyone else scores the album and leaves a real written review.",
              },
              {
                step: "03",
                title: "Reveal the round",
                body: "Once the reviews are in, Mania exposes the averages, the commentary, and the current pecking order.",
              },
            ].map((item) => (
              <article
                key={item.step}
                className="rounded-[28px] border border-border bg-surface p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-raised font-mono text-sm text-foreground-secondary">
                  {item.step}
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
                Built for the reveal
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                More scorecard than playlist.
              </h2>
              <p className="mt-4 max-w-prose text-sm leading-7 text-foreground-secondary">
                Mania is for groups that want album discussion to feel structured,
                social, and a little ruthless. The point is not background listening.
                The point is seeing what survives the scoreboard.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover"
              >
                {primaryLabel}
              </Link>
              <Link
                href="/results"
                className="rounded-md border border-border bg-surface-raised px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                View Results Flow
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
