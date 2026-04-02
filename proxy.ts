import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabaseProxy";

/**
 * Next.js 16 session refresh at the network boundary (formerly `middleware`).
 * Runs before routes so navigations refresh JWT cookies; server code uses `lib/supabaseServer.ts`.
 *
 * Matcher: skip `_next/static`, `_next/image`, favicon, and common static file extensions.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
