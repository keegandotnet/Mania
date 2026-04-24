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
      className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground-secondary transition-colors hover:bg-surface-raised"
    >
      {copied ? "Copied!" : "Copy code"}
    </button>
  );
}
