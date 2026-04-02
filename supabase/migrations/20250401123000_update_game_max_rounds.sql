create or replace function public.update_game_max_rounds(p_game_id uuid, p_max_rounds int)
returns void
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
  if p_max_rounds < g.current_round then
    raise exception 'max_rounds_below_progress';
  end if;

  update public.games set max_rounds = p_max_rounds where id = p_game_id;
end;
$$;

revoke all on function public.update_game_max_rounds(uuid, int) from public;
grant execute on function public.update_game_max_rounds(uuid, int) to authenticated;
