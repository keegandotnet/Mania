"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateProfileDisplayName } from "@/app/actions/mania";

type Props = { initialDisplayName: string | null };

export function DisplayNameForm({ initialDisplayName }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialDisplayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setOk(null);
        startTransition(async () => {
          const r = await updateProfileDisplayName(value);
          if (!r.ok) {
            setError(r.message);
            return;
          }
          setOk(r.data.displayName == null ? "Display name cleared." : "Saved.");
          router.refresh();
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Display name</span>
        <span className="text-xs text-foreground/55">
          Shown on Play and Results instead of email when set. Leave blank to fall back to email.
        </span>
        <input
          name="displayName"
          type="text"
          maxLength={80}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          placeholder="e.g. DJ Nova"
          className="mt-1 rounded-md border border-black/15 bg-background px-3 py-2 text-foreground outline-none ring-0 focus:border-foreground/40 dark:border-white/20"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-foreground/70" role="status">
          {ok}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save display name"}
      </button>
    </form>
  );
}
