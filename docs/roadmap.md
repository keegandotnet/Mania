# Roadmap

## Phase 1 (current) — Core gameplay

- ✅ Groups with invite codes (max 6 players)
- ✅ Turn-based album submission
- ✅ Ratings (1–10) + written reviews (multiline)
- ✅ Auto-reveal after last review; host can force-advance
- ✅ Round limit with per-player minimum; locked after first round
- ✅ Auto-advance option between rounds
- ✅ Per-round results with color-coded scores
- ✅ Auto-navigate to Results after each round
- ✅ Email-based player identification
- ✅ Display names / user profiles
- ✅ Group management on /account (leave group, view invite codes)
- 🔲 Export / share-friendly results summary

## Phase 2 — UI overhaul

Design system defined in `docs/design.md`. Shipping in small sprints:

- ✅ Design tokens defined (`globals.css`, `docs/design.md`)
- 🔲 Sprint 2: SiteHeader polish + landing page (`/`) with real product copy
- 🔲 Sprint 3: `/account` page — groups + games sections
- 🔲 Sprint 4: `/play` — game state cards (your turn / waiting / submitted / revealed)
- 🔲 Sprint 5: `/results` — round cards, score display
- 🔲 Sprint 6: Login / signup forms

## Phase 2.5 — Landing page

A public-facing `/` that explains what Mania is, with clear CTAs (sign up / sign in). Needed before sharing with new players.

- Headline + one-sentence description
- "How it works" — 3-step explainer (create group → pick albums → rate & review)
- Social proof / empty state if no active games
- Sign up CTA (primary orange button)

## Phase 3 — Spotify integration

- Album search + cover art via Spotify API (server-side proxy; client ID/secret never exposed to browser)
- Automatic album metadata fill on pick submission

## Phase 4 — Analytics

- All-time stats per group (average scores, top pickers, etc.)
- Individual score history

## Phase 5 — Mobile app

- Native mobile experience
