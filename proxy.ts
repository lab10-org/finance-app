import { NextResponse, type NextRequest } from "next/server";

import { decideRoute } from "@/lib/auth/route-decision";
import { createSupabaseProxyClient } from "@/lib/supabase/server";

/*
 * Next 16 renamed the `middleware` convention to `proxy`: the file is
 * `proxy.ts` at the repository root, the export is named `proxy`, and the
 * runtime is Node.js and cannot be configured. Every Supabase + Next.js guide
 * in circulation still says `middleware.ts` — a file by that name would simply
 * never run here.
 *
 * This is the only place the session is refreshed, because Server Components
 * cannot write cookies.
 */
export async function proxy(request: NextRequest) {
  // Created up front so the Supabase client can write the rotated cookies onto
  // it as a side effect of `getClaims()`.
  const response = NextResponse.next({ request });
  const supabase = createSupabaseProxyClient(request, response);

  /*
   * `getClaims()` both reads the session and performs the refresh when the
   * access token is due, which is what makes 5.3 true without the user ever
   * seeing it happen.
   */
  const { data } = await supabase.auth.getClaims();
  const hasSession = Boolean(data?.claims);

  const decision = decideRoute({
    pathname: request.nextUrl.pathname,
    hasSession,
  });

  if (decision.kind === "continue") return response;

  const redirect = NextResponse.redirect(new URL(decision.to, request.url));
  /*
   * Carry the refreshed cookies across. A redirect built from scratch drops
   * them, and the browser then keeps presenting the stale token — the standard
   * way this pattern silently loses the rotated session.
   */
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export const config = {
  /*
   * Everything except static assets and the files an uninstalled PWA reads
   * while signed out. Without a matcher the proxy also gates CSS and images,
   * and the sign-in screen would render unstyled.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.png$).*)",
  ],
};
