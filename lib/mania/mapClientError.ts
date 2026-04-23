function contains(haystack: string, needle: string): boolean {
  return haystack.includes(needle);
}

export function mapClientErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  const haystack = message.toLowerCase();

  if (contains(haystack, "failed to fetch")) {
    return "Could not reach Supabase. Confirm your local stack is running and your app URL matches the configured local API URL.";
  }

  if (contains(haystack, "next_public_supabase_url") || contains(haystack, "next_public_supabase_anon_key")) {
    return message;
  }

  return message || fallback;
}

