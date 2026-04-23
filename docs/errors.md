# Server action errors (canonical)

Actions return a discriminated result `{ ok: true, ... } | { ok: false, code, message }`. Prefer stable `code` values for UI and tests.

## Auth

| code              | When |
|-------------------|------|
| `unauthorized`    | No Supabase session / user. |

## Groups

| code               | When |
|--------------------|------|
| `invalid_invite`   | No group for normalized invite code. |
| `already_member`   | `joinGroup` when already in `group_members`. |
| `group_full`       | Group already has 6 members. |

## Games

| code                    | When |
|-------------------------|------|
| `not_group_member`      | Caller not in `group_members` for the game's group. |
| `not_game_member`       | Caller not in `game_members` for this game. |
| `active_game_exists`    | Another `pending`/`active` game exists for the group. |
| `not_host`              | Caller is not `games.host_id`. |
| `game_not_found`        | Invalid `gameId`. |
| `game_completed`        | Game is already `completed`. |
| `game_already_started`  | `updateGameMaxRounds` called after the first round has started (`current_round > 0`). |
| `max_rounds_below_player_count` | `updateGameMaxRounds` value is less than the number of players in the game. |
| `invalid_max_rounds`    | `updateGameMaxRounds` value outside 1–500. |

## Rounds / album

| code                      | When |
|---------------------------|------|
| `no_round_awaiting_album` | `submitAlbum` when no open `awaiting_album` round. |
| `not_your_turn`           | Caller is not `rounds.created_by`. |
| `round_wrong_status`      | Album submitted when round not `awaiting_album`, etc. |
| `duplicate_album`         | Unique index on normalized album per game violated. |
| `invalid_album_url`       | Album link is present but not a valid absolute `http://` / `https://` URL. |

## Reviews

| code                 | When |
|----------------------|------|
| `cannot_self_review` | Reviewer is the round submitter or trigger blocked. |
| `review_exists`      | `UNIQUE (round_id, user_id)` violation. |
| `invalid_rating`     | Outside 1.0–10.0 or wrong precision. |
| `round_not_reviewable` | Round not `awaiting_reviews`. |

## Generic

| code          | When |
|---------------|------|
| `db_error`    | Unexpected Supabase / Postgres error. User sees a generic message; raw details stay in server logs. |
| `invalid_input` | Missing or empty required fields (e.g. group name, album fields). |
| `invite_collision` | Rare: could not generate a unique 6-character code after retries. |
| `duplicate_key` | Unique constraint violated (non-review, non-album cases). |

## Rounds (host)

| code                 | When |
|----------------------|------|
| `album_not_submitted`| Host tried `startNextRound` while the latest round is still `awaiting_album`. |
| `empty_roster`       | `game_members` is empty (should not happen for a properly created game). |
