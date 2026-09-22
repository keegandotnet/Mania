# Authentication

## Identity source

Supabase Auth (`auth.users`). Application tables reference `auth.users.id` as `user_id`, `created_by`, or `host_id`.

## Server actions

All gameplay actions require an authenticated user. Resolve the user with `auth.getUser()` on the server using a Supabase client bound to the request cookies (see `lib/supabaseServer.ts`).

## Browser client

`lib/supabaseClient.ts` is for client components only. Server actions must not use it for privileged reads/writes.

## Sessions

Session cookies are managed by Supabase Auth helpers (`@supabase/ssr`). Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` only.

For local development, keep both `http://localhost:3000` and `http://127.0.0.1:3000` in the Supabase redirect allowlist. Hosted environments (for example Vercel) must add their exact production auth callback origins separately.

## Display names

**`profiles.display_name`** (1–80 non-whitespace characters) is required for new gameplay. Legacy empty profiles receive stable `Player N` labels; peer account emails are not returned to Play or Results. Profile values remain readable only to the owner and users who share a group.

New accounts get a **`profiles`** row from an `auth.users` **trigger**; sign-up can pass `display_name` via `raw_user_meta_data` (see `/signup`). Signed-in users can edit their name on **`/account`**.

## Sign-up / sign-in flow

- Users sign up at `/signup` and sign in at `/login`.
- Auth callback is handled at `/auth/callback` (Supabase PKCE exchange).
- Protected routes (`/play`, `/results`, `/account`) redirect to `/login?next=...` if no session.
- The `next` parameter is sanitized before navigation: only root-relative internal paths are allowed after sign-in / callback.
- Public auth entry points are session-aware: when a user is already signed in, `/login` and `/signup` show an active-session card with Continue, Play, Results, and Sign out actions instead of another auth form.
- The global header and landing hero are also session-aware: signed-out users see onboarding CTAs, while signed-in users see in-app destinations.
