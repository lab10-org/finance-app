"use client";

import type { SessionUser } from "@/lib/auth/types";
import { BookProvider } from "@/state/book-store";

import BookScreen from "./BookScreen";

/**
 * The mounted application: the store and the book together. Kept as one
 * component so nothing can mount the screen without its provider.
 *
 * `BookProvider` is keyed by the account, so a different person signing in on
 * the same device can never inherit the previous one's reducer state (6.3).
 */
export default function BookApp({ user }: { user: SessionUser }) {
  return (
    <BookProvider key={user.id}>
      <BookScreen />
    </BookProvider>
  );
}
