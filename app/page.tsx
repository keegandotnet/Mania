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

  const signals = [
    {
      title: "One album, one conversation",
      body: "Everyone spends the week with the same record, so the discussion actually builds.",
      className: "border-accent-pink/35 bg-accent-pink/14",
      eyebrowClassName: "text-accent-pink-fg",
    },
    {
      title: "Notes first, scores second",
      body: "Written reactions keep it thoughtful before the averages flatten everything.",
      className: "border-accent-yellow/45 bg-accent-yellow/18",
      eyebrowClassName: "text-accent-yellow-fg",
    },
    {
      title: "A table worth checking",
      body: "Each reveal shifts the standings and gives the group a reason to come back.",
      className: "border-accent-lime/35 bg-accent-lime/14",
      eyebrowClassName: "text-accent-lime-fg",
    },
  ];

  const standings = [
    { place: "01", name: "Nina", score: "9.2" },
    { place: "02", name: "Theo", score: "8.8" },
    { place: "03", name: "Avery", score: "8.4" },
  ];

  const steps = [
    {
      step: "01",
      title: "Pick the next album",
      body: "One member chooses the record. Everyone else gets the same prompt and the same window to live with it.",
      className: "border-accent-peach/40 bg-accent-peach/14",
      badgeClassName: "bg-accent-peach/70 text-accent-peach-fg",
    },
    {
      step: "02",
      title: "Write in the margins",
      body: "Players score the album, but the real fun is the note-taking, hot takes, and specific receipts.",
      className: "border-accent-pink/35 bg-accent-pink/14",
      badgeClassName: "bg-accent-pink/55 text-accent-pink-fg",
    },
    {
      step: "03",
      title: "Reveal the room",
      body: "When the last review lands, Mania opens the round, shows the averages, and updates the club table.",
      className: "border-accent-lime/35 bg-accent-lime/14",
      badgeClassName: "bg-accent-lime/60 text-accent-lime-fg",
    },
  ];

  const features = [
    {
      title: "Private by default",
      body: "Invite only the people whose opinions you actually want in the room.",
      className: "border-accent-yellow/45 bg-accent-yellow/18",
      eyebrowClassName: "text-accent-yellow-fg",
    },
    {
      title: "Async works better",
      body: "No one has to be online at once. The round stays clean even when schedules do not.",
      className: "border-accent-lime/35 bg-accent-lime/14",
      eyebrowClassName: "text-accent-lime-fg",
    },
    {
      title: "Reviews have memory",
      body: "Every album keeps its scores and commentary, so the club builds a real archive.",
      className: "border-accent-pink/35 bg-accent-pink/14",
      eyebrowClassName: "text-accent-pink-fg",
    },
    {
      title: "Competitive enough",
      body: "The scoreboard gives the room stakes without turning the whole thing into homework.",
      className: "border-accent-peach/40 bg-accent-peach/14",
      eyebrowClassName: "text-accent-peach-fg",
    },
  ];

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-6 h-72 w-72 rounded-full bg-accent-pink/35 blur-3xl" />
        <div className="absolute right-[-4rem] top-24 h-72 w-72 rounded-full bg-accent-yellow/28 blur-3xl" />
        <div className="absolute left-1/3 top-[26rem] h-64 w-64 rounded-full bg-accent-lime/30 blur-3xl" />
        <div className="absolute bottom-[-5rem] right-12 h-72 w-72 rounded-full bg-accent-peach/30 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-gradient-to-b from-surface/80 via-background/50 to-transparent" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:gap-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-pink/35 bg-accent-pink/14 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-pink-fg">
              Private listening club
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              The book club for albums.
            </h1>
            <p className="mt-6 max-w-prose text-base leading-7 text-foreground-secondary sm:text-lg">
              Pick one record at a time. Everyone listens on their own schedule,
              writes a real take, drops a score, and waits for the reveal. Mania
              makes album talk feel structured, social, and just competitive enough.
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
              {signals.map((signal) => (
                <article
                  key={signal.title}
                  className={`rounded-[28px] border p-4 shadow-sm ${signal.className}`}
                >
                  <p
                    className={`text-xs font-medium uppercase tracking-[0.16em] ${signal.eyebrowClassName}`}
                  >
                    Why it works
                  </p>
                  <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                    {signal.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                    {signal.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="sm:col-span-2 rounded-[32px] border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                      This week&apos;s read
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Hounds of Love
                    </h2>
                    <p className="mt-1 text-sm text-foreground-secondary">
                      Kate Bush
                    </p>
                  </div>
                  <span className="rounded-full bg-accent-orange px-3 py-1 text-xs font-medium text-white">
                    Your turn
                  </span>
                </div>
                <div className="mt-5 rounded-[26px] border border-border bg-surface-raised p-5">
                  <div className="flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
                    <span>Discussion window</span>
                    <span>Closes Friday</span>
                  </div>
                  <p className="mt-4 max-w-prose text-sm leading-7 text-foreground-secondary">
                    Post the album, let everyone sit with it, then watch the room
                    sort itself out once the last score comes in.
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 text-sm text-foreground-secondary">
                  <span>5 readers checked in</span>
                  <span>Reveal after final score</span>
                </div>
              </article>

              <article className="rounded-[28px] border border-accent-pink/35 bg-accent-pink/14 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-pink-fg">
                  Margin notes
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-surface/70 bg-surface/80 p-3">
                    <p className="text-sm font-medium text-foreground">
                      &quot;Side A is all restraint. Side B kicks the door in.&quot;
                    </p>
                  </div>
                  <div className="rounded-2xl border border-surface/70 bg-surface/80 p-3">
                    <p className="text-sm font-medium text-foreground">
                      &quot;The hooks are huge, but the weirdness is the point.&quot;
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] border border-accent-lime/35 bg-accent-lime/14 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
                  Club notes
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-surface/70 bg-surface/85 p-3">
                    <p className="text-sm font-semibold text-foreground">6 players</p>
                    <p className="mt-1 text-sm text-foreground-secondary">
                      Tight enough for strong opinions, small enough to stay personal.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-surface/70 bg-surface/85 p-3">
                    <p className="text-sm font-semibold text-foreground">1 album each round</p>
                    <p className="mt-1 text-sm text-foreground-secondary">
                      Less feed, more focus.
                    </p>
                  </div>
                </div>
              </article>

              <article className="sm:col-span-2 rounded-[28px] border border-accent-yellow/45 bg-accent-yellow/18 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-yellow-fg">
                      Current table
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                      The room remembers everything
                    </h2>
                  </div>
                  <span className="rounded-full bg-surface/85 px-3 py-1 text-xs font-medium text-foreground-secondary">
                    Round revealed
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {standings.map((entry) => (
                    <div
                      key={entry.place}
                      className="flex items-center justify-between rounded-2xl border border-surface/70 bg-surface/85 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-foreground-secondary">
                          {entry.place}
                        </span>
                        <span className="text-sm font-medium text-foreground">{entry.name}</span>
                      </div>
                      <span className="rounded-full bg-accent-yellow/70 px-3 py-1 text-sm font-semibold text-accent-yellow-fg">
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
              How a round flows
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps from fresh pick to full-room verdict.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.step}
                className={`rounded-[30px] border p-6 shadow-sm ${step.className}`}
              >
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${step.badgeClassName}`}
                >
                  Step {step.step}
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-prose text-sm leading-7 text-foreground-secondary">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-[32px] border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
              Why Mania
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              More intentional than a playlist, less stiff than a review club.
            </h2>
            <p className="mt-4 max-w-prose text-sm leading-7 text-foreground-secondary">
              The best album conversations happen when a group shares context,
              has enough time to really listen, and knows a reveal is coming.
              Mania gives that process a shape without sanding off the personality.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className={`rounded-[28px] border p-5 shadow-sm ${feature.className}`}
              >
                <p
                  className={`text-xs font-medium uppercase tracking-[0.16em] ${feature.eyebrowClassName}`}
                >
                  Built for the group
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
