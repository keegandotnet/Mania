-- Two related fixes to preserve game history after leaving a group.
--
-- 1. leave_group: no longer deletes the group when the last member leaves.
--    Previously the sole-member path ran `DELETE FROM groups`, which cascaded
--    to games → game_members → rounds → reviews, wiping all game history.
--    Now it simply removes the group_members row in all cases. The group row
--    becomes "empty" (no current members) but all game history is intact.
--    The group is invisible to all users (RLS still requires group or game
--    membership to SELECT it) so orphaned groups cause no user-visible issues.
--
-- 2. groups_select_member RLS: extended to also allow SELECT when the caller
--    is a participant in any game that belongs to the group. This lets
--    getMyGameHistory display the correct group name for games played in groups
--    the user has since left.

-- ── 1. Update leave_group ─────────────────────────────────────────────────

create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  -- Confirm membership.
  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = uid
  ) then
    raise exception 'not_group_member';
  end if;

  -- Block if caller hosts an active/pending game (still enforced).
  if exists (
    select 1 from public.games g
    where g.group_id = p_group_id
      and g.host_id  = uid
      and g.status  in ('pending', 'active')
  ) then
    raise exception 'host_of_active_game';
  end if;

  -- Always just remove the caller's membership row.
  -- The group row is intentionally left in place so that game history
  -- (games → game_members → rounds → reviews) survives the leave.
  delete from public.group_members
  where group_id = p_group_id and user_id = uid;
end;
$$;

revoke all on function public.leave_group(uuid) from public;
grant execute on function public.leave_group(uuid) to authenticated;

-- ── 2. Extend groups SELECT policy ───────────────────────────────────────

drop policy if exists groups_select_member on public.groups;

create policy groups_select_member
  on public.groups
  for select
  to authenticated
  using (
    -- Current group member.
    public.is_group_member(groups.id, auth.uid())
    -- OR former member who participated in a game in this group.
    or exists (
      select 1
      from public.games g
      join public.game_members gm on gm.game_id = g.id
      where g.group_id = groups.id
        and gm.user_id = auth.uid()
    )
  );
