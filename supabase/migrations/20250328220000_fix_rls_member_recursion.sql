-- group_members / game_members SELECT policies referenced the same table inside EXISTS,
-- which re-evaluated the policy and caused "infinite recursion detected".

create or replace function public.is_group_member(check_group_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = check_group_id and m.user_id = check_user_id
  );
$$;

revoke all on function public.is_group_member(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;

create or replace function public.is_game_member(check_game_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.game_members m
    where m.game_id = check_game_id and m.user_id = check_user_id
  );
$$;

revoke all on function public.is_game_member(uuid, uuid) from public;
grant execute on function public.is_game_member(uuid, uuid) to authenticated;

drop policy if exists group_members_select_same_group on public.group_members;
create policy group_members_select_same_group
  on public.group_members
  for select
  to authenticated
  using (public.is_group_member(group_members.group_id, auth.uid()));

drop policy if exists game_members_select_participant on public.game_members;
create policy game_members_select_participant
  on public.game_members
  for select
  to authenticated
  using (public.is_game_member(game_members.game_id, auth.uid()));
