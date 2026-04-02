-- Enable RLS on app tables (additive migration; safe after initial MVP migration).

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.games enable row level security;
alter table public.game_members enable row level security;
alter table public.rounds enable row level security;
alter table public.reviews enable row level security;

-- Direct table access: read only for rows tied to membership / game participation.
-- Mutations go through SECURITY DEFINER RPCs (see docs/security.md).

create policy groups_select_member
  on public.groups
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = auth.uid()
    )
  );

create policy group_members_select_same_group
  on public.group_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy games_select_participant
  on public.games
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = games.id
        and gm.user_id = auth.uid()
    )
  );

create policy game_members_select_participant
  on public.game_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = game_members.game_id
        and gm.user_id = auth.uid()
    )
  );

create policy rounds_select_participant
  on public.rounds
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = rounds.game_id
        and gm.user_id = auth.uid()
    )
  );

create policy reviews_select_participant
  on public.reviews
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.rounds r
      join public.game_members gm on gm.game_id = r.game_id
      where r.id = reviews.round_id
        and gm.user_id = auth.uid()
    )
  );
