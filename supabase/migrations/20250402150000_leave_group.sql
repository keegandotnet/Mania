-- Allows a group member to leave.
--
-- Rules:
--   • If the caller is the sole member, the entire group is deleted (cascades
--     games, game_members, rounds, reviews).
--   • If the caller is the host of a pending/active game with other members,
--     the leave is blocked — they must end the game or transfer host first.
--   • Otherwise the caller is removed from group_members. They remain in
--     game_members for any already-snapshotted game roster (the game has their
--     picks/reviews in history), but will not appear in future games for the
--     group.

create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  member_count int;
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

  -- Count members so we know whether caller is the last one.
  select count(*) into member_count
  from public.group_members
  where group_id = p_group_id;

  if member_count <= 1 then
    -- Sole member: wipe the group and everything under it.
    delete from public.groups where id = p_group_id;
  else
    -- Multiple members: block if caller hosts an active/pending game.
    if exists (
      select 1 from public.games g
      where g.group_id = p_group_id
        and g.host_id  = uid
        and g.status  in ('pending', 'active')
    ) then
      raise exception 'host_of_active_game';
    end if;

    delete from public.group_members
    where group_id = p_group_id and user_id = uid;
  end if;
end;
$$;

revoke all on function public.leave_group(uuid) from public;
grant execute on function public.leave_group(uuid) to authenticated;
