"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, primaryButtonClass } from "@/app/components/ui";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setFeedback(null);
        const { error } = await createBrowserSupabaseClient().auth.updateUser({ password });
        setPending(false);
        if (error) {
          setFeedback(error.message);
          return;
        }
        router.push("/account");
        router.refresh();
      }}
    >
      <label className="flex flex-col gap-2 text-sm font-bold">
        <span>New password</span>
        <input className={inputClass} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {feedback ? <p role="alert" className="text-sm text-red-600">{feedback}</p> : null}
      <button type="submit" disabled={pending} className={primaryButtonClass}>{pending ? "Saving..." : "Save password"}</button>
    </form>
  );
}
