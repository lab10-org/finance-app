import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ENTRADA_PATH } from "@/lib/auth/route-decision";
import { readSessionUser } from "@/lib/auth/session-core";
import type { SessionUser } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Who is signed in on this request.
 *
 * Memoised with React `cache` so a page and its children asking the same
 * question do not each pay for it. Never throws on absence — the answer to "no
 * session" is `null`, not an error.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  return readSessionUser(supabase);
});

/**
 * `getSessionUser()`, for pages that have no meaning without an account.
 *
 * The proxy has normally redirected already; this is the second lock, so that
 * a page can never render its contents because a matcher was edited (4.2).
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(ENTRADA_PATH);
  return user;
}
