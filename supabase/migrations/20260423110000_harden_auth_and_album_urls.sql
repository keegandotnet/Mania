-- Harden URL handling for auth redirects and album links.
--
-- App-level redirect sanitization lives in TypeScript. This migration reinforces
-- the album-link boundary inside the SECURITY DEFINER RPC so unsafe schemes do
-- not get stored even if a client bypasses the UI.

create or replace function public.normalize_optional_album_url(p_value text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  authority text;
  trimmed text;
begin
  trimmed := nullif(btrim(coalesce(p_value, '')), '');
  if trimmed is null then
    return null;
  end if;

  if char_length(trimmed) > 2048 then
    raise exception 'invalid_album_url';
  end if;

  if trimmed ~ '[[:cntrl:][:space:]]' then
    raise exception 'invalid_album_url';
  end if;

  if trimmed !~* '^https?://[^/?#[:space:]][^[:space:]]*$' then
    raise exception 'invalid_album_url';
  end if;

  authority := split_part(split_part(split_part(trimmed, '://', 2), '/', 1), '?', 1);
  authority := split_part(authority, '#', 1);
  if position('@' in authority) > 0 then
    raise exception 'invalid_album_url';
  end if;

  return trimmed;
end;
$$;

revoke all on function public.normalize_optional_album_url(text) from public;

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
    album_url = public.normalize_optional_album_url(p_album_url),
    status = 'awaiting_reviews'
  where id = r.id
  returning * into r;

  return r.id;
end;
$$;

revoke all on function public.submit_album(uuid, text, text, text) from public;
grant execute on function public.submit_album(uuid, text, text, text) to authenticated;
