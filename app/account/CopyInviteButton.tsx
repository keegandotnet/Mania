"use client";

import { useState } from "react";
import { secondaryButtonSmClass } from "@/app/components/ui";

type Props = { inviteCode: string };

export function CopyInviteButton({ inviteCode }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title="Copy invite code"
      className={secondaryButtonSmClass}
      onClick={async () => {
        await navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied!" : "Copy code"}
    </button>
  );
}
