import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { hasSupabasePublicEnv } from "@/lib/supabaseEnv";

export async function SiteHeader() {
  let user = null;

  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 text-foreground transition-opacity hover:opacity-85"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[1.35rem] border border-border bg-[linear-gradient(135deg,var(--accent-pink),var(--accent-yellow),var(--accent-lime))] text-sm font-semibold text-foreground shadow-sm">
            M
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold tracking-tight">Mania</span>
            <span className="block text-[11px] uppercase tracking-[0.22em] text-foreground-secondary">
              Book club for albums
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-border bg-surface/90 p-1 text-sm font-medium shadow-sm sm:gap-2">
          {user ? (
            <>
              <Link
                href="/play"
                className="rounded-full px-3 py-2 text-foreground transition-colors hover:bg-surface-raised"
              >
                Play
              </Link>
              <Link
                href="/results"
                className="rounded-full px-3 py-2 text-foreground transition-colors hover:bg-surface-raised"
              >
                Results
              </Link>
              <Link
                href="/account"
                className="rounded-full border border-border bg-surface px-3 py-2 text-foreground transition-colors hover:bg-surface-raised"
              >
                Account
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-foreground transition-colors hover:bg-surface-raised"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent-orange px-4 py-2 text-white transition-colors hover:bg-accent-orange-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
