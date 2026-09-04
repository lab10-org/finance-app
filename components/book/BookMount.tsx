"use client";

import dynamic from "next/dynamic";

import type { SessionUser } from "@/lib/auth/types";

/*
 * The book's day strips depend on today's date (1.4 of the prototype), so
 * server-rendering it risks a hydration mismatch across midnight or a timezone
 * gap. That is why it is client-only — and why the `ssr: false` call lives
 * here rather than in `app/page.tsx`: a Server Component may not make it, and
 * the page had to become one so the session could be known before anything is
 * painted (4.4).
 */
const BookApp = dynamic(() => import("./BookApp"), { ssr: false });

export default function BookMount({ user }: { user: SessionUser }) {
  return <BookApp user={user} />;
}
