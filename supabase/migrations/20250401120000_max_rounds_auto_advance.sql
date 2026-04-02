-- Max rounds per game, completed state, auto-advance after last review, shared round-start core.

alter table public.games
  add column if not exists max_rounds int not null default 10
    constraint games_max_rounds_check check (max_rounds >= 1 and max_rounds <= 500);

-- Core logic for starting the next round (host RPC and auto-advance share this).
create or replace function public.mania_start_next_round_impl(p_game_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.games%rowtype;
  latest public.rounds%rowtype;
  has_latest boolean := false;
  next_num int;
  roster int;
  submitter uuid;
  new_round_id uuid;
begin
  select * into g from public.games where id = p_game_id for update;
  if not found then
    raise exception 'game_not_found';
  end if;
  if g.status = 'completed' then
    raise exception 'game_completed';
  end if;

  select * into latest from public.rounds
  where game_id = p_game_id
  order by round_number desc
  limit 1;
  has_latest := FOUND;

  if has_latest then
    if latest.status = 'awaiting_album' then
      raise exception 'album_not_submitted';
    end if;
    if latest.status = 'awaiting_reviews' then
      update public.rounds set status = 'revealed' where id = latest.id;
    end if;
    next_num := latest.round_number + 1;
  else
    next_num := 1;
  end if;

  if next_num > g.max_rounds then
    raise exception 'max_rounds_reached';
  end if;

  select count(*)::int into roster from public.game_members where game_id = p_game_id;
  if roster = 0 then
    raise exception 'empty_roster';
  end if;

  select gm.user_id into submitter
  from public.game_members gm
  where gm.game_id = p_game_id
  order by gm.player_order
  limit 1 offset ((next_num - 1) % roster);

  if submitter is null then
    raise exception 'submitter_not_found';
  end if;

  insert into public.rounds (game_id, created_by, round_number, status)
  values (p_game_id, submitter, next_num, 'awaiting_album')
  returning id into new_round_id;

  update public.games
  set
    current_round = next_num,
    status = case when status = 'pending' then 'active' else status end
  where id = p_game_id;

  return new_round_id;
end;
$$;

revoke all on function public.mania_start_next_round_impl(uuid) from public;

create or replace function public.start_next_round(p_game_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  g public.games%rowtype;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  select * into g from public.games where id = p_game_id;
  if not found then
    raise exception 'game_not_found';
  end if;
  if g.host_id is distinct from uid then
    raise exception 'not_host';
  end if;

  return public.mania_start_next_round_impl(p_game_id);
end;
$$;

revoke all on function public.start_next_round(uuid) from public;
grant execute on function public.start_next_round(uuid) to authenticated;

create or replace function public.submit_album(
  p_game_id uuid,
  p_album_name text,
  p_artist_name text,
  p_album_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.rounds%rowtype;
  gstatus text;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  select status into gstatus from public.games where id = p_game_id;
  if not found then
    raise exception 'game_not_found';
  end if;
  if gstatus not in ('pending', 'active') then
    raise exception 'game_not_playable';
  end if;

  if not exists (
    select 1 from public.game_members gm where gm.game_id = p_game_id and gm.user_id = uid
  ) then
    raise exception 'not_game_member';
  end if;

  select * into r from public.rounds
  where game_id = p_game_id and status = 'awaiting_album'
  order by round_number desc
  limit 1;
  if not found then
    raise exception 'no_round_awaiting_album';
  end if;
  if r.created_by is distinct from uid then
    raise exception 'not_your_turn';
  end if;

  update public.rounds
  set
    album_name = trim(p_album_name),
    artist_name = trim(p_artist_name),
    album_url = nullif(trim(p_album_url), ''),
    status = 'awaiting_reviews'
  where id = r.id
  returning * into r;

  return r.id;
end;
$$;

revoke all on function public.submit_album(uuid, text, text, text) from public;
grant execute on function public.submit_album(uuid, text, text, text) to authenticated;

create or replace function public.submit_review(
  p_round_id uuid,
  p_rating numeric,
  p_review_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.rounds%rowtype;
  game_uuid uuid;
  expected int;
  submitted int;
  rounded_rating numeric(3, 1);
  g public.games%rowtype;
  _auto_round uuid;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  rounded_rating := round(p_rating::numeric, 1);
  if rounded_rating < 1.0 or rounded_rating > 10.0 then
    raise exception 'invalid_rating';
  end if;

  select * into r from public.rounds where id = p_round_id for update;
  if not found then
    raise exception 'round_not_found';
  end if;
  if r.status is distinct from 'awaiting_reviews' then
    raise exception 'round_not_reviewable';
  end if;

  game_uuid := r.game_id;

  if not exists (
    select 1 from public.game_members gm where gm.game_id = game_uuid and gm.user_id = uid
  ) then
    raise exception 'not_game_member';
  end if;

  if r.created_by = uid then
    raise exception 'cannot_self_review';
  end if;

  insert into public.reviews (round_id, user_id, rating, review_text)
  values (p_round_id, uid, rounded_rating, coalesce(p_review_text, ''));

  select count(*)::int into expected
  from public.game_members gm
  where gm.game_id = game_uuid and gm.user_id is distinct from r.created_by;

  select count(*)::int into submitted
  from public.reviews rv
  where rv.round_id = p_round_id;

  if submitted >= expected then
    update public.rounds set status = 'revealed' where id = p_round_id;

    select * into g from public.games where id = game_uuid for update;
    if g.status = 'completed' then
      return;
    end if;

    if r.round_number >= g.max_rounds then
      update public.games set status = 'completed' where id = game_uuid;
    elsif g.auto_advance and g.status = 'active' then
      select public.mania_start_next_round_impl(game_uuid) into _auto_round;
    end if;
  end if;
end;
$$;

revoke all on function public.submit_review(uuid, numeric, text) from public;
grant execute on function public.submit_review(uuid, numeric, text) to authenticated;
