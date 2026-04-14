-- User profiles (display names), extend game roster RPC, group roster RPC for Play.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_len check (
    display_name is null or (char_length(trim(display_name)) >= 1 and char_length(trim(display_name)) <= 80)
  )
);

alter table public.profiles enable row level security;

-- Own row, or anyone who shares a group with this user (same pattern as group roster visibility).
create policy profiles_select_visible
  on public.profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.group_members gm_self
      join public.group_members gm_peer on gm_peer.group_id = gm_self.group_id
      where gm_self.user_id = auth.uid()
        and gm_peer.user_id = profiles.user_id
    )
  );

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- New auth users get a profile row; optional display_name from sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Existing users (pre-migration)
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Game roster: emails + display names (one round-trip for members)
-- ---------------------------------------------------------------------------

-- Postgres does not allow CREATE OR REPLACE when the OUT / return row type changes.
drop function if exists public.get_game_member_emails(uuid);

create function public.get_game_member_emails(p_game_id uuid)
returns table(user_id uuid, email text, display_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.game_members gm2
    where gm2.game_id = p_game_id and gm2.user_id = auth.uid()
  ) then
    raise exception 'not_game_member';
  end if;

  return query
    select gm.user_id, u.email::text, p.display_name
    from public.game_members gm
    join auth.users u on u.id = gm.user_id
    left join public.profiles p on p.user_id = gm.user_id
    where gm.game_id = p_game_id;
end;
$$;

revoke all on function public.get_game_member_emails(uuid) from public;
grant execute on function public.get_game_member_emails(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Group roster (Play page): members only; join order by joined_at, player_order
-- ---------------------------------------------------------------------------

create or replace function public.get_group_member_profiles(p_group_id uuid)
returns table(
  user_id uuid,
  email text,
  display_name text,
  joined_at timestamptz,
  player_order int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  ) then
    raise exception 'not_group_member';
  end if;

  return query
    select gm.user_id, u.email::text, pr.display_name, gm.joined_at, gm.player_order
    from public.group_members gm
    join auth.users u on u.id = gm.user_id
    left join public.profiles pr on pr.user_id = gm.user_id
    where gm.group_id = p_group_id
    order by gm.joined_at asc, gm.player_order asc;
end;
$$;

revoke all on function public.get_group_member_profiles(uuid) from public;
grant execute on function public.get_group_member_profiles(uuid) to authenticated;
