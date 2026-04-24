"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mapSupabaseAuthErrorMessage } from "@/lib/mania/mapAuthError";
import { mapClientErrorMessage } from "@/lib/mania/mapClientError";
import { sanitizeNextPath } from "@/lib/mania/url";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

type Props = {
  nextPath: string;
};

export function LoginForm({ nextPath }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
      if (signError) {
        setError(mapSupabaseAuthErrorMessage(signError.message, "Could not sign you in."));
        setLoading(false);
        return;
      }
      router.refresh();
      router.push(sanitizeNextPath(nextPath, "/account"));
    } catch (err) {
      console.error("Login failed", err);
      setError(mapClientErrorMessage(err, "Something went wrong."));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-secondary focus:border-border-strong disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-secondary focus:border-border-strong disabled:opacity-50"
        />
      </label>

      <div className="rounded-[24px] border border-accent-yellow/40 bg-accent-yellow/12 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-yellow-fg">
          After sign-in
        </p>
        <p className="mt-2 text-sm leading-7 text-foreground-secondary">
          You will be routed back to your account or the page that sent you here.
        </p>
      </div>

      <div className="min-h-6">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover disabled:opacity-40"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
