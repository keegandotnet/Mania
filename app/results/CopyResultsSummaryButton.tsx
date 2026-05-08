"use client";

import { useEffect, useState } from "react";
import { primaryButtonClass } from "@/app/components/ui";

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
    <div className="rounded-[2rem] border-2 border-foreground bg-accent-lime/25 p-6 landing-sticker sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-prose">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-lime-fg">
            Share summary
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Copy a paste-ready recap.
          </h2>
          <p className="mt-2 text-sm leading-7 text-foreground/85">
            Includes each revealed album, picker, average score, reviewer
            scores, and written reviews.
          </p>
          {copyState === "copied" ? (
            <p className="mt-3 text-sm font-bold text-accent-green-fg">
              Copied to clipboard.
            </p>
          ) : null}
          {copyState === "error" ? (
            <p className="mt-3 text-sm font-bold text-accent-pink-fg">
              Clipboard access failed. Try copying again from a secure browser
              context.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={copySummary}
          className={primaryButtonClass}
        >
          {copyState === "copied" ? "Copied!" : "Copy summary"}
        </button>
      </div>
    </div>
  );
}
