-- UAT readiness: close lifecycle dead ends, protect frozen rosters, and bound text.

alter table public.groups
  add constraint groups_name_length check (
    char_length(btrim(name)) between 1 and 80
  ) not valid;

alter table public.rounds
  add constraint rounds_album_name_length check (
    album_name is null or char_length(btrim(album_name)) between 1 and 200
  ) not valid,
  add constraint rounds_artist_name_length check (
    artist_name is null or char_length(btrim(artist_name)) between 1 and 200
  ) not valid;

alter table public.reviews
  add constraint reviews_text_length check (
    char_length(review_text) <= 5000
  ) not valid;

create or replace function public.create_game_for_group(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_game_id uuid;
  uid uuid := auth.uid();
  roster_size int;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = uid
  ) then
    raise exception 'not_group_member';
  end if;
  if exists (
    select 1 from public.games g
    where g.group_id = p_group_id and g.status in ('pending', 'active')
  ) then
    raise exception 'active_game_exists';
  end if;

  select count(*)::int into roster_size
  from public.group_members where group_id = p_group_id;
  if roster_size < 2 then
    raise exception 'not_enough_players';
  end if;
  if exists (
    select 1
    from public.group_members gm
    left join public.profiles p on p.user_id = gm.user_id
    where gm.group_id = p_group_id
      and nullif(btrim(p.display_name), '') is null
  ) then
    raise exception 'display_name_required';
  end if;

  insert into public.games (group_id, host_id, status, current_round)
  values (p_group_id, uid, 'pending', 0)
  returning id into new_game_id;

  insert into public.game_members (game_id, user_id, player_order)
  select new_game_id, gm.user_id, gm.player_order
  from public.group_members gm
  where gm.group_id = p_group_id
  order by gm.player_order;

  return new_game_id;
end;
$$;

revoke all on function public.create_game_for_group(uuid) from public;
grant execute on function public.create_game_for_group(uuid) to authenticated;

create or replace function public.get_group_current_game(p_group_id uuid)
returns table(
  id uuid,
  status text,
  current_round int,
  host_id uuid,
  max_rounds int,
  auto_advance boolean,
  is_participant boolean,
  player_count int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  ) then raise exception 'not_group_member'; end if;
  return query
    select g.id, g.status, g.current_round, g.host_id, g.max_rounds,
      g.auto_advance,
      exists (
        select 1 from public.game_members member
        where member.game_id = g.id and member.user_id = auth.uid()
      ),
      (select count(*)::int from public.game_members roster where roster.game_id = g.id)
    from public.games g
    where g.group_id = p_group_id
    order by g.created_at desc
    limit 1;
end;
$$;
revoke all on function public.get_group_current_game(uuid) from public;
grant execute on function public.get_group_current_game(uuid) to authenticated;

-- One atomic host operation reveals the current round and either starts the
-- next round or completes the game. It never rolls back the final reveal.
create or replace function public.advance_game(p_game_id uuid)
returns table(round_id uuid, revealed_round_id uuid, completed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  g public.games%rowtype;
  latest public.rounds%rowtype;
  next_number int;
  roster_size int;
  picker uuid;
  created_round uuid;
  revealed_id uuid;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  select * into g from public.games where id = p_game_id for update;
  if not found then raise exception 'game_not_found'; end if;
  if g.host_id is distinct from uid then raise exception 'not_host'; end if;
  if g.status = 'completed' then raise exception 'game_completed'; end if;

  select * into latest
  from public.rounds
  where game_id = p_game_id
  order by round_number desc
  limit 1
  for update;

  if found then
    if latest.status = 'awaiting_album' then
      raise exception 'album_not_submitted';
    end if;
    if latest.status = 'awaiting_reviews' then
      update public.rounds set status = 'revealed' where id = latest.id;
      revealed_id := latest.id;
    end if;
    if latest.round_number >= g.max_rounds then
      update public.games set status = 'completed' where id = p_game_id;
      return query select null::uuid, revealed_id, true;
      return;
    end if;
    next_number := latest.round_number + 1;
  else
    next_number := 1;
  end if;

  select count(*)::int into roster_size
  from public.game_members where game_id = p_game_id;
  if roster_size < 2 then raise exception 'not_enough_players'; end if;

  select gm.user_id into picker
  from public.game_members gm
  where gm.game_id = p_game_id
  order by gm.player_order
  limit 1 offset ((next_number - 1) % roster_size);

  insert into public.rounds (game_id, created_by, round_number, status)
  values (p_game_id, picker, next_number, 'awaiting_album')
  returning id into created_round;

  update public.games
  set current_round = next_number, status = 'active'
  where id = p_game_id;

  return query select created_round, revealed_id, false;
end;
$$;

revoke all on function public.advance_game(uuid) from public;
grant execute on function public.advance_game(uuid) to authenticated;

-- Retire the rollback-prone public entry point. Auto-advance still uses the
-- private implementation from submit_review.
revoke execute on function public.start_next_round(uuid) from authenticated;

create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'unauthorized'; end if;
  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = uid
  ) then
    raise exception 'not_group_member';
  end if;

  if exists (
    select 1
    from public.games g
    join public.game_members gm on gm.game_id = g.id and gm.user_id = uid
    where g.group_id = p_group_id and g.status in ('pending', 'active')
  ) then
    raise exception 'active_game_participant';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = uid;
end;
$$;

revoke all on function public.leave_group(uuid) from public;
grant execute on function public.leave_group(uuid) to authenticated;

-- Profile-only roster functions prevent peer account email disclosure.
drop function if exists public.get_game_member_emails(uuid);
create function public.get_game_member_emails(p_game_id uuid)
returns table(user_id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.game_members gm
    where gm.game_id = p_game_id and gm.user_id = auth.uid()
  ) then raise exception 'not_game_member'; end if;
  return query
    select gm.user_id, p.display_name
    from public.game_members gm
    left join public.profiles p on p.user_id = gm.user_id
    where gm.game_id = p_game_id;
end;
$$;
revoke all on function public.get_game_member_emails(uuid) from public;
grant execute on function public.get_game_member_emails(uuid) to authenticated;

drop function if exists public.get_group_member_profiles(uuid);
create function public.get_group_member_profiles(p_group_id uuid)
returns table(user_id uuid, display_name text, joined_at timestamptz, player_order int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  ) then raise exception 'not_group_member'; end if;
  return query
    select gm.user_id, p.display_name, gm.joined_at, gm.player_order
    from public.group_members gm
    left join public.profiles p on p.user_id = gm.user_id
    where gm.group_id = p_group_id
    order by gm.joined_at, gm.player_order;
end;
$$;
revoke all on function public.get_group_member_profiles(uuid) from public;
grant execute on function public.get_group_member_profiles(uuid) to authenticated;

-- Only Spotify's image CDN may be persisted as cover art.
create or replace function public.normalize_optional_cover_url(p_value text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  trimmed text := nullif(btrim(coalesce(p_value, '')), '');
begin
  if trimmed is null then return null; end if;
  if char_length(trimmed) > 2048
     or trimmed ~ '[[:cntrl:][:space:]]'
     or trimmed !~* '^https://i\.scdn\.co/image/[A-Za-z0-9]+$' then
    raise exception 'invalid_cover_url';
  end if;
  return trimmed;
end;
$$;
revoke all on function public.normalize_optional_cover_url(text) from public;
