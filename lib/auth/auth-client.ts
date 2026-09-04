import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_TIMEOUT_MS } from "@/lib/auth/config";
import { type AuthFailure, TimeoutError, toAuthFailure } from "@/lib/auth/errors";
import type { SessionUser } from "@/lib/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; failure: AuthFailure };

export interface AuthClient {
  requestCode(email: string): Promise<Result<void>>;
  verifyCode(email: string, code: string): Promise<Result<SessionUser>>;
  signOut(): Promise<Result<void>>;
}

/**
 * Rejects with a `TimeoutError` after `ms`.
 *
 * Without this a hung request leaves "la entrada" disabled forever, with the
 * spinner still turning and no way back — the failure mode 8.2 exists to
 * prevent.
 */
export function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error as Error);
      },
    );
  });
}

/** supabase-js answers with `{ error }` instead of rejecting, so both count. */
async function attempt<T>(work: () => Promise<{ error: unknown } & T>): Promise<
  Result<T>
> {
  try {
    const response = await withTimeout(work(), AUTH_TIMEOUT_MS);
    if (response.error) return { ok: false, failure: toAuthFailure(response.error) };
    return { ok: true, value: response };
  } catch (error) {
    return { ok: false, failure: toAuthFailure(error) };
  }
}

/**
 * The three auth operations this app performs, as an interface that never
 * throws and never returns a provider type.
 *
 * The seam is not decoration: this repository has no end-to-end runner, so the
 * only way Requirements 3 and 8 get tested at all is by handing the screens a
 * fake that fails on demand.
 */
export function createSupabaseAuthClient(
  client: SupabaseClient = createSupabaseBrowserClient(),
): AuthClient {
  return {
    async requestCode(email) {
      const result = await attempt(() =>
        client.auth.signInWithOtp({
          email,
          // The account is created on first sign-in; there is no separate
          // sign-up flow (2.5). It also keeps the answer identical for a known
          // and an unknown address (2.4).
          options: { shouldCreateUser: true },
        }),
      );
      return result.ok ? { ok: true, value: undefined } : result;
    },

    async verifyCode(email, code) {
      const result = await attempt(() =>
        client.auth.verifyOtp({ email, token: code, type: "email" }),
      );
      if (!result.ok) return result;

      const user = result.value.data?.user;
      if (!user) return { ok: false, failure: { kind: "unknown" } };

      return {
        ok: true,
        // `SessionUser.email` is non-empty by contract: the header shows it.
        value: { id: user.id, email: user.email ?? email },
      };
    },

    async signOut() {
      try {
        const { error } = await withTimeout(client.auth.signOut(), AUTH_TIMEOUT_MS);
        if (!error) return { ok: true, value: undefined };
      } catch {
        // Fall through to the local sign-out below.
      }

      /*
       * The server could not be told. Drop the credential on this device
       * anyway and report success: failing closed is the safe direction when
       * the point of the action is to stop someone reading this book (6.4).
       */
      try {
        await withTimeout(client.auth.signOut({ scope: "local" }), AUTH_TIMEOUT_MS);
      } catch {
        // Nothing left to try; the session context navigates away regardless.
      }
      return { ok: true, value: undefined };
    },
  };
}
