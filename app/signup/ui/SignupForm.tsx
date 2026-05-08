"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass, primaryButtonLgClass } from "@/app/components/ui";
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
        setError(
          mapSupabaseAuthErrorMessage(
            signError.message,
            "Could not create your account."
          )
        );
        setLoading(false);
        return;
      }
      setInfo(
        "Check your email to confirm your account, or sign in if confirmation is disabled."
      );
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
      <label className="flex flex-col gap-2 text-sm font-bold">
        <span className="text-foreground">Display name (optional)</span>
        <input
          name="displayName"
          type="text"
          autoComplete="nickname"
          maxLength={80}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="How others see you in-game"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-bold">
        <span className="text-foreground">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-bold">
        <span className="text-foreground">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>

      <div className="rounded-2xl border-2 border-foreground bg-accent-lime/30 p-4 landing-sticker-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-lime-fg">
          What happens next
        </p>
        <p className="mt-2 text-sm leading-7 text-foreground/85">
          Your account is created first, then email confirmation can hand you
          off to the account page.
        </p>
      </div>

      <div className="min-h-6">
        {error ? (
          <p
            role="alert"
            className="text-sm font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
        {info ? (
          <p role="status" className="text-sm font-medium text-foreground-secondary">
            {info}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`${primaryButtonLgClass} mt-1 w-full sm:w-auto`}
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
}
