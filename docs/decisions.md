# Architecture decisions (MVP)

These choices are fixed for the current backend implementation so multiple agents stay aligned.

1. **One non-completed game per group**  
   At most one `games` row per `group_id` with `status` in (`pending`, `active`), enforced in the database.

2. **Game roster snapshot**  
   `game_members` is populated from `group_members` at `createGame`. Users who join the group **after** the game is created are **not** added to that roster and cannot participate in that game's rounds.

3. **Turn order**  
   Deterministic `player_order` on `group_members` at join time; copied to `game_members` at game creation.

4. **Album uniqueness**  
   Unique per **game** on normalized `lower(trim(album_name))` and `lower(trim(artist_name))` once both are set.

5. **Invite codes**  
   **Six characters** end to end (DB check + generator). Use a **small, unambiguous uppercase alphabet** (letters/digits that are easy to read aloud—no fancy encoding, checksums, or variable length). Stored uppercase; joins normalize input to uppercase. Codes are unique at the database. Implementation: [`lib/mania/invite.ts`](../lib/mania/invite.ts).

6. **Round limit (max_rounds)**  
   Host sets `max_rounds` before the first round starts. Minimum is the number of players in the game (so every player gets at least one pick). The limit is **locked** once `games.current_round > 0`. Games are marked `completed` automatically when the round limit is reached (via `start_next_round`). Auto-advance can also be enabled so rounds start automatically after the last review.

7. **Reviews are immutable**  
   No `UPDATE` on `reviews` after insert (database enforced).

8. **Self-review**  
   Blocked in application logic and with a database trigger (`reviews.user_id` ≠ `rounds.created_by` for that round).

9. **Round completion**  
   Auto-`revealed` when every non-submitter `game_member` has submitted a review; host can force `revealed` by calling `startNextRound` while the round is `awaiting_reviews`.

10. **RLS**  
   The first schema migration ships with RLS off; `20250328210000_enable_rls.sql` turns it on with member-scoped reads. **Joins** still go through `join_group_by_invite` so non-members cannot probe `groups` by arbitrary id (see [security.md](./security.md)).

11. **Display names**  
   Players are identified by their **auth email address**, resolved via the `get_game_member_emails` security-definer RPC (which joins `auth.users` server-side). A dedicated `profiles` table with display names is a planned follow-up.

12. **Auto-navigate to results**  
   When a round becomes `revealed` while a player is on `/play`, the client automatically navigates to `/results`. If a player navigates to `/play` while the latest round is already `revealed`, the server redirects them to `/results`.

13. **Host control panel visibility**  
   The "Round control" panel (round limit, auto-advance, Start round) is **only shown** when the game is not mid-round (`round` is `null` or `round.status === "revealed"`). It is hidden during `awaiting_album` and `awaiting_reviews` to reduce noise.
