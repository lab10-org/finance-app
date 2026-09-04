"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SessionUser } from "@/lib/auth/types";

export interface SessionValue {
  user: SessionUser;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  value,
  children,
}: {
  value: SessionValue;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * `null` outside a provider — deliberately not a throw, unlike `useBook()`.
 *
 * Every v1 test renders `BookScreen` without a session, and none of them is
 * about accounts. Throwing here would break them all to prove nothing; instead
 * `AccountControl` simply renders nothing when there is no session.
 */
export function useSession(): SessionValue | null {
  return useContext(SessionContext);
}
