import Link from "next/link";
import { SignupForm } from "./ui/SignupForm";

export default function SignupPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent-lime/24 blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-72 w-72 rounded-full bg-accent-pink/28 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/3 h-80 w-80 rounded-full bg-accent-peach/22 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-gradient-to-b from-surface/75 via-background/45 to-transparent" />
      </div>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:items-start">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-lime/35 bg-accent-lime/12 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-lime-fg">
            Start the club
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Create your account and join the argument.
          </h1>
          <p className="mt-4 max-w-prose text-sm leading-7 text-foreground-secondary sm:text-base">
            Sign up once, set your display name, and you are ready for private groups,
            rotating album picks, and the reveal history that comes with them.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <article className="rounded-[26px] border border-accent-peach/40 bg-accent-peach/12 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-peach-fg">
                Pick a name
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">
                Your display name is what the room sees when scores and notes go public.
              </p>
            </article>
            <article className="rounded-[26px] border border-accent-yellow/45 bg-accent-yellow/16 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-yellow-fg">
                Confirm by email
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">
                The flow supports email confirmation when it is enabled in Supabase.
              </p>
            </article>
            <article className="rounded-[26px] border border-accent-pink/35 bg-accent-pink/12 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-pink-fg">
                Land in account
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">
                After confirmation, you are routed into the app and can join your first group.
              </p>
            </article>
          </div>
        </div>

        <section className="rounded-[34px] border border-border bg-surface p-6 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
              Sign up
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Create an account with email and password.
            </h2>
          </div>

          <div className="mt-6">
            <SignupForm />
          </div>

          <p className="mt-6 text-center text-sm text-foreground-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}
