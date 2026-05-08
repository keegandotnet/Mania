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
- ✅ Export / share-friendly results summary

## Phase 2 — UI overhaul (sticker / friendly-brutalist system)

Sticker system defined in `docs/design.md` and implemented via shared primitives in `app/components/ui.tsx`. All product surfaces now share thick borders, hard offset shadows, bold display type, and tone-aware cards/badges/eyebrows.

- ✅ Design tokens defined (`globals.css`, `docs/design.md`)
- ✅ Sprint 2: SiteHeader + landing page (`/`) — sticker hero, screenshot carousel, gamey copy
- ✅ Sprint 3: `/account` page — sticker groups + games sections, leave-group confirm flow
- ✅ Sprint 4: `/play` — sticker `PlayShell` (your turn / waiting / submitted / revealed cards, host controls, setup, picker + review forms)
- ✅ Sprint 5: `/results` — sticker `ResultsView` (round archive, scoreboard, share summary)
- ✅ Sprint 6: Login / signup forms — sticker shells with shared `inputClass` + `primaryButtonLgClass`

## Phase 2.5 — Landing page

A public-facing `/` that explains what Mania is, with clear CTAs (sign up / sign in). Needed before sharing with new players.

- ✅ Mobile-first vertical layout with fewer widgets and a clearer story
- ✅ Gamey visual direction with richer color, layered cards, and tasteful motion
- ✅ Screenshot carousel using placeholder/screenshot-style app panels first
- ✅ "How it works" — 3-step explainer (create group → pick albums → rate & review)
- ✅ Sign up CTA (primary orange button)
- Deferred: replace placeholder panels with authenticated product screenshots when the app surfaces settle.

## Phase 3 — Spotify integration

- Album search + cover art via Spotify API (server-side proxy; client ID/secret never exposed to browser)
- Automatic album metadata fill on pick submission

## Phase 4 — Analytics

- All-time stats per group (average scores, top pickers, etc.)
- Individual score history

## Phase 5 — Mobile app

- Native mobile experience
