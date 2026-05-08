import Link from "next/link";
import { LandingScreenshotCarousel } from "@/app/components/LandingScreenshotCarousel";
import {
  PageShell,
  primaryButtonLgClass,
  secondaryButtonLgClass,
} from "@/app/components/ui";
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

  const stats = [
    { value: "1", label: "album / round" },
    { value: "6", label: "players max" },
    { value: "1–10", label: "score range" },
  ];

  const steps = [
    {
      step: "01",
      title: "Drop the pick",
      body: "One player chooses the album. Everyone gets the same record, the same deadline, and a reason to actually press play.",
      cardClass: "bg-accent-pink/35",
      tilt: "landing-tilt-left",
    },
    {
      step: "02",
      title: "Write the take",
      body: "Score it 1–10 and leave receipts. Reviews stay private until the reveal turns hot takes into group lore.",
      cardClass: "bg-accent-yellow/40",
      tilt: "landing-tilt-right",
    },
    {
      step: "03",
      title: "Reveal the room",
      body: "Mania averages the scores, saves every review, and gives your league a scoreboard worth defending.",
      cardClass: "bg-accent-lime/35",
      tilt: "landing-tilt-left",
    },
  ];

  const loops = [
    {
      title: "Focused rounds",
      body: "One album owns the spotlight until the last review lands. No infinite feed.",
    },
    {
      title: "Async pressure",
      body: "Listen on your own schedule, but the reveal still gives the room a pulse.",
    },
    {
      title: "Private leagues",
      body: "Invite the friends whose taste you trust, fear, or want to challenge.",
    },
  ];

  return (
    <PageShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-16 px-4 py-12 sm:px-6 sm:py-20 lg:gap-24 lg:py-24">
        <header className="flex w-full max-w-3xl flex-col items-center text-center">
          <span className="rounded-full border-2 border-foreground/15 bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-pink-fg landing-sticker-sm">
            Private album leagues
          </span>
          <h1 className="mt-7 text-balance text-[3.25rem] font-black leading-[0.95] tracking-[-0.045em] sm:text-7xl lg:text-[7rem]">
            Rate records.
            <br />
            Reveal <span className="landing-marker">chaos</span>.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-foreground-secondary sm:text-lg sm:leading-8">
            Mania turns your group chat&apos;s album arguments into a weekly
            game: one pick, secret scores, written takes, and a reveal everyone
            can feel.
          </p>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href={primaryHref}
              className={`${primaryButtonLgClass} w-full sm:w-auto`}
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className={`${secondaryButtonLgClass} w-full sm:w-auto`}
            >
              {secondaryLabel}
            </Link>
          </div>
          <dl className="mt-10 grid w-full max-w-lg grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border-2 border-foreground/10 bg-surface/90 p-3 text-center landing-sticker-sm"
              >
                <dt className="text-2xl font-black tracking-tight sm:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-secondary">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="landing-tilt w-full max-w-md">
          <div className="rounded-[2.5rem] border-2 border-foreground bg-[linear-gradient(135deg,var(--accent-pink),var(--accent-yellow),var(--accent-lime))] p-1 landing-sticker">
            <div className="rounded-[2.1rem] bg-surface p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-secondary">
                    Round 04
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                    The reveal is live
                  </h2>
                </div>
                <span className="rounded-full border-2 border-foreground bg-accent-yellow px-3 py-1 text-xs font-bold text-accent-yellow-fg">
                  8.7 avg
                </span>
              </div>
              <ul className="mt-6 space-y-3">
                {[
                  ["Nina", "9.4", "This is the pick to beat."],
                  ["Theo", "8.8", "Huge hooks, weirder than expected."],
                  ["Avery", "8.1", "The second half won me over."],
                ].map(([name, score, note]) => (
                  <li
                    key={name}
                    className="rounded-2xl border-2 border-foreground/10 bg-surface-raised/75 p-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">{name}</p>
                      <p className="rounded-full border-2 border-foreground bg-accent-yellow/85 px-3 py-1 text-sm font-black text-accent-yellow-fg">
                        {score}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                      &quot;{note}&quot;
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-2xl border-2 border-accent-orange/40 bg-accent-orange/15 p-4 text-left text-sm font-bold text-accent-orange-fg">
                Next up: Theo chooses. The table is getting loud.
              </p>
            </div>
          </div>
        </div>

        <section className="w-full" aria-labelledby="how-it-works-heading">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-secondary">
              How a round flows
            </p>
            <h2
              id="how-it-works-heading"
              className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-5xl"
            >
              From fresh pick to full-room verdict in three turns.
            </h2>
          </div>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {steps.map((step) => (
              <li
                key={step.step}
                className={`${step.tilt} rounded-[2rem] border-2 border-foreground ${step.cardClass} p-6 landing-sticker sm:p-7`}
              >
                <p className="font-mono text-sm font-bold text-foreground/80">
                  Step {step.step}
                </p>
                <h3 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-foreground/85 sm:text-base">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <LandingScreenshotCarousel />

        <section className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.5rem] border-2 border-foreground bg-foreground p-7 text-background landing-sticker sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-background/70">
              Built for repeat plays
            </p>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">
              The album club that{" "}
              <span className="text-accent-yellow">keeps score</span>.
            </h2>
            <p className="mt-4 max-w-prose text-sm leading-7 text-background/80 sm:text-base">
              Use Mania for a friend group, a tiny music league, or the chat
              that already sends too many albums. The product stays private and
              structured while the takes stay personal.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {loops.map((loop, index) => (
              <article
                key={loop.title}
                className={`rounded-[2rem] border-2 border-foreground bg-surface p-6 landing-sticker ${
                  index === 1 ? "landing-tilt-right" : "landing-tilt-left"
                }`}
              >
                <h3 className="text-xl font-black tracking-tight">
                  {loop.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-foreground-secondary">
                  {loop.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full overflow-hidden rounded-[2.75rem] border-2 border-foreground bg-[linear-gradient(135deg,var(--accent-pink),var(--accent-yellow),var(--accent-lime))] p-1 landing-sticker">
          <div className="rounded-[2.4rem] bg-surface px-6 py-10 text-center sm:px-12 sm:py-14">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-secondary">
              Ready for the next round?
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-balance text-4xl font-black tracking-tight sm:text-6xl">
              Start a league before the aux cord cools off.
            </h2>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className={`${primaryButtonLgClass} w-full sm:w-auto`}
              >
                {primaryLabel}
              </Link>
              <Link
                href="/results"
                className={`${secondaryButtonLgClass} w-full sm:w-auto`}
              >
                See Results Flow
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
