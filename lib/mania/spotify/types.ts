/** Normalized album suggestion returned to the browser (no tokens or secrets). */
export type SpotifyAlbumSuggestion = {
  spotifyAlbumId: string;
  albumName: string;
  artistName: string;
  releaseYear: string | null;
  coverUrl: string | null;
  spotifyUrl: string;
};

export type SpotifySearchResult =
  | { ok: true; suggestions: SpotifyAlbumSuggestion[] }
  | {
      ok: false;
      reason: "unconfigured" | "invalid_query" | "rate_limited" | "unavailable";
    };
