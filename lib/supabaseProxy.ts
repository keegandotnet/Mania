import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { hasSupabasePublicEnv, getSupabasePublicEnv } from "@/lib/supabaseEnv";
import type { Database } from "@/lib/database.types";

/** Refreshes the Supabase Auth session; cookie handling matches `lib/supabaseServer.ts`. */
export async function updateSession(request: NextRequest, requestHeaders = request.headers) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const { url, anonKey } = getSupabasePublicEnv();

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
