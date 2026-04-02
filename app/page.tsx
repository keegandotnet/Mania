import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Mania</h1>
        <p className="mt-3 text-foreground/80">
          Sign in to use game features. Auth uses Supabase email and password.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <Link
          href="/login"
          className="rounded-md bg-foreground px-4 py-2 text-background hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-black/15 px-4 py-2 dark:border-white/20"
        >
          Sign up
        </Link>
        <Link
          href="/play"
          className="rounded-md border border-black/15 px-4 py-2 dark:border-white/20"
        >
          Play (protected)
        </Link>
        <Link
          href="/account"
          className="rounded-md border border-black/15 px-4 py-2 dark:border-white/20"
        >
          Account (protected)
        </Link>
      </div>
    </main>
  );
}
