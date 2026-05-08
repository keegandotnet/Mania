"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inputClass, primaryButtonClass } from "@/app/components/ui";
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
      className="rounded-[2rem] border-2 border-foreground bg-accent-lime/30 p-6 landing-sticker sm:p-7"
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
          setOk(
            result.data.displayName == null
              ? "Display name cleared."
              : "Display name saved."
          );
          router.refresh();
        });
      }}
    >
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-lime-fg">
          Display identity
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          How the room sees you
        </h2>
        <p className="mt-3 text-sm leading-7 text-foreground/85">
          This name shows up on Play and Results. Leave it blank if you want to
          fall back to your email.
        </p>
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm font-bold">
        <span className="text-foreground">Display name</span>
        <input
          name="displayName"
          type="text"
          maxLength={80}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. DJ Nova"
          className={inputClass}
        />
      </label>

      <div className="mt-4 min-h-6">
        {error ? (
          <p
            role="alert"
            className="text-sm font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
        {ok ? (
          <p role="status" className="text-sm font-medium text-foreground-secondary">
            {ok}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Saving..." : "Save display name"}
      </button>
    </form>
  );
}
