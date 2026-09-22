begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'host@example.test', '', '{}', '{"display_name":"Host"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'player@example.test', '', '{}', '{"display_name":"Player"}', now(), now());

insert into public.groups (id, name, created_by, invite_code)
values ('20000000-0000-0000-0000-000000000001', 'UAT group', '10000000-0000-0000-0000-000000000001', 'UAT001');
insert into public.group_members (group_id, user_id, player_order)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select throws_ok(
  $$select public.create_game_for_group('20000000-0000-0000-0000-000000000001')$$,
  'P0001', 'not_enough_players', 'single-player games are rejected'
);

reset role;
insert into public.group_members (group_id, user_id, player_order)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1);

set local role authenticated;
select lives_ok(
  $$select public.create_game_for_group('20000000-0000-0000-0000-000000000001')$$,
  'two-player game is created'
);

reset role;
update public.games set max_rounds = 1
where group_id = '20000000-0000-0000-0000-000000000001';

set local role authenticated;
select lives_ok(
  $$select * from public.advance_game((select id from public.games where group_id = '20000000-0000-0000-0000-000000000001'))$$,
  'host starts the first round'
);

reset role;
update public.rounds
set status = 'awaiting_reviews', album_name = 'Album', artist_name = 'Artist'
where game_id = (select id from public.games where group_id = '20000000-0000-0000-0000-000000000001');

set local role authenticated;
select lives_ok(
  $$select * from public.advance_game((select id from public.games where group_id = '20000000-0000-0000-0000-000000000001'))$$,
  'host can force-close the final round'
);

reset role;
select is(
  (select status from public.games where group_id = '20000000-0000-0000-0000-000000000001'),
  'completed', 'final force-close completes the game'
);
select is(
  (select status from public.rounds where game_id = (select id from public.games where group_id = '20000000-0000-0000-0000-000000000001')),
  'revealed', 'final force-close preserves the reveal'
);

select throws_ok(
  $$insert into public.rounds (game_id, created_by, round_number, status, album_name, artist_name)
    values ((select id from public.games limit 1), '10000000-0000-0000-0000-000000000001', 99, 'revealed', repeat('x', 201), 'Artist')$$,
  '23514', null, 'album names are bounded in the database'
);

select * from finish();
rollback;
