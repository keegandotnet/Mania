import Link from "next/link";
import { PageShell, sectionCardClass } from "@/app/components/ui";
import { SignupForm } from "./ui/SignupForm";

export default function SignupPage() {
  const benefits = [
    {
      eyebrow: "Pick a name",
      eyebrowClass: "text-accent-peach-fg",
      cardClass: "bg-accent-peach/35 landing-tilt-left",
      body: "Your display name is what the room sees when scores and notes go public.",
    },
    {
      eyebrow: "Confirm by email",
      eyebrowClass: "text-accent-yellow-fg",
      cardClass: "bg-accent-yellow/35 landing-tilt-right",
      body: "The flow supports email confirmation when it\u2019s enabled in Supabase.",
    },
    {
      eyebrow: "Land in account",
      eyebrowClass: "text-accent-pink-fg",
      cardClass: "bg-accent-pink/30 landing-tilt-left",
      body: "After confirmation you\u2019re routed into the app and can join your first group.",
    },
  ];

  return (
    <PageShell>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] lg:items-start">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border-2 border-foreground/15 bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-lime-fg landing-sticker-sm">
            Start the club
          </span>
          <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-6xl">
            Make an account. Join the argument.
          </h1>
          <p className="mt-4 max-w-prose text-base leading-7 text-foreground-secondary sm:text-lg sm:leading-8">
            Sign up once, set your display name, and you&apos;re ready for
            private groups, rotating album picks, and the reveal history that
            comes with them.
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <li
                key={benefit.eyebrow}
                className={`rounded-[1.75rem] border-2 border-foreground p-5 landing-sticker ${benefit.cardClass}`}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.22em] ${benefit.eyebrowClass}`}
                >
                  {benefit.eyebrow}
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground/85">
                  {benefit.body}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <section className={sectionCardClass}>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
            Sign up
          </p>
          <h2 className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-4xl">
            Create an account with email and password.
          </h2>

          <div className="mt-6">
            <SignupForm />
          </div>

          <p className="mt-6 text-center text-sm text-foreground-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </section>
      </section>
    </PageShell>
  );
}
