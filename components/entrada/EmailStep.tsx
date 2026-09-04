"use client";

import { useEffect, useRef } from "react";

import styles from "./Entrada.module.css";

export interface EmailStepProps {
  email: string;
  busy: boolean;
  message: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const MESSAGE_ID = "entrada-email-error";

export function EmailStep({ email, busy, message, onChange, onSubmit }: EmailStepProps) {
  const fieldRef = useRef<HTMLInputElement>(null);

  // 2.1: the field is focused on arrival, so the first tap is already typing.
  useEffect(() => {
    fieldRef.current?.focus();
  }, []);

  return (
    <form
      className={styles.step}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <label className={styles.label} htmlFor="entrada-email">
        Correo
      </label>
      <input
        ref={fieldRef}
        id="entrada-email"
        className={styles.field}
        value={email}
        onChange={(event) => onChange(event.target.value)}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="tu@correo.com"
        aria-describedby={message ? MESSAGE_ID : undefined}
        aria-invalid={message ? true : undefined}
      />

      {message ? (
        <p id={MESSAGE_ID} className={styles.message} role="alert">
          {message}
        </p>
      ) : null}

      <button type="submit" className={styles.primary} disabled={busy}>
        {busy ? "Enviando…" : "Enviar código"}
      </button>
    </form>
  );
}
