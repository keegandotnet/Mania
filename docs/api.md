# Server actions (`app/actions/mania.ts`)

All exports are **Next.js server actions** (`"use server"`). Every callable action returns a **discriminated union** wrapped in `Promise<ActionResult<T>>` from [`lib/mania/actionResult.ts`](../lib/mania/actionResult.ts):

- **Success:** `{ ok: true, data: T }`
- **Failure:** `{ ok: false, code: string, message: string }` — `code` is a short machine-friendly label (e.g. `unauthorized`, `invalid_input`); `message` is user-facing where shown.

Unless noted, actions require a signed-in user; otherwise they return `unauthorized` / `"Sign in required."`

---

## Read actions (Play + Results + Account)

### `getMyGameState()`

**Parameters:** none.

**Success `data` shape (`MyGameState`):**

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `viewerId` | `string` | `auth` user id. |
| `email` | `string` | Auth email, or `user.id` if no email. |
| `viewerDisplayName` | `string \| null` | `profiles.display_name` for the viewer; UI falls back to `email` when null/empty. |
| `group` | `{ id, name, inviteCode } \| null` | Caller's **most recently joined** group (by `group_members.joined_at` desc). `null` if not in any group. |
| `game` | object \| `null` | Latest game for that group (`games.created_at` desc). `null` if no game. When present: `id`, `status`, `currentRound`, `isHost` (caller is `games.host_id`), `maxRounds`, `autoAdvance`, `playerCount` (number of `game_members` rows). |
| `round` | object \| `null` | Latest round for that game (`round_number` desc). `null` if no round row. When present: `id`, `roundNumber`, `status` (`awaiting_album` \| `awaiting_reviews` \| `revealed`), `albumName`, `artistName`, `albumUrl`, `isPicker` (caller is `rounds.created_by`). |
| `hasReviewed` | `boolean` | If current `round.status === "awaiting_reviews"`, whether the caller already has a `reviews` row for that round; otherwise `false`. |
| `revealedDetail` | `MyGameRevealedDetail \| null` | When the latest round is `revealed`: roster (emails + display names), reviews, picker, and round number for **on-`/play` results**. Otherwise `null`. |
| `groupRoster` | `GroupRosterRow[] \| null` | Members of the current group with join order (`null` when not in a group). |

**`MyGameRevealedDetail`:** `roundNumber`, `pickerId`, `roster` (`GameResultsRosterRow[]`), `reviews` as `{ userId, rating, reviewText }[]` (`reviewText` may be `""`; newlines preserved).

**`GroupRosterRow`:** `userId`, `joinedAt` (ISO string from DB), `playerOrder`, `email`, `displayName` (`null` until set in `profiles`).

**Used by:** `/play` — overall lobby / round / host / reviewer state + group roster list.

**Data access:** RLS-scoped `SELECT` on `group_members`, `groups`, `games`, `game_members`, `rounds`, `reviews`, `profiles` (viewer row). RPCs: `get_group_member_profiles` when in a group; `get_game_member_emails` when a game exists. When round is `revealed`, also loads reviews for the inline results card.

---

### `getGameResults()`

**Parameters:** none.

Resolves **the same "my latest group" + "latest game in that group"** as `getMyGameState` (via `group_members` → `groups` → `games` ordered by `created_at` desc).

**Success `data` shape (`GameResultsData`):**

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `viewerId` | `string` | `auth` user id. |
| `email` | `string` | Same convention as `getMyGameState`. |
| `viewerDisplayName` | `string \| null` | Same as `getMyGameState`. |
| `group` | `{ name, inviteCode } \| null` | Group for results; `null` if not in a group. If there is a group but no game, `group` is still set and `game` / `rounds` are empty. |
| `game` | `{ id, status, currentRound, maxRounds } \| null` | Latest game when present. |
| `roster` | `GameResultsRosterRow[]` | From `game_members`: `userId`, `playerOrder` (0-based), `email`, `displayName` (via `get_game_member_emails`). Sorted by `playerOrder`. |
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

**Data access:** RLS-scoped `SELECT` on `games`, `game_members`, `rounds`, `reviews`, `profiles` (viewer). Calls `get_game_member_emails` RPC to add `email` and `displayName` to roster rows.

---

### `getMyGroups()`

**Parameters:** none.

**Success `data` shape (`GroupMembershipItem[]`):** all groups the caller belongs to, ordered by `group_members.joined_at` descending (newest join first).

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `groupId` | `string` | Group id. |
| `groupName` | `string` | Human-readable group name. |
| `inviteCode` | `string` | Invite code for the group (shareable). |
| `joinedAt` | `string` | ISO 8601 timestamp of when the caller joined (`group_members.joined_at`). |

**Used by:** `/account` — "Your groups" section with inline invite code copy and Leave button.

**Data access:** RLS-scoped `SELECT` on `group_members` joined with `groups(name, invite_code)`. No new migrations or RPCs required.

---

### `getMyGameHistory()`

**Parameters:** none.

**Success `data` shape (`GameHistoryItem[]`):** up to 20 items, ordered by `games.created_at` descending.

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `gameId` | `string` | Game id. |
| `groupId` | `string` | Group the game belongs to. |
| `groupName` | `string` | Human-readable group name. |
| `status` | `string` | `pending` \| `active` \| `completed`. |
| `currentRound` | `number` | `games.current_round` — last started round number; `0` when no rounds yet. |
| `maxRounds` | `number` | `games.max_rounds`. |
| `createdAt` | `string` | ISO 8601 timestamp (`games.created_at`). |

**Used by:** `/account` — "Your games" history section.

**Data access:** `game_members` (caller's rows) → `games` (RLS-scoped `SELECT` to game members) with embedded `groups(name)`. Limit 20.

---

### `updateProfileDisplayName(displayName: string)`

- **Returns:** `{ displayName: string | null }` on success — `null` when cleared (empty / whitespace input).
- **Validation:** trimmed length ≤ 80; otherwise `invalid_input`.
- **Backend:** `profiles` upsert for `auth.uid()` (`display_name`, `updated_at`).

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
| --- | --- |
| `get_game_member_emails(p_game_id)` | Returns `(user_id, email, display_name)` for all `game_members` rows — joins `auth.users` and `profiles`; `SECURITY DEFINER`; only callable by a current game member. |
| `get_group_member_profiles(p_group_id)` | Returns `(user_id, email, display_name, joined_at, player_order)` for the group — same trust model; only callable by a current group member. |
| `is_group_member` / `is_game_member` | Helper functions used internally by RLS policies. |

---

## Type imports (for TS callers)

`MyGameState`, `MyGameRevealedDetail`, `GroupRosterRow`, `GameResultsData`, `GameResultsRosterRow`, `GameResultsRound`, `GameHistoryItem`, and `GroupMembershipItem` are exported from `app/actions/mania.ts` for typing `data` on success branches.
