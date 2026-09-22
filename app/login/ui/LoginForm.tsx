"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass, primaryButtonLgClass } from "@/app/components/ui";
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
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) {
        setError(
          mapSupabaseAuthErrorMessage(signError.message, "Could not sign you in.")
        );
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>

      <div className="rounded-2xl border-2 border-foreground bg-accent-yellow/30 p-4 landing-sticker-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-yellow-fg">
          After sign-in
        </p>
        <p className="mt-2 text-sm leading-7 text-foreground/85">
          You&apos;ll be routed back to your account or the page that sent you here.
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
        {info ? <p role="status" className="text-sm font-medium text-foreground-secondary">{info}</p> : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`${primaryButtonLgClass} mt-1 w-full sm:w-auto`}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <div className="flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          className="font-bold underline-offset-4 hover:underline"
          disabled={loading}
          onClick={async () => {
            setError(null);
            setInfo(null);
            if (!email.trim()) {
              setError("Enter your email first.");
              return;
            }
            const supabase = createBrowserSupabaseClient();
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
              redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });
            if (resetError) setError(mapSupabaseAuthErrorMessage(resetError.message, "Could not send reset email."));
            else setInfo("Password reset email sent. Check your inbox.");
          }}
        >
          Forgot password?
        </button>
        <button
          type="button"
          className="font-bold underline-offset-4 hover:underline"
          disabled={loading}
          onClick={async () => {
            setError(null);
            setInfo(null);
            if (!email.trim()) {
              setError("Enter your email first.");
              return;
            }
            const supabase = createBrowserSupabaseClient();
            const { error: resendError } = await supabase.auth.resend({
              type: "signup",
              email: email.trim(),
              options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` },
            });
            if (resendError) setError(mapSupabaseAuthErrorMessage(resendError.message, "Could not resend confirmation."));
            else setInfo("Confirmation email sent. Check your inbox.");
          }}
        >
          Resend confirmation
        </button>
      </div>
    </form>
  );
}
