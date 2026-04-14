# Mania — Design System

> "Book club for albums." Editorial. Social. Slightly game-like.

---

## Critical analysis (pre-implementation notes)

Three improvements made to the initial brief:

**1. Orange is reserved for action, never decoration.**
In a turn-based game, orange must mean *"something needs you."* Using it anywhere else (decorative borders, headings, branding flourishes) erodes that signal. Rule: `accent-orange` appears only on primary CTAs and "your turn" game states.

**2. Accessibility: orange and yellow are backgrounds, not text colors.**
`#F97316` on `#FAFAF9` has a contrast ratio of ~3.1:1 — fails WCAG AA for body-size text (needs 4.5:1). `#FACC15` on white is ~1.9:1 — nearly invisible as text. Mitigation: orange and yellow are always used as **background fills with dark foreground text on top**, never as text color. For text that must carry the orange meaning (e.g. a "Your turn" label), use the darker `--accent-orange-fg` (`#C2410C` ≈ 7:1 on white).

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
| `--foreground` | `#111827` | `#F3F4F6` | Primary text |
| `--foreground-secondary` | `#6B7280` | `#9CA3AF` | Meta text, labels, timestamps |
| `--border` | `#E5E7EB` | `#2D2D2B` | Dividers, card outlines |
| `--border-strong` | `#D1D5DB` | `#3F3F3C` | Focused inputs, emphasis |

### Accent tokens

| Token | Light | Dark | Usage |
| ----- | ----- | ---- | ----- |
| `--accent-orange` | `#F97316` | `#FB923C` | CTA backgrounds, "your turn" fills |
| `--accent-orange-hover` | `#EA6C0A` | `#F97316` | Hover state for orange |
| `--accent-orange-fg` | `#C2410C` | `#FED7AA` | Orange-meaning text (AA-compliant) |
| `--accent-yellow` | `#FACC15` | `#FDE047` | Rating fills, emphasis backgrounds |
| `--accent-yellow-fg` | `#92400E` | `#FEF3C7` | Text on yellow backgrounds |
| `--accent-green` | `#22C55E` | `#4ADE80` | Submitted/completed fills |
| `--accent-green-fg` | `#14532D` | `#DCFCE7` | Text on green backgrounds |

### Usage rules

- **Orange backgrounds** always pair with white text (`#FFFFFF`) or `--accent-orange-fg` for labels.
- **Yellow backgrounds** always pair with `--accent-yellow-fg` (dark amber) — never white.
- **Green backgrounds** always pair with `--accent-green-fg` (dark green) or white.
- Avoid mixing two accent colors in the same component.

---

## 2. Typography

**Font:** Geist Sans (already loaded via `next/font/google`). Falls back to system-ui → sans-serif.

### Scale

| Role | Class | Size | Weight | Line height |
| ---- | ----- | ---- | ------ | ----------- |
| Page title | `text-2xl font-semibold tracking-tight` | 24px | 600 | 1.25 |
| Section heading | `text-lg font-semibold tracking-tight` | 18px | 600 | 1.3 |
| Card heading | `text-base font-semibold` | 16px | 600 | 1.4 |
| Body | `text-sm` | 14px | 400 | 1.5 |
| Meta / label | `text-xs` | 12px | 400–500 | 1.4 |
| Mono (codes, IDs) | `font-mono text-xs` | 12px | 400 | 1.4 |

### Rules

- **No text smaller than 12px** in interactive elements.
- Heading hierarchy must be sequential on each page (no skipping h1 → h3).
- Review text containers use `max-w-prose` and `leading-relaxed` for readability.
- Labels and meta text use `--foreground-secondary`; never drop below 4.5:1 contrast.

---

## 3. Spacing + layout

**Scale:** standard Tailwind 4px base. Prefer multiples of 4.

| Context | Value |
| ------- | ----- |
| Page horizontal padding | `px-4` (mobile) → `px-6` (sm+) |
| Page vertical padding | `py-10` (mobile) → `py-16` (sm+) |
| Max content width | `max-w-lg` (520px) — keeps reading tight and intentional |
| Section gap | `gap-8` between major sections |
| Card internal padding | `p-4` (compact) / `p-5` (standard) / `p-6` (spacious) |
| Between sibling cards | `gap-3` |
| Between label + value | `gap-1` |
| Between form fields | `gap-4` |

### Layout rules

- **Cards over full-width blocks.** Prefer `rounded-lg border border-border p-5` containers over full-bleed sections.
- **Single-column mobile first.** Max-width container centered on desktop. No multi-column grid until Phase 2 analytics.
- **No horizontal scroll** — every element is `min-w-0` where needed.
- Whitespace is intentional: empty space signals "there's nothing to do here" — don't fill it.

---

## 4. Component patterns

### Cards

Primary container for any grouped content.

```
rounded-lg border border-border bg-surface p-5 shadow-sm
```

Elevated / focus state (e.g. "your turn" card):
```
rounded-lg border border-accent-orange bg-surface p-5 shadow-sm ring-1 ring-accent-orange/20
```

### Buttons

| Variant | Classes |
| ------- | ------- |
| **Primary** (CTA) | `rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-white hover:bg-accent-orange-hover disabled:opacity-40` |
| **Secondary** | `rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised disabled:opacity-40` |
| **Destructive** | `rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40` |
| **Ghost / link** | `text-sm font-medium text-foreground underline-offset-4 hover:underline` |

Rules:
- Disabled state always uses `opacity-40` + `cursor-not-allowed`, never hidden.
- Loading/pending state replaces label text (e.g. "Saving…") and sets `disabled`.
- Minimum touch target: 36px tall (achieved with `py-2` on `text-sm`).

### Input fields

```
rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground
placeholder:text-foreground-secondary
focus:border-border-strong focus:outline-none
disabled:opacity-50
```

Textarea (review input) adds `leading-relaxed resize-none min-h-[80px]`.

### Status badges

Pill-shaped inline labels. Always a colored background with contrasting foreground text.

```
rounded-full px-2 py-0.5 text-xs font-medium
```

| State | Background | Text |
| ----- | ---------- | ---- |
| Pending | `bg-foreground-secondary/15` | `text-foreground-secondary` |
| Active | `bg-accent-green/15` | `text-accent-green-fg` |
| Completed | `bg-surface-raised` | `text-foreground-secondary` |

### Shadows

Only `shadow-sm` (subtle, 1px-ish lift). Never `shadow-lg` or `shadow-xl`. No drop shadows on text.

---

## 5. Game state UI

These are the four states a player is in at any moment. Each maps to a distinct visual treatment so the player always knows their role without reading.

### "Your turn" — orange

> You need to do something.

- **Card border:** `border-accent-orange`
- **Accent ring:** `ring-1 ring-accent-orange/20`
- **Label:** `bg-accent-orange text-white` badge reading "Your turn"
- **CTA button:** Primary (orange) is visible and prominent

### "Waiting" — muted

> Others are doing something. You're watching.

- **Card border:** `border-border` (standard)
- **Label:** `text-foreground-secondary` reading "Waiting for others…"
- **CTA:** hidden or visually secondary
- No accent color usage

### "Submitted" — green

> You've done your part. Waiting for round to close.

- **Label:** `bg-accent-green/15 text-accent-green-fg` badge reading "Submitted"
- Card border remains standard — green is the label, not the whole card
- No further action needed

### "Round complete / Revealed" — yellow

> The round is over. Results are visible.

- **Section header or banner:** `bg-accent-yellow/20 text-accent-yellow-fg` strip
- **Label:** `bg-accent-yellow text-accent-yellow-fg` badge reading "Round revealed"
- CTA shifts to "Next round" or "See results" (secondary/ghost variant)

---

## 6. Interaction rules

- **No layout shift on interaction.** Reserve space for error/success messages with `min-h` or always-rendered (conditionally hidden) slots.
- **Instant feedback.** Button goes into `pending` state (label change + disabled) on the same frame as the click — no delay before visual response.
- **No hidden actions.** Every action available to the user is visible. Nothing behind hover-only reveals or context menus.
- **No excessive animation.** Transitions only on: opacity changes (0→1 fades), and `transition-colors` on hover states. Duration: 150ms max. No bouncing, no sliding panels.
- **Error messages are inline.** Errors appear adjacent to the element that triggered them, not as toast notifications.
- **Destructive actions are two-step.** Any irreversible action (leave group, etc.) requires an explicit confirm step — not a modal, but an inline confirm/cancel pair.

---

## 7. Implementation order (phased)

To keep PRs small:

1. **Sprint 1 (this task):** Define tokens in `globals.css`, update `@theme`. No component changes yet.
2. **Sprint 2:** Apply to `SiteHeader` + home page (`/`). Update `app/page.tsx` with proper landing copy.
3. **Sprint 3:** Apply to `/account` page (groups, games history, display name form).
4. **Sprint 4:** Apply to `/play` (game state cards — biggest visual impact, most complex).
5. **Sprint 5:** Apply to `/results`.
6. **Sprint 6:** Login/signup forms.
