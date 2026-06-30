"use server";

import { actionErr, ok, type ActionResult } from "@/lib/mania/actionResult";
import { searchSpotifyAlbumCatalog, isSpotifyConfigured } from "@/lib/mania/spotify/client";
import type { SpotifyAlbumSuggestion, SpotifySearchResult } from "@/lib/mania/spotify/types";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const MAX_SUGGESTIONS = 8;

export async function isSpotifySearchEnabled(): Promise<boolean> {
  return isSpotifyConfigured();
}

export async function searchSpotifyAlbums(
  query: string
): Promise<ActionResult<SpotifySearchResult>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return ok({ ok: false, reason: "invalid_query" });
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    return ok({ ok: false, reason: "invalid_query" });
  }

  if (!isSpotifyConfigured()) {
    return ok({ ok: false, reason: "unconfigured" });
  }

  const result = await searchSpotifyAlbumCatalog(trimmed, MAX_SUGGESTIONS);
  if (!result.ok) {
    return ok({ ok: false, reason: result.reason });
  }

  const suggestions: SpotifyAlbumSuggestion[] = result.suggestions.map((item) => ({
    spotifyAlbumId: item.spotifyAlbumId,
    albumName: item.albumName,
    artistName: item.artistName,
    releaseYear: item.releaseYear,
    coverUrl: item.coverUrl,
    spotifyUrl: item.spotifyUrl,
  }));

  return ok({ ok: true, suggestions });
}
