"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Entrada } from "@/components/entrada/Entrada";
import { createSupabaseAuthClient } from "@/lib/auth/auth-client";

/**
 * Builds the real `AuthClient` and navigates once the session exists.
 *
 * `Entrada` itself takes the client as a prop and never imports Supabase, which
 * is what lets the whole two-step flow be tested against a fake.
 */
export default function EntradaMount() {
  const router = useRouter();
  const client = useMemo(() => createSupabaseAuthClient(), []);

  return (
    <Entrada
      client={client}
      onSignedIn={() => {
        /*
         * `replace`, not `push`: "la entrada" must not sit in the history for
         * the back gesture to return to. `refresh` then re-runs the Server
         * Component with the cookies the browser client just wrote.
         */
        router.replace("/");
        router.refresh();
      }}
    />
  );
}
