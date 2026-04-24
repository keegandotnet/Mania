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
      className="rounded-[30px] border border-accent-lime/35 bg-accent-lime/12 p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setOk(null);
        startTransition(async () => {
          const result = await updateProfileDisplayName(value);
          if (!result.ok) {
            setError(result.message);
            return;
          }
          setOk(result.data.displayName == null ? "Display name cleared." : "Display name saved.");
          router.refresh();
        });
      }}
    >
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-lime-fg">
          Display identity
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">How the room sees you</h2>
        <p className="mt-3 text-sm leading-7 text-foreground-secondary">
          This name shows up on Play and Results. Leave it blank if you want to fall back to your email.
        </p>
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Display name</span>
        <input
          name="displayName"
          type="text"
          maxLength={80}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. DJ Nova"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-secondary focus:border-border-strong disabled:opacity-50"
        />
      </label>

      <div className="mt-4 min-h-6">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="text-sm text-foreground-secondary" role="status">
            {ok}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover disabled:opacity-40"
      >
        {pending ? "Saving..." : "Save display name"}
      </button>
    </form>
  );
}
