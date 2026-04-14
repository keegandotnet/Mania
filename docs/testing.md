# Testing checklist (for later agents)

## Automated: RLS + RPC smoke test

Run the smoke script to exercise the full game flow (two users, group, game, round, review) and assert RPC shapes:

```
node --env-file=.env.local scripts/rls-smoke.mjs
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. For hosted projects where signUp is rate-limited, set `SUPABASE_SERVICE_ROLE_KEY` (never commit) to provision users via the admin API, or supply `RLS_SMOKE_EMAIL_A` / `RLS_SMOKE_PASSWORD_A` / `RLS_SMOKE_EMAIL_B` / `RLS_SMOKE_PASSWORD_B` for existing test accounts.

The script now also asserts:
- **`get_game_member_emails`**: returns rows with `user_id`, `email`, and `display_name` (nullable) for each game member.
- **`get_group_member_profiles`**: returns group rows ordered by `player_order` ascending.

---

## Manual UI checklist

Scenarios that must stay green as the codebase grows:

## Manual UI (Play / Results)

- [ ] **`/account` "Your games" section**: signed-in user sees a list of games they have played in, ordered newest first, with group name, round progress (`Round X of Y` or `Not started`), creation date, and a status badge (`Pending` / `Active` / `Completed`). Empty state ("No games yet…") shown when the user has no game history.
- [ ] **`/results`** (signed in, in a group with a game): after at least one round is **`revealed`**, scores and reviews show — album title, artist, average score (colored badge), per-player ratings with visual bars, and review text. Empty states when there is no group, no game, or no revealed rounds yet.
- [ ] **Player display names:** roster labels prefer **`profiles.display_name`**, falling back to email when unset. Verify on Play (inline revealed results, group roster), Results, and after editing on `/account`.
- [ ] **"Top pick" badge** appears on the highest-average round when ≥ 2 rounds are revealed.
- [ ] **Auto-navigate to `/results`:** after submitting the last review (round reveals), the browser navigates to `/results` automatically. Same behavior when a non-reviewer's Refresh detects a newly-revealed round.
- [ ] **`/play` with revealed round:** page stays on Play (no server redirect to `/results`); per-round results card and nav link to Results remain available. Client may still navigate to `/results` after submitting the last review or on Refresh when a round becomes revealed.
- [ ] **Multiline reviews:** submit a review with **newlines**; confirm they **persist** and **render** on Play and Results (`whitespace-pre-wrap` / wrapping as implemented).
- [ ] **Long review text:** no **horizontal** layout breakage or overflow in typical viewports on Play and Results.
- [ ] **Host round control panel visibility:** hidden while round is `awaiting_album` or `awaiting_reviews`; visible when no round exists or round is `revealed`.
- [ ] **Round limit locked:** round limit input and Save button are absent once `currentRound > 0`; a read-only display shows the locked value.
- [ ] **Min rounds = player count:** round limit input has `min={playerCount}`; saving a value below player count shows an error.
- [ ] **Completed game:** when `games.status === "completed"`, Play shows a clear **Game over** summary and link to final scores; Results shows a **Game over** banner and full revealed history.
- [ ] **Safari (regular profile) dev caveat:** aggressive caching can make **dev CSS** look stale vs a Private window; use **Empty Caches**, Private Browsing, or disable caches in Web Inspector while developing.

## Group management (Account page)

- [ ] **"Your groups" section**: signed-in user sees all groups they belong to, ordered by most recently joined first. Each row shows group name, joined date, invite code, Copy button, and a Leave button.
- [ ] **Invite code copy**: clicking Copy next to an invite code copies it to clipboard and shows a "Copied!" confirmation for ~2 seconds.
- [ ] **Leave — confirmation flow**: clicking Leave shows an inline confirmation prompt ("Leave `<name>`? Your game history stays intact.") with Confirm and Cancel buttons; Cancel dismisses without leaving.
- [ ] **Leave — success**: confirming leave removes the `group_members` row; the group disappears from the list without a full page reload (router.refresh() re-fetches server data).
- [ ] **Leave last group**: allowed without error; the "Your groups" section shows the empty state ("Not a member of any groups yet…").
- [ ] **Game history preserved after leave**: after leaving a group, previously played games still appear in "Your games" history (game membership is snapshotted in `game_members`).
- [ ] **Footer note**: "Leaving a group does not remove your game history." is visible below the groups list.

## Groups

- [ ] `createGroup` creates uppercase unique `invite_code` and adds creator as first `group_members` row with `player_order = 0`.
- [ ] `joinGroup` rejects duplicate membership, enforces max 6, normalizes invite case.
- [ ] User who joins **after** `createGame` is in `group_members` but **not** in `game_members` and fails game actions.

## Games

- [ ] Only one `pending`/`active` game per group (DB partial unique index).
- [ ] `game_members` snapshot matches `group_members` order at creation time.
- [ ] Default `max_rounds` (10) is ≥ player count for typical 2–6 player groups.

## Round limit

- [ ] `updateGameMaxRounds` rejected if `current_round > 0` (`game_already_started` error).
- [ ] `updateGameMaxRounds` rejected if value < player count (`max_rounds_below_player_count` error).

## Rounds

- [ ] `startNextRound`: host-only; errors if latest round still `awaiting_album`.
- [ ] Host `startNextRound` while `awaiting_reviews` forces `revealed` then creates the next round.
- [ ] Turn order cycles by `player_order` modulo roster size.

## Album

- [ ] `submitAlbum` rejected for non-submitters.
- [ ] Duplicate normalized `(album, artist)` in same game rejected.

## Reviews

- [ ] Self-review rejected by app and trigger.
- [ ] Second review from same user rejected (`UNIQUE (round_id, user_id)`).
- [ ] Rating 1.0–10.0 with one decimal enforced.
- [ ] Last required review auto-reveals round.
- [ ] Reviews cannot be updated (trigger).
