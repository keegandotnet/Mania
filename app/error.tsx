"use client";

import { useEffect } from "react";
import { PageShell, primaryButtonClass, secondaryButtonClass } from "@/app/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route failed", error);
  }, [error]);

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-[2rem] border-2 border-foreground bg-surface p-6 landing-sticker sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600">Could not load</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">The room hit a data error.</h1>
          <p className="mt-3 text-sm leading-7 text-foreground-secondary">
            Your data was not replaced with an empty state. Retry now, and contact the host if the problem continues.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className={primaryButtonClass} onClick={reset}>Try again</button>
            <a href="/account" className={secondaryButtonClass}>Go to account</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
