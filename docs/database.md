# Database implementation (vs `schema.md` product snapshot)

The product doc [schema.md](./schema.md) describes the conceptual model. The **deployed** schema in `supabase/migrations/` adds:

- **`game_members`** — snapshot of players for a game (`game_id`, `user_id`, `player_order`) so late group joins do not affect an in-progress game.
- **Timestamps** — `created_at` (and `joined_at` on memberships) for auditing.
- **`group_members.player_order`** — join order; copied into `game_members` when a game starts.
- **Partial unique index** on `games` — at most one row per `group_id` where `status` is `pending` or `active`.
- **`games.host_id`** — whoever calls `create_game_for_group` (the account that starts the game). It is **not** tied to who created the group; if you need “group owner” semantics, add a separate field or convention later.
- **Normalized unique album** — unique per `game_id` on `lower(trim(album_name))` and `lower(trim(artist_name))` where both are non-null.
- **Check constraints** — rating between 1.0 and 10.0; valid enums for statuses (via `CHECK` constraints).
- **Triggers** — forbid self-reviews; forbid `UPDATE` on `reviews`.
- **RPC** — `join_group_by_invite(text)` for safe joins when RLS is enabled later.
- **RLS** — Enabled in `20250328210000_enable_rls.sql` with member-scoped `SELECT` policies; writes remain behind `SECURITY DEFINER` RPCs (see [security.md](./security.md)).
- **`games.max_rounds`** — Hard cap on rounds (default 10, allowed range 1–500, enforced in SQL). `current_round` counts toward that cap via `mania_start_next_round_impl` (`max_rounds_reached` when exceeded). The game completes when the final round finishes all reviews and `round_number >= max_rounds`.
- **`games.auto_advance`** — When true and status is `active`, `submit_review` calls `mania_start_next_round_impl` after the last expected review in a round (unless that round was the last). When false, only the host’s `start_next_round` begins the next round after reveal.
- **`mania_start_next_round_impl`** — Shared core used by `start_next_round` (host) and by `submit_review` for auto-advance; not granted to `authenticated` directly.
- **`update_game_max_rounds`** — Host-only; cannot lower below `current_round` or change after `status = 'completed'` (`20250401123000_update_game_max_rounds.sql`).
- **`update_game_auto_advance`** — Host-only; toggles `auto_advance`; blocked when `status = 'completed'` (`20250402120000_update_game_auto_advance.sql`).

Application code and [state-machine.md](./state-machine.md) are authoritative for runtime behavior.
