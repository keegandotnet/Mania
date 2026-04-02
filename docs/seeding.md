# Seeding and dummy data

## Goals

- Local and preview environments need predictable users and games **without** polluting production.

## Rules

- **Never** run destructive or bulk seed scripts against production by default.
- **Never** commit service-role keys or real user passwords.
- **Do** create test users through Supabase Auth (dashboard or Auth API) in dev, then insert app rows referencing those `user_id` values.
- **Do** document seed ordering: groups → memberships → games → `game_members` → rounds → reviews.

## Suggested dev flow (future)

1. Create 2–6 test users in the Supabase project (Auth).
2. Use server actions or SQL to create a group, join flows, a game, and a few rounds.
3. Optionally add a `npm run seed:dev` that runs only when `NODE_ENV === 'development'` and `SEED_ENABLED=true`.

## IDs

- App tables must use real `auth.users.id` values. Do not invent random UUIDs for `user_id` unless they exist in Auth.
