import type { ReactNode } from "react";

export type Tone =
  | "neutral"
  | "orange"
  | "yellow"
  | "green"
  | "pink"
  | "lime"
  | "peach";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const pageBgClass =
  "bg-[radial-gradient(circle_at_15%_8%,var(--accent-pink)_0,transparent_36rem),radial-gradient(circle_at_85%_4%,var(--accent-yellow)_0,transparent_32rem),radial-gradient(circle_at_70%_70%,var(--accent-lime)_0,transparent_34rem),linear-gradient(180deg,var(--background),var(--surface-raised))]";

export const containerClass =
  "mx-auto w-full max-w-6xl px-4 sm:px-6";

export const cardClass =
  "rounded-[2rem] border-2 border-foreground bg-surface p-6 landing-sticker sm:p-7";
export const subtleCardClass =
  "rounded-[1.5rem] border-2 border-foreground/10 bg-surface-raised/70 p-4";
export const sectionCardClass =
  "rounded-[2.5rem] border-2 border-foreground bg-surface p-6 landing-sticker sm:p-9";

export const inputClass =
  "rounded-2xl border-2 border-foreground/15 bg-surface px-4 py-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-foreground-secondary focus:border-foreground/45 disabled:opacity-50";
export const textareaClass =
  "min-h-32 rounded-2xl border-2 border-foreground/15 bg-surface px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-foreground-secondary focus:border-foreground/45 disabled:opacity-50";

const baseButton =
  "inline-flex min-h-12 items-center justify-center rounded-2xl border-2 px-6 text-sm font-bold transition-[transform,box-shadow,background-color,color] disabled:cursor-not-allowed disabled:opacity-40";

export const primaryButtonClass = `${baseButton} border-foreground bg-accent-orange text-white landing-sticker landing-sticker-press hover:bg-accent-orange-hover`;
export const secondaryButtonClass = `${baseButton} border-foreground/15 bg-surface text-foreground landing-sticker-sm landing-sticker-press hover:bg-surface-raised`;
export const ghostButtonClass = `${baseButton} border-transparent bg-transparent text-foreground hover:bg-surface-raised`;
export const destructiveButtonClass = `${baseButton} border-foreground bg-red-600 text-white landing-sticker landing-sticker-press hover:bg-red-700`;

const baseButtonLg =
  "inline-flex min-h-14 items-center justify-center rounded-2xl border-2 px-7 text-base font-bold transition-[transform,box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-40";

export const primaryButtonLgClass = `${baseButtonLg} border-foreground bg-accent-orange text-white landing-sticker landing-sticker-press hover:bg-accent-orange-hover`;
export const secondaryButtonLgClass = `${baseButtonLg} border-foreground/15 bg-surface text-foreground landing-sticker-sm landing-sticker-press hover:bg-surface-raised`;

const baseButtonSm =
  "inline-flex min-h-9 items-center justify-center rounded-xl border-2 px-3 text-xs font-bold transition-[transform,box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-40";

export const primaryButtonSmClass = `${baseButtonSm} border-foreground/85 bg-accent-orange text-white hover:bg-accent-orange-hover`;
export const secondaryButtonSmClass = `${baseButtonSm} border-foreground/15 bg-surface text-foreground hover:bg-surface-raised`;
export const destructiveButtonSmClass = `${baseButtonSm} border-foreground/85 bg-red-600 text-white hover:bg-red-700`;

export function toneCardClass(tone: Tone): string {
  switch (tone) {
    case "orange":
      return "rounded-[2rem] border-2 border-foreground bg-accent-orange/15 landing-sticker";
    case "yellow":
      return "rounded-[2rem] border-2 border-foreground bg-accent-yellow/30 landing-sticker";
    case "green":
      return "rounded-[2rem] border-2 border-foreground bg-accent-green/20 landing-sticker";
    case "pink":
      return "rounded-[2rem] border-2 border-foreground bg-accent-pink/30 landing-sticker";
    case "lime":
      return "rounded-[2rem] border-2 border-foreground bg-accent-lime/30 landing-sticker";
    case "peach":
      return "rounded-[2rem] border-2 border-foreground bg-accent-peach/30 landing-sticker";
    default:
      return "rounded-[2rem] border-2 border-foreground bg-surface landing-sticker";
  }
}

export function toneEyebrowClass(tone: Tone): string {
  const base = "text-[11px] font-bold uppercase tracking-[0.22em]";
  switch (tone) {
    case "orange":
      return `${base} text-accent-orange-fg`;
    case "yellow":
      return `${base} text-accent-yellow-fg`;
    case "green":
      return `${base} text-accent-green-fg`;
    case "pink":
      return `${base} text-accent-pink-fg`;
    case "lime":
      return `${base} text-accent-lime-fg`;
    case "peach":
      return `${base} text-accent-peach-fg`;
    default:
      return `${base} text-foreground-secondary`;
  }
}

export function toneBadgeClass(tone: Tone): string {
  const base =
    "inline-flex items-center rounded-full border-2 border-foreground/85 px-3 py-1 text-xs font-bold";
  switch (tone) {
    case "orange":
      return `${base} bg-accent-orange text-white`;
    case "yellow":
      return `${base} bg-accent-yellow text-accent-yellow-fg`;
    case "green":
      return `${base} bg-accent-green/30 text-accent-green-fg`;
    case "pink":
      return `${base} bg-accent-pink/55 text-accent-pink-fg`;
    case "lime":
      return `${base} bg-accent-lime/65 text-accent-lime-fg`;
    case "peach":
      return `${base} bg-accent-peach/70 text-accent-peach-fg`;
    default:
      return `${base} bg-surface-raised text-foreground-secondary`;
  }
}

export const eyebrowClass =
  "text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary";

export function PageShell({
  children,
  withBlobs = true,
}: {
  children: ReactNode;
  withBlobs?: boolean;
}) {
  return (
    <main className={`relative flex-1 overflow-hidden ${pageBgClass}`}>
      {withBlobs ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="landing-float absolute -left-24 top-32 h-72 w-72 rounded-full bg-accent-pink/30 blur-3xl" />
          <div className="landing-float-slow absolute -right-20 top-[28rem] h-80 w-80 rounded-full bg-accent-lime/30 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/60 to-transparent" />
        </div>
      ) : null}
      {children}
    </main>
  );
}

export function PageHeader({
  eyebrow,
  eyebrowTone = "neutral",
  title,
  description,
  actions,
}: {
  eyebrow: string;
  eyebrowTone?: Tone;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <span
          className={`inline-flex rounded-full border-2 border-foreground/15 bg-surface/90 px-4 py-2 ${toneEyebrowClass(eyebrowTone)} landing-sticker-sm`}
        >
          {eyebrow}
        </span>
        <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-prose text-base leading-7 text-foreground-secondary sm:text-lg sm:leading-8">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}

export function Eyebrow({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <p className={toneEyebrowClass(tone)}>{children}</p>;
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-foreground/10 bg-surface/90 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 break-words text-xs text-foreground-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
