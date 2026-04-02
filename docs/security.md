# Security notes (MVP backend)

## Secrets

- Keep **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` for this milestone.
- Do **not** paste keys into docs, tickets, or client-side bundles beyond the public anon key.
- Service role keys belong in **server-only** env vars and are **not** used by current server actions; the app relies on the anon key plus the user JWT.

## Supabase CLI

- See [supabase-cli.md](./supabase-cli.md) for linking the repo, applying migrations (`db push`), and keeping secrets out of git.

## Sessions (Next.js)

- Next.js **16** refreshes Supabase cookies in root `proxy.ts` (the file convention formerly named `middleware`). Matcher skips static assets and `_next/*`; see comments in `proxy.ts`.

## Row Level Security (RLS)

- Migration `20250328210000_enable_rls.sql` enables RLS on `groups`, `group_members`, `games`, `game_members`, `rounds`, and `reviews`.
- Migration `20250328220000_fix_rls_member_recursion.sql` adds `is_group_member` / `is_game_member` (`SECURITY DEFINER`) so policies on `group_members` and `game_members` can check membership without self-referential `EXISTS` (Postgres would otherwise raise "infinite recursion detected in policy").
- **SELECT** is allowed only when `auth.uid()` is a member of the relevant group or game. **Direct INSERT/UPDATE/DELETE** on these tables has no broad policies; app mutations go through vetted RPCs.
- **Join-by-invite**: users who are not yet members cannot freely list `groups`; they still join through `join_group_by_invite`, which is `SECURITY DEFINER`, validates the invite, and inserts membership under `auth.uid()`.
- **Results read path:** `getGameResults` loads `rounds` (status `revealed` only) and `reviews` with plain `SELECT` under the session JWT. Access is RLS-scoped to game members.
- **Email read path:** emails are read via the `get_game_member_emails` security-definer RPC (migration `20250402140000_email_and_min_rounds.sql`), which joins `auth.users`. The function first checks that `auth.uid()` is a member of the game before returning any emails.

## SECURITY DEFINER RPCs (trust boundary)

Each RPC uses `security definer` with `search_path = public`, revokes `PUBLIC`, and grants `EXECUTE` to `authenticated` only. All functions assert `auth.uid()` is set where required and enforce membership / host / turn rules before writing.

| Function | Role |
| -------- | ---- |
| `create_group_with_owner` | Creates `groups` + owner row in `group_members` for caller only. |
| `join_group_by_invite` | Resolves invite, caps roster at 6, inserts caller into `group_members`. |
| `create_game_for_group` | Caller must be group member; snapshots roster into `game_members`. |
| `update_game_max_rounds` | Host-only; blocked after first round starts; enforces min = player count. |
| `update_game_auto_advance` | Host-only auto-advance flag update. |
| `start_next_round` | Caller must be host; locks and advances round state; marks game completed at limit. |
| `submit_album` | Caller must be active round submitter. |
| `submit_review` | Caller must be non-submitter game member; rating bounds enforced. |
| `get_game_member_emails` | Returns `(user_id, email)` for all game members; caller must be a member. |

## User deletion

- Foreign keys reference `auth.users`. Deleting a user in Supabase Auth may cascade or restrict depending on FK options. For production, prefer soft-delete or account deactivation instead of hard-deleting users with history.

## Invite codes

- Treat invite codes as **secrets** for the group; rate-limit joins in production if abuse appears.
