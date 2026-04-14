-- Dev / QA only: remove all Mania app data and all auth users for a clean retest.
-- Run against your Supabase project (SQL Editor) or:
--   npx supabase db query --linked --agent=no -f scripts/wipe-all-for-testing.sql
--
-- Afterward, sign up again from /signup.

begin;

truncate table
  public.reviews,
  public.rounds,
  public.game_members,
  public.games,
  public.group_members,
  public.groups,
  public.profiles
restart identity cascade;

delete from auth.users;

commit;
