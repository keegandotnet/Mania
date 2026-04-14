"use client";

import { useState } from "react";

type Props = { inviteCode: string };

export function CopyInviteButton({ inviteCode }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      title="Copy invite code"
      className="ml-2 rounded-md border border-black/15 bg-black/5 px-2 py-0.5 text-xs font-medium text-foreground/70 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
