create or replace function public.update_game_auto_advance(p_game_id uuid, p_auto_advance boolean)
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

  update public.games set auto_advance = p_auto_advance where id = p_game_id;
end;
$$;

revoke all on function public.update_game_auto_advance(uuid, boolean) from public;
grant execute on function public.update_game_auto_advance(uuid, boolean) to authenticated;
