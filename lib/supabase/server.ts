import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { readSupabaseEnv } from "@/lib/supabase/env";

/**
 * For Server Components and the DAL.
 *
 * `setAll` is a no-op wrapped in try/catch on purpose: a Server Component may
 * not write cookies, and it does not need to — `proxy.ts` has already refreshed
 * the token for this request and written the rotated pair. Letting the throw
 * escape would turn every render into an error the moment a refresh was due.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = readSupabaseEnv();
  const store = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Called from a Server Component. See the note above.
        }
      },
    },
  });
}

/**
 * For `proxy.ts`.
 *
 * Writes to BOTH the request and the response: the request so the rest of this
 * same invocation reads the refreshed value, the response so the browser
 * actually receives it.
 */
export function createSupabaseProxyClient(
  request: NextRequest,
  response: NextResponse,
): SupabaseClient {
  const { url, anonKey } = readSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}
