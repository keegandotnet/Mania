"use client";

import { useEffect, useState } from "react";

type CopyState = "idle" | "copied" | "error";

type Props = {
  summary: string;
};

export function CopyResultsSummaryButton({ summary }: Props) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const copySummary = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable.");
      }
      await navigator.clipboard.writeText(summary);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-prose">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary">
            Share summary
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
            Copy a paste-ready recap.
          </h2>
          <p className="mt-2 text-sm leading-7 text-foreground-secondary">
            Includes each revealed album, picker, average score, reviewer scores, and
            written reviews.
          </p>
          {copyState === "copied" ? (
            <p className="mt-3 text-sm font-medium text-accent-green-fg">Copied to clipboard.</p>
          ) : null}
          {copyState === "error" ? (
            <p className="mt-3 text-sm font-medium text-accent-pink-fg">
              Clipboard access failed. Try copying again from a secure browser context.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={copySummary}
          className="rounded-md bg-accent-orange px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-orange-hover"
        >
          {copyState === "copied" ? "Copied!" : "Copy summary"}
        </button>
      </div>
    </div>
  );
}
