# Authentication

## Identity source

Supabase Auth (`auth.users`). Application tables reference `auth.users.id` as `user_id`, `created_by`, or `host_id`.

## Server actions

All gameplay actions require an authenticated user. Resolve the user with `auth.getUser()` on the server using a Supabase client bound to the request cookies (see `lib/supabaseServer.ts`).

## Browser client

`lib/supabaseClient.ts` is for client components only. Server actions must not use it for privileged reads/writes.

## Sessions

Session cookies are managed by Supabase Auth helpers (`@supabase/ssr`). Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` only.

## Display names (current)

Players are currently identified by their **auth email address**. The `get_game_member_emails` security-definer RPC joins `auth.users` to return emails for all game members — the calling user must be a member of the same game.

## Display names (future)

If custom display names or avatars are needed, add a dedicated `profiles` table keyed by `user_id`. This should be populated at sign-up and surfaced via a `/account` or profile page. See the roadmap in [product.md](./product.md).

## Sign-up / sign-in flow

- Users sign up at `/signup` and sign in at `/login`.
- Auth callback is handled at `/auth/callback` (Supabase PKCE exchange).
- Protected routes (`/play`, `/results`, `/account`) redirect to `/login?next=...` if no session.
