"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { ENTRADA_PATH } from "@/lib/auth/route-decision";
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
  const router = useRouter();

  // The router lives here rather than in BookApp so that BookApp stays
  // renderable in a plain jsdom test, with no app-router context to provide.
  const goToEntrada = useCallback(() => {
    router.replace(ENTRADA_PATH);
  }, [router]);

  return <BookApp user={user} onSignedOut={goToEntrada} />;
}
