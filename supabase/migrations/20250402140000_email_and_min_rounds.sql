-- Expose game-member emails to other members of the same game (security definer
-- to read auth.users, which is otherwise inaccessible via the anon/auth role).
create or replace function public.get_game_member_emails(p_game_id uuid)
returns table(user_id uuid, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only a current member of the game may read its roster emails.
  if not exists (
    select 1 from public.game_members gm2
    where gm2.game_id = p_game_id and gm2.user_id = auth.uid()
  ) then
    raise exception 'not_game_member';
  end if;

  return query
    select gm.user_id, u.email::text
    from public.game_members gm
    join auth.users u on u.id = gm.user_id
    where gm.game_id = p_game_id;
end;
$$;

revoke all on function public.get_game_member_emails(uuid) from public;
grant execute on function public.get_game_member_emails(uuid) to authenticated;


-- Tighten update_game_max_rounds:
--   • Block changes once the first round has been started (current_round > 0).
--   • Enforce p_max_rounds >= number of players in the game roster.
create or replace function public.update_game_max_rounds(p_game_id uuid, p_max_rounds int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  g            public.games%rowtype;
  player_count int;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;
  if p_max_rounds < 1 or p_max_rounds > 500 then
    raise exception 'invalid_max_rounds';
  end if;

  select * into g from public.games where id = p_game_id for update;
  if not found then
    raise exception 'game_not_found';
  end if;
  if g.host_id is distinct from uid then
    raise exception 'not_host';
  end if;
  if g.status = 'completed' then
    raise exception 'game_completed';
  end if;
  -- Block changes once the first round has been created.
  if g.current_round > 0 then
    raise exception 'game_already_started';
  end if;

  select count(*) into player_count from public.game_members where game_id = p_game_id;
  if p_max_rounds < player_count then
    raise exception 'max_rounds_below_player_count';
  end if;

  update public.games set max_rounds = p_max_rounds where id = p_game_id;
end;
$$;

revoke all on function public.update_game_max_rounds(uuid, int) from public;
grant execute on function public.update_game_max_rounds(uuid, int) to authenticated;
