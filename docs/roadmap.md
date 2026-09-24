# Roadmap

## Current priority - Approved UI overhaul

**Design approved September 24, 2026. Implementation is next and has not started.**

The canonical implementation specification is [UI Overhaul](../UI%20Overhaul.md), with the [approved 12-page visual proposal](../output/pdf/Mania%20UI%20Redesign%20Proposal.pdf). The next agent should implement that complete handoff, preserving the existing game rules, authentication, external listening and server permissions.

- [x] Audit current routes, actions, state/role behavior and sources of Play overload.
- [x] Produce and visually validate the 12-page proposal, including phone/desktop mockups and edge-state guidance.
- [x] User review and approval of the design direction.
- [x] Package the implementation instructions, action inventory and acceptance criteria in one handoff.
- [ ] Shared visual primitives: Geist and existing colors, quieter surfaces, restrained sticker shadows, artwork emphasis and plain copy.
- [ ] Navigation: compact group switcher, remembered valid selection, scoped links/auth returns and a secondary Group destination.
- [ ] Play: picking, reviewing, submitted, picker waiting, awaiting album, revealed and completed states; persistent artwork/listening after submission.
- [ ] Group/host controls: roster/invites/setup, locked round limit, auto-advance and accurate early-close confirmation with existing permissions.
- [ ] Public/returning homepages: prominent Start/Resume record, immediate current-group next action, reduced-motion behavior.
- [ ] Results: latest album score and friends' reviews first; earlier rounds, standings, statistics and copied summaries remain available.
- [ ] Supporting flows: account settings, all game history, auth recovery, late joiners and safe leave-group behavior.
- [ ] Validate the full lifecycle, role restrictions, selected-group continuity, narrow phones, long content, failures, keyboard access and light/dark contrast.
- [ ] Update design/UX/testing documentation and record implementation evidence before marking the overhaul shipped.

Implementation checkpoints are one coherent approved product vertical, not separate proposals. Manual refresh remains the baseline. Automatic polling, cross-visit drafts, new public APIs, playback, analytics and backend rule changes are not included. Verify aggregate review progress under RLS without exposing hidden reviews; disclose any contract gap rather than fabricating totals.

Historical phases below record completed work. Their thick-panel styling and marketing-copy choices are superseded by the approved overhaul where they conflict; their functionality remains supported.

## Phase 1 — Core gameplay baseline

- ✅ Groups with invite codes (max 6 players)
- ✅ Turn-based album submission
- ✅ Ratings (1–10) + written reviews (multiline)
- ✅ Auto-reveal after last review; host can force-advance
- ✅ Round limit with per-player minimum; locked after first round
- ✅ Auto-advance option between rounds
- ✅ Per-round results with color-coded scores
- ✅ Client results navigation after detected reveal; manual refresh remains available (not automatic synchronization across every client)
- ✅ Account identity with safe player-label fallbacks
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
- ✅ Screenshot carousel using sanitized product-state panels modeled on `/play`, `/results`, and `/account`
- ✅ "How it works" — 3-step explainer (create group → pick albums → rate & review)
- ✅ Sign up CTA (primary orange button)
- ✅ Landing page overhaul: clearer "book club for albums" story, current-app game loop copy, and auth-aware top/bottom CTAs.
- Screenshot capture note: real authenticated product screenshots still require a safe local data set and screenshot tooling; until then, public landing panels must avoid private emails and invite codes.

## Phase 3 — Spotify integration

- ✅ Server-side Spotify Client Credentials catalog search (no user OAuth)
- ✅ Album autocomplete on `/play` picker form with debounced suggestions
- ✅ Persisted cover art + Spotify album id on rounds; rendered on `/play` and `/results`
- ✅ Manual album entry fallback when Spotify is unconfigured or unavailable

## Phase 3.5 — Auth/session polish

- ✅ Auth-aware navigation and entry CTAs so logged-in users do not see inappropriate Log In / Sign Up prompts, while signed-out users keep clear onboarding paths.

## Phase 3.6 — Product screenshots + Play simplification

**Superseded by the approved UI overhaul above.** The new scope includes navigation, all gameplay states, public/returning homepages, Results, Group and Account support.

- The simpler approved public homepage does not require the old screenshot carousel. If screenshots are retained, capture sanitized examples of the redesigned product after implementation.
- Preserve the original aim: make the next action obvious and reduce navigation hunting and visual overload on Play.

## Phase 4 — Analytics

- All-time stats per group (average scores, top pickers, etc.)
- Individual score history

## Phase 5 — Mobile app

- Native mobile experience
