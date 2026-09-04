"use client";

import { useMemo } from "react";

import { createSupabaseAuthClient } from "@/lib/auth/auth-client";
import { subscribeToSessionEnd } from "@/lib/auth/session-events";
import type { SessionUser } from "@/lib/auth/types";
import type { InitialBook } from "@/lib/expenses/initial-book";
import { SessionProvider } from "@/state/session-context";
import { BookProvider } from "@/state/book-store";

import BookScreen from "./BookScreen";
import { SessionGuard } from "./SessionGuard";

export interface BookAppProps {
  user: SessionUser;
  /** The window the server already read (3.1). */
  initial: InitialBook;
  /**
   * Where to go once there is no session. Supplied by `BookMount`, which owns
   * the router — keeping `useRouter` out of here is what lets this component
   * be rendered in a plain jsdom test.
   */
  onSignedOut?: () => void;
  /** Injected in tests; production uses the real Supabase subscription. */
  subscribe?: (onSessionEnded: () => void) => () => void;
}

/**
 * The mounted application: the session, its guard and the store together. Kept
 * as one component so nothing can mount the screen without its providers.
 */
export default function BookApp({
  user,
  initial,
  onSignedOut = () => {},
  subscribe = subscribeToSessionEnd,
}: BookAppProps) {
  const value = useMemo(
    () => ({
      user,
      signOut: async () => {
        // `createSupabaseAuthClient().signOut()` never throws and always drops
        // the local credential, so this leaves whatever the server answered
        // (6.4). The guard's subscription handles the unmount.
        await createSupabaseAuthClient().signOut();
        onSignedOut();
      },
    }),
    [user, onSignedOut],
  );

  return (
    <SessionProvider value={value}>
      <SessionGuard subscribe={subscribe} onSessionEnded={onSignedOut}>
        {/*
          Keyed by the account, so a different person signing in on this device
          can never inherit the previous one's reducer state (6.3).
        */}
        <BookProvider
          key={user.id}
          today={initial.today}
          expenses={initial.expenses}
        >
          <BookScreen />
        </BookProvider>
      </SessionGuard>
    </SessionProvider>
  );
}
