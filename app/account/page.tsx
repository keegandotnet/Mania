import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-foreground/70">
          You are signed in. Supabase session cookies were validated on this request.
        </p>
      </div>
      <dl className="space-y-3 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
        <div>
          <dt className="text-foreground/60">User id</dt>
          <dd className="mt-1 font-mono text-xs break-all">{user.id}</dd>
        </div>
        {user.email ? (
          <div>
            <dt className="text-foreground/60">Email</dt>
            <dd className="mt-1">{user.email}</dd>
          </div>
        ) : null}
      </dl>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/"
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Home
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
