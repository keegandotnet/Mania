# Mania — Design System

> "Book club for albums." Sticker-style, friendly-brutalist, slightly game-like.

The shipped product UI is a **sticker / friendly-brutalist** system: thick black borders, hard offset shadows, bold display type, accent-tinted cards, and tactile press feedback. The shared primitives live in [`app/components/ui.tsx`](../app/components/ui.tsx) and the supporting CSS utilities (`landing-sticker`, `landing-sticker-sm`, `landing-sticker-press`, `landing-tilt`, `landing-marker`) live in [`app/globals.css`](../app/globals.css).

This system is the **current product UI** across `/`, `/account`, `/login`, `/signup`, `/play`, and `/results` — not a marketing-only treatment.

---

## Critical analysis (still in force)

These rules survived the sticker rollout and remain non-negotiable:

**1. Orange is reserved for action, never decoration.**
In a turn-based game, orange must mean *"something needs you."* Using it anywhere else (decorative borders, headings, branding flourishes) erodes that signal. Rule: `accent-orange` appears only on primary CTAs and "your turn" game states (`PlayShell` urgent hero, `submitAlbum`/`submitReview` cards, `Sign up` button).

**2. Accessibility: orange and yellow are backgrounds, not text colors.**
`#F97316` on `#FAFAF9` has a contrast ratio of ~3.1:1 — fails WCAG AA for body-size text (needs 4.5:1). `#FACC15` on white is ~1.9:1 — nearly invisible as text. Mitigation: orange and yellow are always used as **background fills with dark foreground text on top**, never as text color. For text that must carry the orange meaning (e.g. a "Your turn" eyebrow), use the darker `--accent-orange-fg` (`#C2410C` ≈ 7:1 on white). Same pattern for the other accents (`-fg` token = readable on light, paired with white-ish on dark).

**3. Review text gets a max line length.**
Review writing and reading is core to the product. Unconstrained line width causes eye fatigue. All review/body-copy containers get `max-w-prose` (≈65ch) so reading feels intentional, not like a spreadsheet cell.

---

## 1. Color system

### Design tokens (CSS variables)

All Tailwind utilities map to these tokens — never use raw hex values in components.

| Token | Light | Dark | Usage |
| ----- | ----- | ---- | ----- |
| `--background` | `#FAFAF9` | `#141412` | Page background |
| `--surface` | `#FFFFFF` | `#1C1C1A` | Cards, modals, panels |
| `--surface-raised` | `#F3F4F6` | `#242422` | Nested surfaces, hover cells |
| `--foreground` | `#111827` | `#F3F4F6` | Primary text + sticker borders/shadows |
| `--foreground-secondary` | `#6B7280` | `#9CA3AF` | Meta text, labels, timestamps |
| `--border` | `#E5E7EB` | `#2D2D2B` | Legacy thin dividers (rare) |
| `--border-strong` | `#D1D5DB` | `#3F3F3C` | Legacy focused inputs (rare) |

> Sticker borders are drawn with `border-foreground` (full strength) or `border-foreground/15` (muted). The `--border` token is only used for legacy hover dividers.

### Accent tokens

| Token | Light | Dark | Usage |
| ----- | ----- | ---- | ----- |
| `--accent-orange` | `#F97316` | `#FB923C` | CTA backgrounds, "your turn" fills |
| `--accent-orange-hover` | `#EA6C0A` | `#F97316` | Hover state for orange |
| `--accent-orange-fg` | `#C2410C` | `#FED7AA` | Orange-meaning text (AA-compliant) |
| `--accent-yellow` | `#FACC15` | `#FDE047` | Reveal / completed fills, marker highlights |
| `--accent-yellow-fg` | `#92400E` | `#FEF3C7` | Text on yellow backgrounds |
| `--accent-green` | `#22C55E` | `#4ADE80` | "Submitted" fills |
| `--accent-green-fg` | `#14532D` | `#DCFCE7` | Text on green backgrounds |
| `--accent-pink` | `#F9A8D4` | `#F472B6` | Setup / "you" badges, soft hero tints |
| `--accent-pink-fg` | `#831843` | `#FCE7F3` | Text on pink backgrounds |
| `--accent-peach` | `#FDBA74` | `#FDBA74` | Host / "waiting on someone" tones |
| `--accent-peach-fg` | `#9A3412` | `#FFF7ED` | Text on peach backgrounds |
| `--accent-lime` | `#BEF264` | `#A3E635` | Ready / club / strong-yes tones |
| `--accent-lime-fg` | `#3F6212` | `#ECFCCB` | Text on lime backgrounds |

### Usage rules

- **Orange backgrounds** always pair with white text or `--accent-orange-fg` for label-style text.
- **Yellow / pink / peach / lime backgrounds** always pair with their `-fg` companion or `--foreground` body copy.
- **Green backgrounds** always pair with `--accent-green-fg` or white.
- One tone per card; avoid mixing two accent colors in the same component. Inner stat tiles inside a tone-tinted card use `bg-surface/90` to read as a clean white inset.

---

## 2. Typography

**Font:** Geist Sans (already loaded via `next/font/google`). Falls back to system-ui → sans-serif.

The sticker system leans on bold display weights and tight tracking for hierarchy.

### Scale

| Role | Class | Size | Weight | Line height |
| ---- | ----- | ---- | ------ | ----------- |
| Page hero (`PageHeader.title`) | `text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl` | 36–60px | 900 | 1.05 |
| Section heading | `text-2xl font-black tracking-tight sm:text-3xl` | 24–30px | 900 | 1.15 |
| Card heading | `text-lg font-black tracking-tight` to `text-xl` | 18–20px | 900 | 1.2 |
| Body | `text-sm leading-7` to `text-base leading-7` | 14–16px | 400 | 1.6 |
| Eyebrow / status label | `text-[11px] font-bold uppercase tracking-[0.22em]` | 11px | 700 | 1.4 |
| Meta / hint | `text-xs` | 12px | 400 | 1.4 |
| Mono (codes, IDs, scores) | `font-mono text-xs` to `font-mono text-base font-black tracking-[0.22em]` | 12–16px | 400–900 | 1.4 |

### Rules

- **No text smaller than 11px** in interactive elements; 11px is reserved for tracked-out eyebrow labels.
- Heading hierarchy must be sequential on each page (no skipping h1 → h3).
- Review text containers use `max-w-prose` and `leading-7`.
- Eyebrows use `toneEyebrowClass(tone)` from `app/components/ui.tsx` so the small label inherits the right `-fg` color for the surrounding card.
- Labels and meta text use `--foreground-secondary`; never drop below 4.5:1 contrast.

---

## 3. Spacing + layout

**Scale:** standard Tailwind 4px base. Prefer multiples of 4.

| Context | Value |
| ------- | ----- |
| Page horizontal padding | `px-4` (mobile) → `px-6` (sm+) |
| Page vertical padding | `py-10` (mobile) → `py-16` (sm+) |
| Max content width | `max-w-5xl` for app pages, `max-w-6xl` for `/account` and `SiteHeader` shell |
| Section gap | `gap-8` between major sections, `gap-6` inside `PlayShell` / `ResultsView` cards |
| Card internal padding | `p-6` (standard) / `sm:p-7` (large) / `sm:p-8` (hero) / `p-4`–`p-5` (insets) |
| Between sibling cards | `gap-3` to `gap-4` |
| Between label + value | `gap-1` to `gap-2` |
| Between form fields | `gap-3` to `gap-4` |

### Layout rules

- **Cards over full-width blocks.** Prefer `cardClass` / `toneCardClass(...)` containers over full-bleed sections.
- **Mobile-first columns.** Multi-column grids only above `sm:` (`grid-cols-2`) or `lg:` / `xl:` for stat tile rows.
- **No horizontal scroll** — the root of every shell uses `min-w-0` and `flex-col`. Inputs and code blocks wrap with `break-all` / `[overflow-wrap:anywhere]`.
- Whitespace is intentional: empty space + a single sticker card signals "there's nothing to do here" — don't fill it.

---

## 4. Component patterns

The shared primitives live in `app/components/ui.tsx`. **Always** prefer them over local one-offs.

### Cards

| Variant | Helper | Notes |
| ------- | ------ | ----- |
| Standard sticker card | `cardClass` | `rounded-[2rem] border-2 border-foreground bg-surface p-6 landing-sticker sm:p-7` |
| Hero / large sticker card | `sectionCardClass` | `rounded-[2.5rem]` with extra padding |
| Tone-tinted sticker card | `toneCardClass(tone)` | Returns the rounded + bordered + tinted `bg-accent-X/Y` + `landing-sticker` for the chosen tone |
| Inner muted tile | `subtleCardClass` (or inline `rounded-2xl border-2 border-foreground/10 bg-surface-raised/70 p-4`) | Used for roster cells, history rows, settings insets |
| Stat tile | `<StatTile />` | `rounded-2xl border-2 border-foreground/10 bg-surface/90 p-4` with eyebrow/value/optional hint slots |

Sticker shadows come from `landing-sticker` (`6px 6px 0 0 var(--foreground)`) for hero cards and `landing-sticker-sm` (`3px 3px 0 0 var(--foreground)`) for inset cards and small button presses.

Inset cards inside a tone-tinted hero (e.g. the "Live read" panel inside the pink `showReviewForm` card) use the small sticker shadow so they don't fight the parent card.

### Buttons

All button helpers come from `app/components/ui.tsx`. Each variant baked-in a `min-h-12` (or `min-h-14` for `Lg`) touch target plus thick border + sticker press feedback.

| Variant | Helper |
| ------- | ------ |
| Primary CTA | `primaryButtonClass` (orange fill, full sticker shadow) |
| Primary large CTA | `primaryButtonLgClass` |
| Primary small | `primaryButtonSmClass` |
| Secondary | `secondaryButtonClass` (white sticker, sm shadow) |
| Secondary large | `secondaryButtonLgClass` |
| Secondary small | `secondaryButtonSmClass` |
| Destructive | `destructiveButtonClass` (red fill, full sticker shadow) |
| Destructive small | `destructiveButtonSmClass` |
| Ghost | `ghostButtonClass` (transparent, no shadow — for inline links) |

Rules:

- Disabled state always uses `opacity-40` + `cursor-not-allowed`, never hidden.
- Loading/pending state replaces label text (e.g. "Saving…") and sets `disabled`.
- Minimum touch target: 48px tall (`min-h-12`); `Lg` variants are 56px.
- All buttons except `ghostButtonClass` apply `landing-sticker-press` so they translate down by a couple of pixels on `:hover` / `:active` for tactile feedback.

### Inputs

```
inputClass    →  rounded-2xl border-2 border-foreground/15 bg-surface px-4 py-3 ...
                 placeholder:text-foreground-secondary
                 focus:border-foreground/45 disabled:opacity-50
textareaClass →  same, with min-h-32 and leading-relaxed
```

Use the helpers directly. Wrap them in `<label className="flex flex-col gap-2 text-sm font-bold">` so the label visually weights to match the sticker tone.

### Status badges

Pill-shaped inline labels via `toneBadgeClass(tone)`:

```
inline-flex items-center rounded-full border-2 border-foreground/85 px-3 py-1 text-xs font-bold
```

| Tone | Background | Text |
| ---- | ---------- | ---- |
| `orange` | `bg-accent-orange` | `text-white` (used for "Your turn", "Needs your action") |
| `yellow` | `bg-accent-yellow` | `text-accent-yellow-fg` ("Revealed", "Top pick", "Leading") |
| `green` | `bg-accent-green/30` | `text-accent-green-fg` ("Submitted") |
| `pink` | `bg-accent-pink/55` | `text-accent-pink-fg` ("You", "Setup") |
| `lime` | `bg-accent-lime/65` | `text-accent-lime-fg` ("Active", "Submitted to room") |
| `peach` | `bg-accent-peach/70` | `text-accent-peach-fg` ("Waiting on others") |
| `neutral` | `bg-surface-raised` | `text-foreground-secondary` ("Waiting", "Pending") |

Eyebrow labels (`toneEyebrowClass`) use the same tone family but render as small uppercase tracked-out text, not pills.

### Shadows

Sticker shadows replace the previous `shadow-sm` rule:

- Hero / large cards → `landing-sticker` (6px hard offset)
- Insets / small cards / pressed buttons → `landing-sticker-sm` (3px hard offset)
- Buttons → `landing-sticker-press` (CSS class that animates the button two pixels down on hover and four on active, shrinking the shadow)

Soft drop shadows (`shadow-md`, `shadow-lg`) are not used.

---

## 5. Game state UI

These are the four states a player is in at any moment. Each maps to a tone in `toneCardClass` / `toneBadgeClass` / `toneEyebrowClass` so the player always knows their role without reading.

### "Your turn" — orange

> You need to do something.

- Hero card: `toneCardClass("orange")` (orange-tinted sticker)
- Eyebrow: `toneEyebrowClass("orange")` → `text-accent-orange-fg`
- Status pill: `toneBadgeClass("orange")` → solid orange with white text reading "Your turn"
- CTA: `primaryButtonClass` (orange fill) is visible and prominent
- Optional secondary cue: a second `toneBadgeClass("orange")` reading "Needs your action"

### "Waiting" — neutral / peach

> Others are doing something. You're watching.

- Hero card: `toneCardClass("neutral")` (white sticker) for "first round pending"; `toneCardClass("peach")` when explicitly waiting on a specific person
- Eyebrow: `toneEyebrowClass("neutral")` or `"peach"`
- Status pill: `toneBadgeClass("neutral")` or `"peach"`
- CTA: hidden or downgraded to a `secondaryButtonClass` (e.g. "Refresh")

### "Submitted" — green / lime

> You've done your part. Waiting for round to close.

- Hero card: `toneCardClass("green")` for the picker's "review me" hand-off; `toneCardClass("lime")` for the picker's "your pick is out" hand-off after submitting an album
- Status pill: `toneBadgeClass("green")` reading "Submitted"
- No further action needed; the orange CTA disappears

### "Round complete / Revealed" — yellow

> The round is over. Results are visible.

- Hero card: `toneCardClass("yellow")`
- Eyebrow: `text-accent-yellow-fg`
- Status pill: `toneBadgeClass("yellow")` reading "Revealed" / "Top pick"
- CTA shifts to a secondary "View results" / "Start next round" pair

---

## 6. Interaction rules

- **No layout shift on interaction.** Reserve space for error/success messages with `min-h-6` (`Feedback` slot) or always-rendered conditionally hidden lines.
- **Instant feedback.** Button goes into `pending` state (label change + `disabled`) on the same frame as the click — no delay before visual response.
- **No hidden actions.** Every action available to the user is visible. Nothing behind hover-only reveals or context menus.
- **Tactile motion only.** Sticker buttons apply a 140ms transform/box-shadow press; ambient blobs/tilt are decorative only and disabled under `prefers-reduced-motion` (see [`app/globals.css`](../app/globals.css) `@media (prefers-reduced-motion: reduce)`).
- **Tilt is optional and decorative.** `landing-tilt`, `landing-tilt-left`, `landing-tilt-right`, and `landing-marker` apply a small rotation for personality. They flatten under reduced-motion. Never tilt interactive controls (buttons, inputs).
- **Error messages are inline.** Errors appear adjacent to the element that triggered them via the local `Feedback` component, not as toast notifications.
- **Destructive actions are two-step.** Any irreversible action (leave group, etc.) requires an explicit inline confirm/cancel pair, framed in a red-tinted sticker inset.
- **Reduced motion.** `landing-float`, `landing-float-slow`, `landing-tilt`, marker rotation, and sticker press transitions are all disabled when the user requests reduced motion. Sticker shadows remain so the brand still reads.

---

## 7. Implementation order (shipped)

The sticker system rolled out incrementally and is now applied across the product:

1. **Sprint 1:** Defined tokens in `globals.css`, set up `@theme`. ✅
2. **Sprint 2:** Landing page (`/`), `SiteHeader`, sticker primitives + screenshot carousel. ✅
3. **Sprint 3:** `/account` (groups, history, display name form). ✅
4. **Sprint 4:** `/play` (`PlayShell` — game state cards, host controls, picker form, review form, setup, leave-group). ✅
5. **Sprint 5:** `/results` (`ResultsView` — round archive, scoreboard, share summary). ✅
6. **Sprint 6:** Login / signup forms. ✅

Future surfaces (Spotify integration, analytics, native shells) should adopt these primitives by default. Anything that diverges should ship in `app/components/ui.tsx` first so it stays canonical.
