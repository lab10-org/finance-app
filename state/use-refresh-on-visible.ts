"use client";

import { useEffect, useRef } from "react";

/**
 * Re-reads the book when the app comes back to the foreground (9.2).
 *
 * `visibilitychange` rather than `focus`: focus fires when the user clicks back
 * into the window from another app on the same screen, which is not a moment the
 * data could have changed elsewhere, and it would refetch constantly on a
 * desktop. Visibility is the signal that the tab was actually away.
 *
 * The callback is held in a ref so that changing it does not tear down and
 * re-add the listener on every render.
 */
export function useRefreshOnVisible(refresh: () => void, enabled = true): void {
  const latest = useRef(refresh);
  latest.current = refresh;

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const onVisible = () => {
      if (document.visibilityState === "visible") latest.current();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled]);
}
