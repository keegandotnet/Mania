# Game and round state

## Game status (`games.status`)

| Status     | Meaning |
|-----------|---------|
| `pending` | Game created; no round started yet (`current_round = 0`). Round limit can still be changed. |
| `active`  | At least one round exists; play in progress. Round limit is locked. |
| `completed` | Game ended — round limit reached or host ended the game. |

Transitions:

- `pending` → `active`: when the first round is created (`startNextRound`).
- `active` → `completed`: when `startNextRound` is called and `current_round` would exceed `max_rounds`.

## Round status (`rounds.status`)

| Status             | Meaning |
|--------------------|---------|
| `awaiting_album`  | Round created; designated submitter must call `submitAlbum`. |
| `awaiting_reviews`| Album submitted; non-submitters submit reviews. |
| `revealed`        | Round finished; scores/reviews visible. Players are redirected to `/results`. |

Transitions:

- `awaiting_album` → `awaiting_reviews`: successful `submitAlbum`.
- `awaiting_reviews` → `revealed`: all expected reviews received **or** host advances via `startNextRound` (early advance).
- No transitions backward in MVP.

## Who triggers what

| Action            | Actor |
|-------------------|--------|
| `createGame`      | Any group member (becomes host stored as `host_id`). |
| `startNextRound`  | **Host only.** If the latest round is `awaiting_reviews`, this call reveals it (early advance), then creates the next round. Marks game `completed` if `max_rounds` is reached. |
| `submitAlbum`     | The round's designated submitter (`rounds.created_by`) only. |
| `submitReview`    | Any `game_members` row for that game **except** the round submitter. |
| `updateGameMaxRounds` | **Host only.** Only while `current_round = 0` (before first round). Min = player count. |
| `updateGameAutoAdvance` | **Host only.** Can be toggled at any time while the game is active. |

## Turn order

- Order is fixed at `createGame` by snapshotting `group_members.player_order` into `game_members.player_order`.
- Round *n* submitter = `game_members` ordered by `player_order`, index `(n - 1) % member_count`.
