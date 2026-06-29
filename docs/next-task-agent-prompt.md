# Agent task: Spotify album autocomplete + cover art

Per [`.cursor/rules/NEXT-AGENT-TASK.mdc`](../.cursor/rules/NEXT-AGENT-TASK.mdc): when you complete a task, post the **next-agent copy-paste prompt** and a **3–5 word title** for the work you just did **in the agent chat**, not in this file. Update this document only with the **substantive task** the next agent should execute after open work is finished.

---

## Context (2026-06-29)

- Core gameplay is usable and Phase 1 now includes a share-friendly Results summary foundation on `/results`.
- Phase 2 sticker UI and the gamey mobile landing-page refresh are complete in code and marked complete in `docs/roadmap.md`.
- The next product vertical is Spotify catalog search for the album picker. This is **not** "Login with Spotify"; Mania only needs app-level Spotify Web API access to search albums/tracks and autofill album metadata.
- The user will add Spotify credentials locally before starting implementation:
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
  - optional `SPOTIFY_MARKET` (default to `US` if unset)
- Keep Spotify credentials and access tokens server-only. Do not expose the client secret, bearer tokens, or raw credential values in committed docs, browser code, or logs.
- The user prefers a cleaner MVP with persisted cover art, so this task may include database/backend changes.

---

## Goal (one vertical)

Ship Spotify-backed album suggestions in the album submission flow, with selected metadata persisted and rendered across the game:

1. Add a server-only Spotify catalog client using Client Credentials.
2. Add a narrow Mania search API/server action that returns normalized album suggestions for a user query.
3. Update the album selection UI on `/play` so the album/artist input can suggest albums as the user types.
4. When a user selects a suggestion, autofill album title, artist, Spotify URL, and cover art.
5. Persist enough Spotify metadata to show cover art consistently in `/play` and `/results`.
6. Preserve manual entry as a fallback when credentials are missing, Spotify is unavailable, or a desired album is not found.
7. Update docs and tests for the new API/schema/UI behavior.

This is a **product vertical** with backend support. Do not implement Spotify OAuth/user login, playlist access, playback control, or personal library features.

---

## Files likely touched

- `app/actions/mania.ts` or a narrow `app/api/spotify/search/route.ts` endpoint
- `app/play/` and/or the album submission components used by `PlayShell`
- `app/results/` / results rendering components if cover art is displayed there
- `lib/mania/` for normalized Spotify types/client helpers
- `supabase/migrations/` for persisted metadata fields
- `lib/database.types.ts` after regenerating Supabase types, if linked env is available
- `docs/api.md`
- `docs/schema.md`
- `docs/database.md`
- `docs/roadmap.md`
- `docs/testing.md` if test instructions change

---

## Done criteria

- [ ] Spotify credentials are read only from server-side env vars. No secret/token appears in client bundles, committed files, docs examples with real values, or browser responses.
- [ ] Missing Spotify env vars degrade gracefully: manual album entry still works and the UI does not crash.
- [ ] Search is debounced client-side and returns a small suggestion list suitable for mobile.
- [ ] Search can find albums directly. Prefer album suggestions first; optionally include track search only if it maps cleanly to albums without excessive requests.
- [ ] Suggestions show useful metadata: album title, artist(s), release year/date, thumbnail cover art, and Spotify URL.
- [ ] Selecting a suggestion fills the existing album submission fields and includes cover-art metadata in the submitted round.
- [ ] Database/schema supports persisted cover art and Spotify metadata for rounds. Recommended fields on `rounds`: `spotify_album_id`, `album_cover_url`, and `spotify_url` if the existing `album_url` remains user-editable/generic.
- [ ] `/play` renders persisted cover art for current/revealed rounds when available, with a clean fallback for manual entries.
- [ ] `/results` renders persisted cover art in the round archive/share-adjacent UI when available. Plain-text share summaries may include the Spotify/listen URL but should not include image URLs unless that is already a local pattern.
- [ ] RLS remains intact; migrations do not broaden access beyond existing round/game visibility.
- [ ] `docs/api.md`, `docs/schema.md`, `docs/database.md`, and `docs/roadmap.md` describe the new fields/API behavior.
- [ ] `npm run lint` and `npm run build` pass.

## Decisions already made (for future agents)

- **Spotify integration** (Phase 3): server-side proxy/API only — secrets and bearer tokens never in the browser.
- **Share summary scope:** plain-text clipboard export first; no public URLs or image/PDF export in this vertical.
- **Landing screenshot scope:** use placeholders/screenshot-style panels now; do not require real captured app screenshots for completion.
- **Carousel:** include a carousel-style presentation for app screenshots/placeholders.
- **Visual scope:** the landing page may break out of the current restrained UI rules, but document the exception and preserve accessibility.
- **Spotify auth scope:** no user OAuth/login with Spotify. Use Client Credentials for catalog search only.
- **Manual fallback:** users must still be able to submit albums manually.
- **Cover art:** persist selected cover art for the MVP and show it in game/results UI.

## Risks

- Spotify Web API access rules changed in 2026. Catalog search is available, but the app owner may need Spotify Premium and search result limits are lower. Keep queries small and avoid assuming large result pages.
- Do not commit `.env.local` or credential values. If sample env docs are added, use placeholder values only.
- Autocomplete can create noisy network traffic. Debounce, cap query length/result count, and handle 429/rate-limit responses gracefully.
- Spotify responses may omit images or markets. Normalize defensively and keep manual/fallback rendering polished.
- If Supabase type generation cannot run because the project is not linked or env is missing, update migrations/docs and note the deferred `lib/database.types.ts` regeneration clearly in the final handoff.
