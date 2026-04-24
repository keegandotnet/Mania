import Link from "next/link";
import { sanitizeNextPath } from "@/lib/mania/url";
import { LoginForm } from "./ui/LoginForm";

type Props = {
  searchParams?: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage(props: Props) {
  const searchParams = (await props.searchParams) ?? {};
  const nextPath = sanitizeNextPath(searchParams.next, "/account");

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent-pink/28 blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-72 w-72 rounded-full bg-accent-yellow/24 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/3 h-80 w-80 rounded-full bg-accent-lime/24 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-gradient-to-b from-surface/75 via-background/45 to-transparent" />
      </div>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:items-start">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-pink/35 bg-accent-pink/12 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-pink-fg">
            Welcome back
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Sign in and get back to the room.
          </h1>
          <p className="mt-4 max-w-prose text-sm leading-7 text-foreground-secondary sm:text-base">
            Pick up where you left off: live rounds, reveal history, and the account
            settings that shape how the group sees you.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <article className="rounded-[26px] border border-accent-yellow/45 bg-accent-yellow/16 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-yellow-fg">
                Keep momentum
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">
                Jump back into the current round without hunting through messages.
              </p>
            </article>
            <article className="rounded-[26px] border border-accent-lime/35 bg-accent-lime/12 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
                Same identity
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">
                Your display name, groups, and results stay tied to this account.
              </p>
            </article>
            <article className="rounded-[26px] border border-accent-peach/40 bg-accent-peach/12 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-peach-fg">
                Built for return visits
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">
                Sessions are lightweight so the app feels more like a club than a dashboard.
              </p>
            </article>
          </div>
        </div>

        <section className="rounded-[34px] border border-border bg-surface p-6 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
              Sign in
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Use your email and password.</h2>
          </div>

          {searchParams.error === "auth" ? (
            <p className="mt-4 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-950/50 dark:bg-red-950/20 dark:text-red-400" role="alert">
              Authentication failed. Try again.
            </p>
          ) : null}

          <div className="mt-6">
            <LoginForm nextPath={nextPath} />
          </div>

          <p className="mt-6 text-center text-sm text-foreground-secondary">
            No account?{" "}
            <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}
