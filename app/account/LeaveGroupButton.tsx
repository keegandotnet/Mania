"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { leaveGroup } from "@/app/actions/mania";

type Props = { groupId: string; groupName: string; memberCount: number };

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
        className="shrink-0 rounded-md border border-red-200 bg-surface px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-950/50 dark:text-red-400 dark:hover:bg-red-950/20"
      >
        Leave group
      </button>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-[20px] border border-red-200 bg-red-50 p-4 dark:border-red-950/50 dark:bg-red-950/20">
      <p className="text-sm leading-7 text-foreground-secondary">
        {isLastMember ? (
          <>
            You are the only member of <span className="font-medium text-foreground">{groupName}</span>. The group will
            be empty after you leave, but your game history stays intact.
          </>
        ) : (
          <>
            Leave <span className="font-medium text-foreground">{groupName}</span>? Your game history stays intact.
          </>
        )}
      </p>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
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
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40"
        >
          {pending ? "Leaving..." : "Confirm leave"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
