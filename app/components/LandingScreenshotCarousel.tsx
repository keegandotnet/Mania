"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";

type PlaceholderPanel = {
  title: string;
  eyebrow: string;
  route: string;
  navLabel: string;
  colorClassName: string;
  badgeClassName: string;
  content: ReactNode;
};

const panels: PlaceholderPanel[] = [
  {
    title: "Play the round",
    eyebrow: "Placeholder /play panel",
    route: "/play",
    navLabel: "Play",
    colorClassName: "from-accent-pink/35 via-surface to-accent-yellow/25",
    badgeClassName: "bg-accent-orange text-white",
    content: (
      <>
        <div className="rounded-[2rem] border border-border bg-surface/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
                This week&apos;s pick
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                Hounds of Love
              </h3>
              <p className="mt-1 text-sm text-foreground-secondary">Kate Bush</p>
            </div>
            <span className="rounded-full bg-accent-orange px-3 py-1 text-xs font-semibold text-white">
              Your turn
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Listen", "Score", "Review"].map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-border bg-surface-raised/80 p-3 text-center"
              >
                <p className="font-mono text-xs text-foreground-secondary">
                  0{index + 1}
                </p>
                <p className="mt-1 text-xs font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-accent-pink/30 bg-accent-pink/15 p-4">
          <p className="text-sm font-medium">
            &quot;Side B kicks the door in. I need everyone to hear this bridge.&quot;
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Reveal the verdict",
    eyebrow: "Placeholder /results panel",
    route: "/results",
    navLabel: "Results",
    colorClassName: "from-accent-yellow/35 via-surface to-accent-lime/30",
    badgeClassName: "bg-accent-yellow text-accent-yellow-fg",
    content: (
      <>
        <div className="rounded-[2rem] border border-border bg-surface/90 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
                Round revealed
              </p>
              <h3 className="mt-2 text-4xl font-semibold tracking-tight">8.7</h3>
            </div>
            <span className="rounded-full bg-accent-yellow px-3 py-1 text-xs font-semibold text-accent-yellow-fg">
              Average
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["Nina", "9.4"],
              ["Theo", "8.8"],
              ["Avery", "8.1"],
            ].map(([name, score]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface-raised/80 px-4 py-3"
              >
                <span className="text-sm font-medium">{name}</span>
                <span className="rounded-full bg-accent-yellow/70 px-3 py-1 text-sm font-semibold text-accent-yellow-fg">
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-accent-lime/35 bg-accent-lime/15 p-4">
          <p className="text-sm font-medium">Copy the recap and send it to the chat.</p>
        </div>
      </>
    ),
  },
  {
    title: "Keep the league tight",
    eyebrow: "Placeholder /account panel",
    route: "/account",
    navLabel: "League",
    colorClassName: "from-accent-lime/30 via-surface to-accent-pink/30",
    badgeClassName: "bg-accent-lime text-accent-lime-fg",
    content: (
      <>
        <div className="rounded-[2rem] border border-border bg-surface/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
                Your club
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                Friday Rotation
              </h3>
              <p className="mt-1 text-sm text-foreground-secondary">6 players</p>
            </div>
            <span className="rounded-full bg-accent-lime px-3 py-1 text-xs font-semibold text-accent-lime-fg">
              Invite only
            </span>
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-raised/70 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
              Invite code
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.22em]">
              MIXTAPE
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-border bg-surface/85 p-4">
            <p className="text-2xl font-semibold">12</p>
            <p className="mt-1 text-xs text-foreground-secondary">rounds played</p>
          </div>
          <div className="rounded-[1.5rem] border border-border bg-surface/85 p-4">
            <p className="text-2xl font-semibold">72</p>
            <p className="mt-1 text-xs text-foreground-secondary">takes saved</p>
          </div>
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
            See it in motion
          </p>
          <h2
            id="screenshot-carousel-heading"
            className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-5xl"
          >
            How a round actually plays out.
          </h2>
          <p className="mt-3 text-sm text-foreground-secondary">
            Screenshot-style placeholders for now &mdash; swap in real captures
            once the surfaces settle.
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
            className={`min-w-full snap-center rounded-[2rem] border-2 border-foreground bg-gradient-to-br ${panel.colorClassName} p-4 landing-sticker-sm sm:p-6 lg:min-w-[72%]`}
          >
            <div className="mx-auto max-w-sm rounded-[2.25rem] border-2 border-foreground/15 bg-background/85 p-3">
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
                    className={`rounded-full border-2 border-foreground/85 px-3 py-1 text-xs font-bold ${panel.badgeClassName}`}
                  >
                    {panel.route}
                  </span>
                </div>
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
