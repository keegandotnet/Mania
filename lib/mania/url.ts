const MAX_SHARED_URL_LENGTH = 2048;

export const INVALID_ALBUM_URL_MESSAGE =
  "Album link must be a valid absolute http:// or https:// URL.";

export function sanitizeNextPath(raw: string | null | undefined, fallback = "/account"): string {
  if (typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return normalized.startsWith("/") && !normalized.startsWith("//") ? normalized : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeOptionalHttpUrl(
  raw: string | null | undefined
): { ok: true; value: string | null } | { ok: false; message: string } {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return { ok: true, value: null };
  }

  if (trimmed.length > MAX_SHARED_URL_LENGTH) {
    return { ok: false, message: INVALID_ALBUM_URL_MESSAGE };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, message: INVALID_ALBUM_URL_MESSAGE };
    }
    if (!parsed.hostname || parsed.username || parsed.password) {
      return { ok: false, message: INVALID_ALBUM_URL_MESSAGE };
    }

    return { ok: true, value: parsed.toString() };
  } catch {
    return { ok: false, message: INVALID_ALBUM_URL_MESSAGE };
  }
}
