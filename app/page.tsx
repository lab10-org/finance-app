"use client";

import dynamic from "next/dynamic";

import styles from "./page.module.css";

/*
 * The book's day strips depend on today's date (1.4), so server-rendering it
 * risks a hydration mismatch across midnight or a timezone gap. The server
 * paints only the shell; the book itself is client-only.
 */
const BookApp = dynamic(() => import("@/components/book/BookApp"), {
  ssr: false,
});

export default function Page() {
  return (
    <main className={styles.shell}>
      <BookApp />
    </main>
  );
}
