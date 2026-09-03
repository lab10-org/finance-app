"use client";

import { BookProvider } from "@/state/book-store";

import BookScreen from "./BookScreen";

/**
 * The mounted application: the store and the book together. Kept as one
 * component so nothing can mount the screen without its provider.
 */
export default function BookApp() {
  return (
    <BookProvider>
      <BookScreen />
    </BookProvider>
  );
}
