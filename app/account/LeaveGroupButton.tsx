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
        className="shrink-0 rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Leave
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {isLastMember ? (
        <p className="text-xs text-foreground/70">
          You are the only member of{" "}
          <span className="font-medium">{groupName}</span>. The group will be empty after you
          leave, but your game history stays intact.
        </p>
      ) : (
        <p className="text-xs text-foreground/70">
          Leave <span className="font-medium">{groupName}</span>? Your game history stays intact.
        </p>
      )}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
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
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 hover:bg-red-700"
        >
          {pending ? "Leaving…" : "Confirm leave"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="rounded-md border border-black/15 px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50 dark:border-white/20"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
