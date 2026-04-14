# Game and round state

## Game status (`games.status`)

| Status     | Meaning |
|-----------|---------|
| `pending` | Game created; no round started yet (`current_round = 0`). Round limit can still be changed. |
| `active`  | At least one round exists; play in progress. Round limit is locked. |
| `completed` | Game ended — final round revealed with `round_number >= max_rounds`. |

Transitions:

- `pending` → `active`: when the first round is created (`startNextRound`).
- `active` → `completed`: when the **last required review** on the **final** round is submitted (`submit_review` reveals that round, then sets the game to `completed` if `round_number >= max_rounds`). Starting a new round beyond the limit is rejected by `start_next_round` instead of completing the game.

## Round status (`rounds.status`)

| Status             | Meaning |
|--------------------|---------|
| `awaiting_album`  | Round created; designated submitter must call `submitAlbum`. |
| `awaiting_reviews`| Album submitted; non-submitters submit reviews. |
| `revealed`        | Round finished; scores/reviews visible. Clients often open `/results` after reveal (not a server redirect from `/play`). |

Transitions:

- `awaiting_album` → `awaiting_reviews`: successful `submitAlbum`.
- `awaiting_reviews` → `revealed`: all expected reviews received **or** host advances via `startNextRound` (early advance).
- No transitions backward in MVP.

## Who triggers what

| Action            | Actor |
|-------------------|--------|
| `createGame`      | Any group member (becomes host stored as `host_id`). |
| `startNextRound`  | **Host only.** If the latest round is `awaiting_reviews`, this call reveals it (early advance), then creates the next round. Errors if the next round would exceed `max_rounds`. |
| `submitAlbum`     | The round's designated submitter (`rounds.created_by`) only. |
| `submitReview`    | Any `game_members` row for that game **except** the round submitter. On the **final** round, the last required review reveals the round and may set the game to `completed` when `round_number >= max_rounds`. |
| `updateGameMaxRounds` | **Host only.** Only while `current_round = 0` (before first round). Min = player count. |
| `updateGameAutoAdvance` | **Host only.** Can be toggled at any time while the game is active. |

## Turn order

- Order is fixed at `createGame` by snapshotting `group_members.player_order` into `game_members.player_order`.
- Round *n* submitter = `game_members` ordered by `player_order`, index `(n - 1) % member_count`.
