"use client";

import { useEffect, useRef } from "react";

import styles from "./ConfirmSignOut.module.css";

export interface ConfirmSignOutProps {
  email: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Asks before ending the session, showing the full address while it asks.
 *
 * A native `<dialog>` opened with `showModal()`, like `ExpenseSheet`: the focus
 * trap, Escape and the inert background come for free.
 */
export function ConfirmSignOut({ email, onConfirm, onDismiss }: ConfirmSignOutProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal?.();
  }, []);

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onDismiss}>
      <p className={styles.question}>¿Cerrar sesión?</p>
      <p className={styles.detail}>
        Estás dentro como <span className={styles.address}>{email}</span>. Vas a
        volver a la pantalla de entrada.
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onDismiss}>
          Cancelar
        </button>
        {/*
          Reads "Sí, cerrar sesión", not "Cerrar sesión": the header control
          carries that exact name, and two buttons sharing it would be
          ambiguous both to a screen reader and to a test.
        */}
        <button type="button" className={styles.confirm} onClick={onConfirm}>
          Sí, cerrar sesión
        </button>
      </div>
    </dialog>
  );
}
