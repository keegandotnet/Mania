import Link from "next/link";
import { PageShell, sectionCardClass } from "@/app/components/ui";
import { sanitizeNextPath } from "@/lib/mania/url";
import { LoginForm } from "./ui/LoginForm";

type Props = {
  searchParams?: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage(props: Props) {
  const searchParams = (await props.searchParams) ?? {};
  const nextPath = sanitizeNextPath(searchParams.next, "/account");

  const benefits = [
    {
      eyebrow: "Keep momentum",
      eyebrowClass: "text-accent-yellow-fg",
      cardClass: "bg-accent-yellow/30 landing-tilt-left",
      body: "Jump straight back into the current round without hunting through messages.",
    },
    {
      eyebrow: "Same identity",
      eyebrowClass: "text-accent-lime-fg",
      cardClass: "bg-accent-lime/30 landing-tilt-right",
      body: "Your display name, groups, and results stay tied to this account.",
    },
    {
      eyebrow: "Built for return visits",
      eyebrowClass: "text-accent-peach-fg",
      cardClass: "bg-accent-peach/35 landing-tilt-left",
      body: "Sessions are lightweight so the app feels more like a club than a dashboard.",
    },
  ];

  return (
    <PageShell>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] lg:items-start">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border-2 border-foreground/15 bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-pink-fg landing-sticker-sm">
            Welcome back
          </span>
          <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-6xl">
            Sign in. Get back to the room.
          </h1>
          <p className="mt-4 max-w-prose text-base leading-7 text-foreground-secondary sm:text-lg sm:leading-8">
            Pick up where you left off &mdash; live rounds, reveal history, and
            the account settings that shape how the group sees you.
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
            Sign in
          </p>
          <h2 className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-4xl">
            Use your email and password.
          </h2>

          {searchParams.error === "auth" ? (
            <p
              role="alert"
              className="mt-5 rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              Authentication failed. Try again.
            </p>
          ) : null}

          <div className="mt-6">
            <LoginForm nextPath={nextPath} />
          </div>

          <p className="mt-6 text-center text-sm text-foreground-secondary">
            No account?{" "}
            <Link
              href="/signup"
              className="font-bold text-foreground underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </section>
      </section>
    </PageShell>
  );
}
