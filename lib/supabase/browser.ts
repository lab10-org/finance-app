import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readSupabaseEnv } from "@/lib/supabase/env";

let client: SupabaseClient | null = null;

/**
 * The browser-side client. Memoised per module load: `createBrowserClient`
 * installs its own auth listeners and token-refresh timer, so building a new
 * one on every render would stack them.
 *
 * The session lives in cookies rather than localStorage, which is the only
 * reason the server sees the same session the browser does (5.4).
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (client) return client;

  const { url, anonKey } = readSupabaseEnv();
  client = createBrowserClient(url, anonKey);
  return client;
}
