"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  destructiveButtonClass,
  secondaryButtonClass,
} from "@/app/components/ui";
import { leaveGroup } from "@/app/actions/mania";

type Props = { groupId: string; groupName: string; memberCount: number };

const triggerClass =
  "inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border-2 border-red-300 bg-surface px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30";

export function LeaveGroupButton({ groupId, groupName, memberCount }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isLastMember = memberCount <= 1;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={triggerClass}
      >
        Leave group
      </button>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
      <p className="text-sm leading-7 text-foreground/85">
        {isLastMember ? (
          <>
            You are the only member of{" "}
            <span className="font-bold text-foreground">{groupName}</span>. The
            group will be empty after you leave, but your game history stays
            intact.
          </>
        ) : (
          <>
            Leave <span className="font-bold text-foreground">{groupName}</span>?
            Your game history stays intact.
          </>
        )}
      </p>

      {error ? (
        <p
          role="alert"
          className="text-sm font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await leaveGroup(groupId);
              if (!result.ok) {
                setError(result.message);
                setConfirming(false);
                return;
              }
              router.refresh();
            });
          }}
          className={destructiveButtonClass}
        >
          {pending ? "Leaving..." : "Confirm leave"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className={secondaryButtonClass}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
