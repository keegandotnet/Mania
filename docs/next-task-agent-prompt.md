# Agent task: Share-friendly Results summary foundation

Per [`.cursor/rules/NEXT-AGENT-TASK.mdc`](../.cursor/rules/NEXT-AGENT-TASK.mdc): when you complete a task, post the **next-agent copy-paste prompt** and a **3–5 word title** for the work you just did **in the agent chat**, not in this file. Update this document only with the **substantive task** the next agent should execute after open work is finished.

---

## Context (2026-05-06)

- Phase 2 UI overhaul is complete: `/`, SiteHeader, `/play`, `/account`, `/results`, `/login`, and `/signup` are all on the shared design tokens in `app/globals.css` and `docs/design.md`.
- `/results` now supports historical games via `getGameResults(gameId?: string)` and `/results?game=<uuid>`. `/account` links active/completed games to those scoped result pages.
- `GameResultsData` already contains everything needed to build a text summary: group name, game status/current round/max rounds, roster with display names, revealed rounds, album/artist/url, picker, ratings, and review text.
- Roadmap Phase 4 includes "Export / share-friendly results summary (per round or per game)." The user chose this as the next vertical and asked to prioritize reusable foundation over maximum UI scope.

---

## Goal (one vertical)

Ship a **share-friendly text summary** on `/results` with a reusable formatter foundation:

1. Add a pure, tested formatter (suggested: `lib/mania/resultsSummary.ts`) that accepts `GameResultsData` and returns a deterministic plain-text summary suitable for pasting into chat.
2. Render a small "Share summary" card/control on `/results` when there is at least one revealed round. The control should copy the formatter output to the clipboard and show immediate success/error feedback.
3. Keep the first UI slice narrow: text copy only. Do not add public share URLs, images, PDFs, Open Graph cards, or unauthenticated result pages.
4. Document the summary format and reusable helper/API in `docs/api.md` (or a short docs section if the implementation stays in `lib/` rather than a server action).

The formatter is the foundation. Keep it independent of React and browser APIs so future work can reuse it for server-rendered exports, public links, or native sharing.

---

## Files likely touched

- `lib/mania/resultsSummary.ts` (new pure formatter)
- `lib/mania/resultsSummary.test.ts` or the repo's closest existing test pattern, if test infra exists
- `app/results/ResultsView.tsx`
- `app/components/CopyResultsSummaryButton.tsx` (new client component) or a local client component under `app/results/`
- `docs/api.md`
- `docs/roadmap.md` (mark the Phase 4 share-summary item as started/done if appropriate)

---

## Done criteria

- [ ] `buildResultsShareSummary(data)` (or similarly named helper) is pure, exported, and does not import React, Next.js, Supabase, or browser APIs.
- [ ] Summary output includes group name, game completion/current-round context, per-round album/artist, picker, average score, reviewer scores, and written reviews when present.
- [ ] Output is deterministic and readable in plain text. Prefer stable labels and roster display names via existing `memberLabel` behavior.
- [ ] `/results` shows a token-styled "Share summary" control only when a summary can be meaningful (at least one revealed round).
- [ ] Copy interaction handles success and clipboard failure states without breaking SSR.
- [ ] Historical result pages (`/results?game=<uuid>`) copy the scoped game's summary, not the default latest game.
- [ ] Default `/results` behavior remains unchanged except for the new share control.
- [ ] `docs/api.md` updated with the helper/action contract and example output.
- [ ] `npm run lint` and `npm run build` pass.

## Decisions already made (for future agents)

- **Spotify integration** (Phase 3): server-side proxy only — secrets never in the browser.
- **Share summary scope:** plain-text clipboard export first; no public URLs or image/PDF export in this vertical.
- **Design system:** keep using `rounded-lg border border-border bg-surface p-5 shadow-sm`, semantic text tokens, and primary/secondary button patterns from `docs/design.md`.

## Risks

- Very long written reviews can produce an unwieldy clipboard payload. Do not silently truncate in the foundation unless product copy makes that explicit; a future export format can add "compact" variants.
- Clipboard access only exists in the browser and can fail on insecure contexts or permissions. Keep copy logic in a client component and show a graceful error.
- Average-score formatting should match the Results UI (`x.x`) so users do not see conflicting numbers.
