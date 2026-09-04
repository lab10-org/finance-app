import type { SupabaseClient } from "@supabase/supabase-js";

import type { SessionUser } from "@/lib/auth/types";

/**
 * Who is signed in, according to this client's cookies.
 *
 * Kept apart from `session.ts` so it can be tested: that module imports
 * `server-only`, which throws the moment a test runner loads it.
 */
export async function readSessionUser(
  supabase: SupabaseClient,
): Promise<SessionUser | null> {
  let claims: Record<string, unknown> | undefined;

  try {
    const { data } = await supabase.auth.getClaims();
    claims = data?.claims as Record<string, unknown> | undefined;
  } catch {
    // An unreachable auth service is not a session. The proxy will send the
    // person to "la entrada", which is where the failure gets explained (8.1).
    return null;
  }

  const id = typeof claims?.sub === "string" ? claims.sub : null;
  if (!id) return null;

  const claimedEmail = typeof claims?.email === "string" ? claims.email : null;
  if (claimedEmail) return { id, email: claimedEmail };

  /*
   * The claims do not always carry an email, but `AccountControl` has to show
   * one (6.1), so fall back to the account itself rather than publishing a
   * `SessionUser` that breaks its own contract.
   */
  try {
    const { data } = await supabase.auth.getUser();
    const email = data?.user?.email;
    return email ? { id, email } : null;
  } catch {
    return null;
  }
}
