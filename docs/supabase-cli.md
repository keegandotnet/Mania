# Supabase CLI (Mania)

The [Supabase CLI](https://supabase.com/docs/guides/cli) is a dev dependency. Use it from the repo root.

## Prerequisites

- Install Docker if you use a **local** stack (`supabase start`). Remote-only workflows only need the CLI binary (via `npm exec supabase` / `npx supabase`).

## Link to the hosted project

Link this repo to the same Supabase project as in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`):

```bash
npm run db:link
```

You will need your project ref and database password when prompted. Linking writes `supabase/.temp/project-ref` (ignored by git) and related metadata.

## Apply migrations

After linking, push pending SQL migrations to the remote database:

```bash
npm run db:push
```

For a fully local database, use `supabase start` then `supabase db reset` (applies `supabase/migrations/*.sql` in order).

## Types (optional)

With a linked project:

```bash
npm run db:types
```

Writes `lib/database.types.ts` (add to version control only if the team wants shared generated types).

## Secrets

Keep **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` for this milestone. Do not commit `.env.local`. Database passwords and service role keys must never ship to the client.
