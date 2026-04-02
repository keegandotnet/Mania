import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/15">
      <Link href="/" className="text-lg font-semibold tracking-tight text-foreground hover:opacity-80">
        Mania
      </Link>
      <nav className="flex items-center gap-6 text-sm font-medium">
        {user ? (
          <>
            <Link href="/play" className="text-foreground hover:opacity-80">
              Play
            </Link>
            <Link href="/results" className="text-foreground hover:opacity-80">
              Results
            </Link>
            <Link href="/account" className="text-foreground hover:opacity-80">
              Account
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="text-foreground hover:opacity-80">
              Sign in
            </Link>
            <Link href="/signup" className="text-foreground hover:opacity-80">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
