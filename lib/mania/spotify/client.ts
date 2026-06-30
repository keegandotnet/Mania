import "server-only";

type SpotifyTokenCache = {
  token: string;
  expiresAtMs: number;
};

let tokenCache: SpotifyTokenCache | null = null;

function spotifyCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isSpotifyConfigured(): boolean {
  return spotifyCredentials() != null;
}

export function spotifyMarket(): string {
  const market = process.env.SPOTIFY_MARKET?.trim().toUpperCase();
  return market && /^[A-Z]{2}$/.test(market) ? market : "US";
}

async function fetchAccessToken(): Promise<string | null> {
  const creds = spotifyCredentials();
  if (!creds) return null;

  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAtMs - 60_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    tokenCache = null;
    return null;
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token || !payload.expires_in) {
    tokenCache = null;
    return null;
  }

  tokenCache = {
    token: payload.access_token,
    expiresAtMs: now + payload.expires_in * 1000,
  };

  return payload.access_token;
}

type SpotifyImage = { url?: string; height?: number | null; width?: number | null };
type SpotifyArtist = { name?: string };
type SpotifyAlbumItem = {
  id?: string;
  name?: string;
  artists?: SpotifyArtist[];
  release_date?: string;
  external_urls?: { spotify?: string };
  images?: SpotifyImage[];
};

type SpotifySearchResponse = {
  albums?: { items?: SpotifyAlbumItem[] };
};

function pickCoverUrl(images: SpotifyImage[] | undefined): string | null {
  if (!images?.length) return null;

  const sorted = [...images].sort((left, right) => {
    const leftSize = (left.width ?? 0) * (left.height ?? 0);
    const rightSize = (right.width ?? 0) * (right.height ?? 0);
    return leftSize - rightSize;
  });

  for (const image of sorted) {
    const url = image.url?.trim();
    if (url?.startsWith("https://")) return url;
  }

  return null;
}

function releaseYear(releaseDate: string | undefined): string | null {
  if (!releaseDate) return null;
  const year = releaseDate.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

function normalizeAlbumItem(item: SpotifyAlbumItem) {
  const spotifyAlbumId = item.id?.trim();
  const albumName = item.name?.trim();
  const artistName = item.artists?.map((artist) => artist.name?.trim() ?? "").filter(Boolean).join(", ");
  const spotifyUrl = item.external_urls?.spotify?.trim();

  if (!spotifyAlbumId || !albumName || !artistName || !spotifyUrl) {
    return null;
  }

  return {
    spotifyAlbumId,
    albumName,
    artistName,
    releaseYear: releaseYear(item.release_date),
    coverUrl: pickCoverUrl(item.images),
    spotifyUrl,
  };
}

export async function searchSpotifyAlbumCatalog(
  query: string,
  limit = 8
): Promise<
  | {
      ok: true;
      suggestions: NonNullable<ReturnType<typeof normalizeAlbumItem>>[];
    }
  | { ok: false; reason: "unconfigured" | "rate_limited" | "unavailable" }
> {
  const token = await fetchAccessToken();
  if (!token) {
    return { ok: false, reason: "unconfigured" };
  }

  const params = new URLSearchParams({
    q: query,
    type: "album",
    limit: String(Math.min(Math.max(limit, 1), 10)),
    market: spotifyMarket(),
  });

  const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 429) {
    return { ok: false, reason: "rate_limited" };
  }

  if (!response.ok) {
    return { ok: false, reason: "unavailable" };
  }

  const payload = (await response.json()) as SpotifySearchResponse;
  const suggestions = (payload.albums?.items ?? [])
    .map(normalizeAlbumItem)
    .filter((item): item is NonNullable<ReturnType<typeof normalizeAlbumItem>> => item != null);

  return { ok: true, suggestions };
}
