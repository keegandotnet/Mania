# Authentication

## Identity source

Supabase Auth (`auth.users`). Application tables reference `auth.users.id` as `user_id`, `created_by`, or `host_id`.

## Server actions

All gameplay actions require an authenticated user. Resolve the user with `auth.getUser()` on the server using a Supabase client bound to the request cookies (see `lib/supabaseServer.ts`).

## Browser client

`lib/supabaseClient.ts` is for client components only. Server actions must not use it for privileged reads/writes.

## Sessions

Session cookies are managed by Supabase Auth helpers (`@supabase/ssr`). Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` only.

## Display names

Optional **`profiles.display_name`** (1–80 non-whitespace characters when set) is shown on Play and Results instead of email. If unset, UI falls back to **auth email**. Values are readable only for users who share **at least one group** (RLS), plus each user’s own row; game and group rosters use security-definer RPCs (`get_game_member_emails`, `get_group_member_profiles`) that enforce membership before returning emails or names.

New accounts get a **`profiles`** row from an `auth.users` **trigger**; sign-up can pass `display_name` via `raw_user_meta_data` (see `/signup`). Signed-in users can edit their name on **`/account`**.

## Sign-up / sign-in flow

- Users sign up at `/signup` and sign in at `/login`.
- Auth callback is handled at `/auth/callback` (Supabase PKCE exchange).
- Protected routes (`/play`, `/results`, `/account`) redirect to `/login?next=...` if no session.
