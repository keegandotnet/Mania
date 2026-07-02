"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { cx, toneBadgeClass } from "@/app/components/ui";

type ProductPanel = {
  title: string;
  eyebrow: string;
  route: string;
  navLabel: string;
  frameClassName: string;
  badgeTone: "orange" | "yellow" | "lime";
  summary: string;
  content: ReactNode;
};

const panels: ProductPanel[] = [
  {
    title: "Play room",
    eyebrow: "Current /play shape",
    route: "/play",
    navLabel: "Play",
    frameClassName: "from-accent-pink/30 via-surface to-accent-orange/15",
    badgeTone: "orange",
    summary:
      "A sanitized read of the live game room: status, roster, album, and the next action.",
    content: (
      <>
        <div className="rounded-[2rem] border-2 border-foreground bg-accent-orange/15 p-5 landing-sticker-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-orange-fg">
                Round 02 of 06
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">
                Your review is due
              </h3>
              <p className="mt-2 text-sm leading-6 text-foreground/80">
                Sawayama is waiting on your score and notes.
              </p>
            </div>
            <span className={cx(toneBadgeClass("orange"), "shrink-0")}>
              Your turn
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Album", "Sawayama"],
              ["Picker", "Mina"],
              ["Reviews", "2 / 5"],
              ["Room", "Friday Rotation"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border-2 border-foreground/10 bg-surface/90 p-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-secondary">
                  {label}
                </p>
                <p className="mt-1 text-sm font-black">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border-2 border-foreground/10 bg-surface/90 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-secondary">
            Review panel
          </p>
          <p className="mt-2 text-sm font-bold leading-6">
            Score 1-10, write the take, and keep it hidden until reveal.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Scoreboard",
    eyebrow: "Current /results shape",
    route: "/results",
    navLabel: "Results",
    frameClassName: "from-accent-yellow/35 via-surface to-accent-lime/25",
    badgeTone: "yellow",
    summary:
      "A public-safe snapshot of revealed rounds, average scores, and review receipts.",
    content: (
      <>
        <div className="rounded-[2rem] border-2 border-foreground bg-accent-yellow/30 p-5 landing-sticker-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-yellow-fg">
                Round revealed
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">
                Dragon New Warm Mountain
              </h3>
              <p className="mt-1 text-sm text-foreground-secondary">Big Thief</p>
            </div>
            <span className={cx(toneBadgeClass("yellow"), "shrink-0")}>
              8.7 avg
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["Mina", "9.3", "All timer"],
              ["Theo", "8.7", "Strong yes"],
              ["Jules", "8.1", "Works on me"],
            ].map(([name, score, label]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-foreground/10 bg-surface/90 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-black">{name}</p>
                  <p className="text-xs text-foreground-secondary">{label}</p>
                </div>
                <span className="rounded-full border-2 border-foreground/85 bg-accent-yellow/75 px-3 py-1 font-mono text-sm font-bold text-accent-yellow-fg">
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border-2 border-foreground/10 bg-surface/90 p-4">
          <p className="text-sm font-bold">
            Top pick badges, rating bars, and share summaries stay ready for the
            group chat.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Club hub",
    eyebrow: "Current /account shape",
    route: "/account",
    navLabel: "League",
    frameClassName: "from-accent-lime/30 via-surface to-accent-pink/25",
    badgeTone: "lime",
    summary:
      "A redacted account view: display name, groups, and game history without emails or invite codes.",
    content: (
      <>
        <div className="rounded-[2rem] border-2 border-foreground bg-accent-lime/30 p-5 landing-sticker-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-lime-fg">
                Profile summary
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">
                Mina
              </h3>
              <p className="mt-1 text-sm text-foreground-secondary">
                Signed in and ready
              </p>
            </div>
            <span className={cx(toneBadgeClass("lime"), "shrink-0")}>
              Active
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["Groups", "2"],
              ["Games", "7"],
              ["Takes", "31"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border-2 border-foreground/10 bg-surface/90 p-3 text-center"
              >
                <p className="text-xl font-black">{value}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-secondary">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border-2 border-foreground/10 bg-surface/90 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-secondary">
            Club memberships
          </p>
          <p className="mt-2 text-sm font-bold">
            Copy controls and leave-group confirms stay inside the account hub.
          </p>
        </div>
      </>
    ),
  },
];

export function LandingScreenshotCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollToPanel = (index: number) => {
    const panel = carouselRef.current?.children[index];
    if (!(panel instanceof HTMLElement)) {
      return;
    }

    panel.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActiveIndex(index);
  };

  return (
    <section
      className="w-full rounded-[2.5rem] border-2 border-foreground bg-surface/85 p-5 landing-sticker sm:p-7 lg:p-9"
      aria-labelledby="screenshot-carousel-heading"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-secondary">
            Product snapshots
          </p>
          <h2
            id="screenshot-carousel-heading"
            className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-5xl"
          >
            What new players will actually use.
          </h2>
          <p className="mt-3 text-sm text-foreground-secondary">
            Real screenshot capture is blocked in this checkout by missing local
            app data and screenshot tooling, so these are redacted static panels
            modeled on the current product UI.
          </p>
        </div>
        <div
          className="flex flex-wrap items-center justify-center gap-2 sm:justify-end"
          role="tablist"
          aria-label="Choose preview panel"
        >
          {panels.map((panel, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={panel.route}
                type="button"
                onClick={() => scrollToPanel(index)}
                className={`min-h-12 rounded-2xl border-2 px-5 text-sm font-bold transition-colors ${
                  isActive
                    ? "border-foreground bg-foreground text-background landing-sticker-sm"
                    : "border-foreground/15 bg-surface text-foreground hover:bg-surface-raised"
                }`}
                aria-pressed={isActive}
              >
                {panel.navLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={carouselRef}
        onScroll={(event) => {
          const container = event.currentTarget;
          const panelWidth = container.firstElementChild?.clientWidth ?? 1;
          const nextIndex = Math.round(container.scrollLeft / panelWidth);
          setActiveIndex(Math.min(Math.max(nextIndex, 0), panels.length - 1));
        }}
        className="mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {panels.map((panel) => (
          <article
            key={panel.route}
            className={`min-w-full snap-center rounded-[2rem] border-2 border-foreground bg-gradient-to-br ${panel.frameClassName} p-4 landing-sticker-sm sm:p-6 lg:min-w-[72%]`}
          >
            <div className="mx-auto max-w-md rounded-[2.25rem] border-2 border-foreground/15 bg-background/85 p-3">
              <div className="rounded-[1.8rem] border-2 border-foreground/10 bg-surface/95 p-3 sm:p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-secondary">
                      {panel.eyebrow}
                    </p>
                    <h3 className="mt-1 text-lg font-black tracking-tight">
                      {panel.title}
                    </h3>
                  </div>
                  <span
                    className={cx(toneBadgeClass(panel.badgeTone), "shrink-0")}
                  >
                    {panel.route}
                  </span>
                </div>
                <p className="mb-4 text-sm leading-6 text-foreground-secondary">
                  {panel.summary}
                </p>
                <div className="space-y-3">{panel.content}</div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div
        className="mt-4 flex justify-center gap-2"
        aria-hidden="true"
      >
        {panels.map((panel, index) => (
          <span
            key={panel.route}
            className={`h-2 w-2 rounded-full transition-colors ${
              activeIndex === index
                ? "bg-foreground"
                : "bg-foreground/20"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
