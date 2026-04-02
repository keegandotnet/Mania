-- clean-game-data.sql
-- Deletes all game data while keeping auth.users intact.
--
-- Run via Supabase dashboard > SQL editor, or:
--   supabase db remote execute < scripts/clean-game-data.sql
--
-- CASCADE order:
--   reviews       → deleted via rounds cascade
--   rounds        → deleted via games cascade
--   game_members  → deleted via games cascade
--   games         → deleted via groups cascade
--   group_members → deleted via groups cascade
--
-- auth.users is NOT touched.

delete from public.groups;
