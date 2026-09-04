"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface SessionGuardProps {
  /** Returns an unsubscribe function. Injected so tests can fire the event. */
  subscribe: (onSessionEnded: () => void) => () => void;
  onSessionEnded: () => void;
  children: ReactNode;
}

/**
 * Takes "el libro" off the screen the instant the session ends.
 *
 * Rendering `null` unmounts `BookProvider` along with everything under it, so
 * every figure leaves the DOM in the same commit rather than lingering while a
 * navigation is in flight (5.6, 6.3).
 */
export function SessionGuard({ subscribe, onSessionEnded, children }: SessionGuardProps) {
  const [ended, setEnded] = useState(false);
  const reported = useRef(false);

  useEffect(() => {
    return subscribe(() => {
      // Supabase can emit SIGNED_OUT more than once; the navigation that
      // follows must happen exactly once.
      if (reported.current) return;
      reported.current = true;
      setEnded(true);
      onSessionEnded();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ended ? null : <>{children}</>;
}
