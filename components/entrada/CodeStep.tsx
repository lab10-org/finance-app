"use client";

import { useEffect, useRef } from "react";

import { CODE_LENGTH } from "@/lib/auth/config";

import styles from "./Entrada.module.css";

export interface CodeStepProps {
  email: string;
  code: string;
  busy: boolean;
  message: string | null;
  /** Seconds until another code may be requested; 0 enables the resend. */
  cooldown: number;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onBack: () => void;
}

const MESSAGE_ID = "entrada-code-error";

export function CodeStep({
  email,
  code,
  busy,
  message,
  cooldown,
  onChange,
  onSubmit,
  onResend,
  onBack,
}: CodeStepProps) {
  const fieldRef = useRef<HTMLInputElement>(null);

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
      {/* 3.1: say where it went, and offer the way back to fix a typo. */}
      <p className={styles.sentTo}>
        Te enviamos un código de {CODE_LENGTH} dígitos a{" "}
        <span className={styles.address}>{email}</span>.
      </p>

      <label className={styles.label} htmlFor="entrada-code">
        Código
      </label>
      <input
        ref={fieldRef}
        id="entrada-code"
        className={`${styles.field} ${styles.num}`}
        value={code}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        placeholder="••••••"
        aria-describedby={message ? MESSAGE_ID : undefined}
        aria-invalid={message ? true : undefined}
      />

      {message ? (
        <p id={MESSAGE_ID} className={styles.message} role="alert">
          {message}
        </p>
      ) : null}

      <button type="submit" className={styles.primary} disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onBack}>
          Cambiar correo
        </button>
        {/*
         * 3.6: the wait is stated, not merely enforced. The number comes from
         * RESEND_COOLDOWN_SECONDS, never from the provider's English error.
         */}
        <button
          type="button"
          className={styles.secondary}
          onClick={onResend}
          disabled={cooldown > 0 || busy}
        >
          {cooldown > 0 ? `Puedes pedir otro en ${cooldown} s` : "Enviar otro código"}
        </button>
      </div>
    </form>
  );
}
