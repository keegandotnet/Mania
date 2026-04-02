-- Mania MVP: tables, constraints, triggers, and SECURITY DEFINER RPCs for transactional flows.
-- RLS is intentionally not enabled yet; enable before public traffic (see docs/security.md).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  invite_code text not null,
  created_at timestamptz not null default now(),
  constraint groups_invite_len check (char_length(invite_code) = 6),
  constraint groups_invite_uppercase check (invite_code = upper(invite_code))
);

create unique index groups_invite_code_key on public.groups (invite_code);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  player_order int not null,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id),
  unique (group_id, player_order)
);

create index group_members_group_id_idx on public.group_members (group_id);
create index group_members_user_id_idx on public.group_members (user_id);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'completed')),
  current_round int not null default 0,
  auto_advance boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index games_one_non_completed_per_group
  on public.games (group_id)
  where (status in ('pending', 'active'));

create index games_group_id_idx on public.games (group_id);

create table public.game_members (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  player_order int not null,
  unique (game_id, user_id),
  unique (game_id, player_order)
);

create index game_members_game_id_idx on public.game_members (game_id);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  album_name text,
  artist_name text,
  album_url text,
  round_number int not null,
  status text not null check (status in ('awaiting_album', 'awaiting_reviews', 'revealed')),
  created_at timestamptz not null default now(),
  unique (game_id, round_number)
);

create index rounds_game_id_idx on public.rounds (game_id);

create unique index rounds_unique_album_per_game
  on public.rounds (
    game_id,
    lower(trim(album_name)),
    lower(trim(artist_name))
  )
  where album_name is not null and artist_name is not null;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating numeric(3, 1) not null,
  review_text text not null default '',
  created_at timestamptz not null default now(),
  unique (round_id, user_id),
  constraint reviews_rating_range check (rating >= 1.0 and rating <= 10.0)
);

create index reviews_round_id_idx on public.reviews (round_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.reviews_block_self_review()
returns trigger
language plpgsql
as $$
declare
  submitter uuid;
begin
  select r.created_by into submitter from public.rounds r where r.id = new.round_id;
  if submitter is null then
    raise exception 'round_not_found';
  end if;
  if new.user_id = submitter then
    raise exception 'cannot_self_review';
  end if;
  return new;
end;
$$;

create trigger reviews_block_self_review_trg
  before insert on public.reviews
  for each row execute procedure public.reviews_block_self_review();

create or replace function public.reviews_block_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'reviews_immutable';
end;
$$;

create trigger reviews_block_update_trg
  before update on public.reviews
  for each row execute procedure public.reviews_block_update();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_group_with_owner(p_name text, p_invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;
  insert into public.groups (name, created_by, invite_code)
  values (trim(p_name), auth.uid(), upper(trim(p_invite)))
  returning id into gid;
  insert into public.group_members (group_id, user_id, player_order)
  values (gid, auth.uid(), 0);
  return gid;
end;
$$;

revoke all on function public.create_group_with_owner(text, text) from public;
grant execute on function public.create_group_with_owner(text, text) to authenticated;

create or replace function public.join_group_by_invite(p_invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  cnt int;
  next_order int;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;
  select id into gid from public.groups where invite_code = upper(trim(p_invite));
  if gid is null then
    raise exception 'invalid_invite';
  end if;
  if exists (
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = auth.uid()
  ) then
    raise exception 'already_member';
  end if;
  select count(*)::int into cnt from public.group_members where group_id = gid;
  if cnt >= 6 then
    raise exception 'group_full';
  end if;
  select coalesce(max(player_order), -1) + 1 into next_order
  from public.group_members where group_id = gid;
  insert into public.group_members (group_id, user_id, player_order)
  values (gid, auth.uid(), next_order);
  return gid;
end;
$$;

revoke all on function public.join_group_by_invite(text) from public;
grant execute on function public.join_group_by_invite(text) to authenticated;

create or replace function public.create_game_for_group(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  if not exists (
    select 1 from public.group_members gm where gm.group_id = p_group_id and gm.user_id = uid
  ) then
    raise exception 'not_group_member';
  end if;
  if exists (
    select 1 from public.games g
    where g.group_id = p_group_id and g.status in ('pending', 'active')
  ) then
    raise exception 'active_game_exists';
  end if;
  insert into public.games (group_id, host_id, status, current_round)
  values (p_group_id, uid, 'pending', 0)
  returning id into gid;

  insert into public.game_members (game_id, user_id, player_order)
  select gid, gm.user_id, gm.player_order
  from public.group_members gm
  where gm.group_id = p_group_id
  order by gm.player_order;

  return gid;
end;
$$;

revoke all on function public.create_game_for_group(uuid) from public;
grant execute on function public.create_game_for_group(uuid) to authenticated;

create or replace function public.start_next_round(p_game_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  g public.games%rowtype;
  latest public.rounds%rowtype;
  has_latest boolean := false;
  next_num int;
  roster int;
  submitter uuid;
  new_round_id uuid;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  select * into g from public.games where id = p_game_id for update;
  if not found then
    raise exception 'game_not_found';
  end if;
  if g.host_id is distinct from uid then
    raise exception 'not_host';
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
begin
  if uid is null then
    raise exception 'unauthorized';
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
  end if;
end;
$$;

revoke all on function public.submit_review(uuid, numeric, text) from public;
grant execute on function public.submit_review(uuid, numeric, text) to authenticated;
