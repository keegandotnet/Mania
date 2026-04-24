"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mapSupabaseAuthErrorMessage } from "@/lib/mania/mapAuthError";
import { mapClientErrorMessage } from "@/lib/mania/mapClientError";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const origin = window.location.origin;
      const metaName = displayName.trim();
      const { error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/account`,
          data: metaName ? { display_name: metaName } : undefined,
        },
      });
      if (signError) {
        setError(mapSupabaseAuthErrorMessage(signError.message, "Could not create your account."));
        setLoading(false);
        return;
      }
      setInfo("Check your email to confirm your account, or sign in if confirmation is disabled.");
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error("Signup failed", err);
      setError(mapClientErrorMessage(err, "Something went wrong."));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Display name (optional)</span>
        <input
          name="displayName"
          type="text"
          autoComplete="nickname"
          maxLength={80}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="How others see you in-game"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-secondary focus:border-border-strong disabled:opacity-50"
        />
      </label>

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
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-secondary focus:border-border-strong disabled:opacity-50"
        />
      </label>

      <div className="rounded-[24px] border border-accent-lime/35 bg-accent-lime/12 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
          What happens next
        </p>
        <p className="mt-2 text-sm leading-7 text-foreground-secondary">
          Your account is created first, then email confirmation can hand you off to the account page.
        </p>
      </div>

      <div className="min-h-6">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="text-sm text-foreground-secondary" role="status">
            {info}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover disabled:opacity-40"
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
}
