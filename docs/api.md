# Server actions (`app/actions/mania.ts`)

All exports are **Next.js server actions** (`"use server"`). Every callable action returns a **discriminated union** wrapped in `Promise<ActionResult<T>>` from [`lib/mania/actionResult.ts`](../lib/mania/actionResult.ts):

- **Success:** `{ ok: true, data: T }`
- **Failure:** `{ ok: false, code: string, message: string }` — `code` is a short machine-friendly label (e.g. `unauthorized`, `invalid_input`); `message` is user-facing where shown.

Unless noted, actions require a signed-in user; otherwise they return `unauthorized` / `"Sign in required."`

---

## Read actions (Play + Results)

### `getMyGameState()`

**Parameters:** none.

**Success `data` shape (`MyGameState`):**

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `viewerId` | `string` | `auth` user id (for display-name resolution). |
| `email` | `string` | Auth email, or `user.id` if no email. |
| `group` | `{ id, name, inviteCode } \| null` | Caller's **most recently joined** group (by `group_members.joined_at` desc). `null` if not in any group. |
| `game` | object \| `null` | Latest game for that group (`games.created_at` desc). `null` if no game. When present: `id`, `status`, `currentRound`, `isHost` (caller is `games.host_id`), `maxRounds`, `autoAdvance`, `playerCount` (number of `game_members` rows). |
| `round` | object \| `null` | Latest round for that game (`round_number` desc). `null` if no round row. When present: `id`, `roundNumber`, `status` (`awaiting_album` \| `awaiting_reviews` \| `revealed`), `albumName`, `artistName`, `albumUrl`, `isPicker` (caller is `rounds.created_by`). |
| `hasReviewed` | `boolean` | If current `round.status === "awaiting_reviews"`, whether the caller already has a `reviews` row for that round; otherwise `false`. |
| `revealedDetail` | `MyGameRevealedDetail \| null` | When the latest round is `revealed`: roster (with emails), reviews, picker, and round number for **on-`/play` results**. Otherwise `null`. |

**`MyGameRevealedDetail`:** `roundNumber`, `pickerId`, `roster` (`GameResultsRosterRow[]` with emails), `reviews` as `{ userId, rating, reviewText }[]` (`reviewText` may be `""`; newlines preserved).

**Used by:** `/play` — overall lobby / round / host / reviewer state.

**Data access:** RLS-scoped `SELECT` on `group_members`, `groups`, `games`, `game_members`, `rounds`, `reviews` (no RPC for most fields). When a game exists, calls `get_game_member_emails` RPC to resolve `playerCount` and emails. When round is `revealed`, also loads reviews for the inline results card.

---

### `getGameResults()`

**Parameters:** none.

Resolves **the same "my latest group" + "latest game in that group"** as `getMyGameState` (via `group_members` → `groups` → `games` ordered by `created_at` desc).

**Success `data` shape (`GameResultsData`):**

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `viewerId` | `string` | `auth` user id (for display-name resolution in UI). |
| `email` | `string` | Same convention as `getMyGameState`. |
| `group` | `{ name, inviteCode } \| null` | Group for results; `null` if not in a group. If there is a group but no game, `group` is still set and `game` / `rounds` are empty. |
| `game` | `{ id, status, currentRound, maxRounds } \| null` | Latest game when present. |
| `roster` | `GameResultsRosterRow[]` | From `game_members`: `userId`, `playerOrder` (0-based), **`email`** (from `get_game_member_emails`). Sorted by `playerOrder`. |
| `rounds` | `GameResultsRound[]` | Only rounds with `status === "revealed"`, ordered by `round_number` ascending. |

**`GameResultsRound` per row:**

| Field | Type |
| ----- | ---- |
| `id` | `string` |
| `roundNumber` | `number` |
| `albumName`, `artistName`, `albumUrl` | `string \| null` |
| `pickerId` | `string` (`rounds.created_by`) |
| `reviews` | `{ userId, rating, reviewText }[]` — all reviews for that round the caller can see (`reviewText` may be `""`). |

**Used by:** `/results` — revealed rounds only; empty `rounds` if none revealed yet.

**Data access:** RLS-scoped `SELECT` on `games`, `game_members`, `rounds`, `reviews` (filtered to `revealed`; no dedicated read RPC). Calls `get_game_member_emails` RPC to add email to roster rows.

---

## Group & game lifecycle

### `createGroup(name: string)`

- **Returns:** `{ groupId: string; inviteCode: string }` on success.
- **Validation:** `name.trim()` non-empty; else `invalid_input`.
- **Backend:** RPC `create_group_with_owner` (retries on invite collision).

### `joinGroup(inviteCode: string)`

- **Returns:** `{ groupId: string }` on success.
- **Backend:** RPC `join_group_by_invite`.

### `createGame(groupId: string)`

- **Returns:** `{ gameId: string }` on success.
- **Backend:** RPC `create_game_for_group` (snapshots `group_members` into `game_members`).

---

## Host settings

### `updateGameMaxRounds(gameId: string, maxRounds: number)`

- **Returns:** `{ maxRounds: number }` on success.
- **Validation:** must be an integer; else `invalid_input`. DB additionally enforces `1–500`, `current_round === 0` (locked after first round starts), and `maxRounds >= playerCount` (min one round per player).
- **Backend:** RPC `update_game_max_rounds`.

### `updateGameAutoAdvance(gameId: string, autoAdvance: boolean)`

- **Returns:** `{ autoAdvance: boolean }` on success.
- **Backend:** RPC `update_game_auto_advance`.

---

## Round lifecycle

### `startNextRound(gameId: string)`

- **Returns:** `{ roundId: string }` on success.
- **Backend:** RPC `start_next_round` (reveals current round if `awaiting_reviews`, then creates next round).

### `submitAlbum(gameId, albumName, artistName, albumUrl)`

- **Returns:** `{ roundId: string }` on success.
- **Validation:** trimmed album and artist names required; else `invalid_input`.
- **Backend:** RPC `submit_album` (URL passed through as provided).

### `submitReview(roundId: string, rating: number, reviewText: string)`

- **Returns:** `{ revealed: boolean }` on success — `true` if the round's status is `revealed` after the RPC (e.g. last review triggered reveal).
- **Validation:** `rating` must be finite; else `invalid_rating`.
- **Backend:** RPC `submit_review`; then a follow-up `SELECT` on `rounds.status` for the returned `revealed` flag.

---

## DB-only RPCs (not exposed as server actions)

| RPC | Purpose |
| --- | ------- |
| `get_game_member_emails(p_game_id)` | Returns `(user_id, email)` for all `game_members` rows — `SECURITY DEFINER` to read `auth.users`; only callable by a current game member. |
| `is_group_member` / `is_game_member` | Helper functions used internally by RLS policies. |

---

## Type imports (for TS callers)

`MyGameState`, `MyGameRevealedDetail`, `GameResultsData`, `GameResultsRosterRow`, and `GameResultsRound` are exported from `app/actions/mania.ts` for typing `data` on success branches.
