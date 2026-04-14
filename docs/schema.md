# Database Design

## Tables

```
profiles(user_id -> auth.users, display_name, created_at, updated_at)

groups(id, name, created_by, invite_code, created_at)
group_members(id, group_id, user_id, player_order, joined_at)

games(id, group_id, host_id, status, current_round, max_rounds, auto_advance, created_at)

game_members(id, game_id, user_id, player_order)

rounds(id, game_id, created_by, album_name, artist_name, album_url, round_number, status, created_at)

reviews(id, round_id, user_id, rating, review_text, created_at)
```

## Constraints

- Unique `invite_code` per group (6 uppercase alphanumeric characters, no ambiguous chars).
- Unique album per game (normalized `lower(trim(album_name))` + `lower(trim(artist_name))`).
- One review per user per round.
- No self-reviews (trigger: `reviews.user_id` ≠ `rounds.created_by`).
- `games.max_rounds` ≥ 1 and ≤ 500; must also be ≥ number of `game_members` (enforced in `update_game_max_rounds` RPC).
- `max_rounds` can only be changed while `games.current_round = 0` (before the first round starts).
- At most one non-completed (`pending`/`active`) game per group (partial unique index).
- `reviews.rating` between 1.0 and 10.0 (DB check constraint).

## Game status values

| Value | Meaning |
| ----- | ------- |
| `pending` | Game created; no round started yet. |
| `active` | First round started; play in progress. |
| `completed` | Game ended after the final round is revealed and `round_number >= max_rounds`. |

## Round status values

| Value | Meaning |
| ----- | ------- |
| `awaiting_album` | Round created; designated submitter must submit album. |
| `awaiting_reviews` | Album submitted; non-submitters submit reviews. |
| `revealed` | Round finished; scores and reviews visible. |

## Security-definer RPCs

All mutations and sensitive reads go through `SECURITY DEFINER` RPCs. See [security.md](./security.md) for the full list and trust-boundary notes.
