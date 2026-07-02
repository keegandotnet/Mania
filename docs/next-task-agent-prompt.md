# Agent task: Real product screenshots and Play UI simplification

Per [`.cursor/rules/NEXT-AGENT-TASK.mdc`](../.cursor/rules/NEXT-AGENT-TASK.mdc): when you complete a task, post the **next-agent copy-paste prompt** and a **3–5 word title** for the work you just did **in the agent chat**, not in this file. Update this document only with the **substantive task** the next agent should execute after open work is finished.

---

## Context (2026-07-02)

- Core gameplay, sticker UI, results sharing, account/group management, Spotify album autocomplete with persisted cover art, and auth-aware navigation/entry CTAs are implemented.
- The landing page still uses placeholder/screenshot-style app panels. The user wants those replaced with real screenshots from the current product.
- The user also wants `/play` simplified. Current feedback: the Play UI feels busy and makes it hard to manage navigation / find the next play action.
- Desired direction: simple, gamey, and fun. The page should not feel like a hunt for the "play" button.

---

## Goal (one vertical)

Replace landing placeholder panels with real product screenshots and simplify `/play` around an obvious primary action:

1. Create real product screenshots from the current app, preferably covering Play, Results, and Account/group management states.
2. Replace landing placeholder panels/carousel content with those real screenshots or screenshot-backed panels.
3. Audit `app/play` and `app/play/PlayShell.tsx` for visual hierarchy problems, duplicated actions, and hard-to-find next steps.
4. Redesign `/play` so the player's immediate next action is prominent for each state: create/join group, create game, start round, submit album, submit review, wait, view reveal, or game over.
5. Preserve the sticker/friendly-brutalist design language, Spotify autocomplete behavior, host controls, auto-advance, round-limit rules, and protected-route auth behavior.
6. Update `docs/roadmap.md`, `docs/testing.md`, and `docs/ux.md` or `docs/design.md` with the new Play/screenshot expectations.

Do not add analytics, public share links, new auth providers, new database schema, or broad navigation/product-scope changes in this task unless required by the Play simplification.

---

## Files likely touched

- `app/page.tsx`
- `app/components/LandingScreenshotCarousel.tsx`
- `app/play/page.tsx`
- `app/play/PlayShell.tsx`
- `app/play/*` form/control components
- screenshot assets under `public/` if committed as static images
- `app/results/page.tsx`
- `docs/roadmap.md`
- `docs/testing.md`
- `docs/ux.md`
- `docs/design.md`

---

## Done criteria

- [ ] Landing page no longer relies on placeholder/synthetic app panels when real product screenshots are available.
- [ ] Screenshots are reproducible or documented enough that future agents can regenerate them.
- [ ] `/play` has one obvious primary action for each major game state.
- [ ] Secondary navigation/actions are still available but visually subordinate.
- [ ] Spotify autocomplete, manual album fallback, review submission, host controls, and reveal/game-over states still work.
- [ ] Mobile layout stays easy to scan and does not hide the primary action below excessive chrome.
- [ ] Docs and manual testing checklist cover screenshot replacement and simplified Play flows.
- [ ] `npm run lint` and `npm run build` pass.

## Decisions already made (for future agents)

- **Screenshot ownership:** it is okay for the agent to create screenshots if the app can be run locally with available env/test data; otherwise document the exact missing data/env blocker and use the best static product panels possible.
- **Play hierarchy:** optimize around the user asking "what do I do now?" before exposing supporting details.
- **Visual consistency:** keep the existing sticker UI primitives, colors, borders, hard shadows, and playful tone.
- **Scope control:** this is not the analytics phase; do not build stats dashboards as part of the Play cleanup.

## Risks

- Real screenshots may require representative seed data, hosted Supabase credentials, or a local Supabase reset before capture.
- Simplifying `/play` can accidentally hide host-only controls or less common states; preserve access while changing hierarchy.
- Avoid screenshots that embed private user emails, invite codes, or other sensitive live data.
