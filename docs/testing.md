# Testing checklist (for later agents)

Scenarios that must stay green as the codebase grows:

## Manual UI (Play / Results)

- [ ] **`/results`** (signed in, in a group with a game): after at least one round is **`revealed`**, scores and reviews show — album title, artist, average score (colored badge), per-player ratings with visual bars, and review text. Empty states when there is no group, no game, or no revealed rounds yet.
- [ ] **Player display names:** all roster labels show the player's email, not "Player N". Verify for both Play (inline revealed results) and Results page.
- [ ] **"Top pick" badge** appears on the highest-average round when ≥ 2 rounds are revealed.
- [ ] **Auto-navigate to `/results`:** after submitting the last review (round reveals), the browser navigates to `/results` automatically. Same behavior when a non-reviewer's Refresh detects a newly-revealed round.
- [ ] **Server redirect:** navigating directly to `/play` when the latest round is `revealed` redirects to `/results`.
- [ ] **Multiline reviews:** submit a review with **newlines**; confirm they **persist** and **render** on Play and Results (`whitespace-pre-wrap` / wrapping as implemented).
- [ ] **Long review text:** no **horizontal** layout breakage or overflow in typical viewports on Play and Results.
- [ ] **Host round control panel visibility:** hidden while round is `awaiting_album` or `awaiting_reviews`; visible when no round exists or round is `revealed`.
- [ ] **Round limit locked:** round limit input and Save button are absent once `currentRound > 0`; a read-only display shows the locked value.
- [ ] **Min rounds = player count:** round limit input has `min={playerCount}`; saving a value below player count shows an error.

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
