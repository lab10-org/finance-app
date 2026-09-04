"use client";

import { useState } from "react";

import { useSession } from "@/state/session-context";

import { ConfirmSignOut } from "./ConfirmSignOut";
import styles from "./AccountControl.module.css";

/**
 * Who is signed in, and the way out — in the header slot the v1 search icon
 * vacated (6.1).
 *
 * Renders nothing without a session, which is what lets every v1 test keep
 * rendering `BookScreen` with no provider around it.
 */
export function AccountControl() {
  const session = useSession();
  const [asking, setAsking] = useState(false);

  if (!session) return null;

  return (
    <div className={styles.account}>
      <span className={styles.address} title={session.user.email}>
        {session.user.email}
      </span>
      <button
        type="button"
        className={styles.signOut}
        onClick={() => setAsking(true)}
      >
        Cerrar sesión
      </button>

      {asking ? (
        <ConfirmSignOut
          email={session.user.email}
          onDismiss={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            /*
             * `signOut` never rejects in production — the client falls back to
             * a local sign-out and reports success (6.4) — but a rejection
             * here must still not become an unhandled one, or the person is
             * left inside a book they asked to leave.
             */
            void session.signOut().catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
}
