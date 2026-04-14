"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        setError(signError.message);
        setLoading(false);
        return;
      }
      setInfo("Check your email to confirm your account, or sign in if confirmation is disabled.");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Display name (optional)</span>
        <input
          name="displayName"
          type="text"
          autoComplete="nickname"
          maxLength={80}
          value={displayName}
          onChange={(ev) => setDisplayName(ev.target.value)}
          placeholder="How others see you in-game"
          className="rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none ring-0 focus:border-foreground/40 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none ring-0 focus:border-foreground/40 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none ring-0 focus:border-foreground/40 dark:border-white/20"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-foreground/80" role="status">
          {info}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
