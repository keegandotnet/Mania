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
    <header className="sticky top-0 z-20 border-b-2 border-foreground/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 text-foreground transition-opacity hover:opacity-90"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-foreground bg-[linear-gradient(135deg,var(--accent-pink),var(--accent-yellow),var(--accent-lime))] text-base font-black text-foreground landing-sticker-sm">
            M
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black tracking-tight">Mania</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
              Album leagues
            </span>
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="flex items-center gap-1 rounded-2xl border-2 border-foreground/15 bg-surface/95 p-1 text-sm font-bold landing-sticker-sm sm:gap-1.5"
        >
          {user ? (
            <>
              <Link
                href="/play"
                className="rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-surface-raised"
              >
                Play
              </Link>
              <Link
                href="/results"
                className="rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-surface-raised"
              >
                Results
              </Link>
              <Link
                href="/account"
                className="rounded-xl border-2 border-foreground bg-foreground px-3 py-2 text-background transition-opacity hover:opacity-90"
              >
                Account
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-surface-raised"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl border-2 border-foreground bg-accent-orange px-3 py-2 text-white transition-colors hover:bg-accent-orange-hover"
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
