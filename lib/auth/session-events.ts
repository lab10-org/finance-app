import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Calls `onSessionEnded` when Supabase says the session is gone, and returns
 * the unsubscribe.
 *
 * This adapter lives in `lib/auth/` rather than beside `SessionGuard` on
 * purpose: `app/__tests__/no-stray-colours.test.ts` allows a Supabase import
 * only from the auth modules, so the book's own components stay free of any
 * client that could talk to a network.
 */
export function subscribeToSessionEnd(onSessionEnded: () => void): () => void {
  const supabase = createSupabaseBrowserClient();

  /*
   * `SIGNED_OUT` only. Supabase emits `INITIAL_SESSION` the moment you
   * subscribe, with a null session when there is none — treating a null
   * session as an ending blanks the book on mount, which is exactly what the
   * 6.3 test caught. A revoked or unrefreshable token also arrives as
   * `SIGNED_OUT`, so nothing is lost by narrowing to it.
   */
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") onSessionEnded();
  });

  return () => data.subscription.unsubscribe();
}
