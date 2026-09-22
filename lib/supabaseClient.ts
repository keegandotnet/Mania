import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabaseEnv";
import type { Database } from "@/lib/database.types";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
