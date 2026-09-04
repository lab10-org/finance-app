"use client";

import { useEffect, useReducer, useRef } from "react";

import type { AuthClient } from "@/lib/auth/auth-client";
import { describeFailure } from "@/lib/auth/errors";
import {
  cooldownRemaining,
  entradaReducer,
  initialEntradaState,
} from "@/lib/auth/entrada-machine";

import { CodeStep } from "./CodeStep";
import { EmailStep } from "./EmailStep";
import styles from "./Entrada.module.css";

export interface EntradaProps {
  client: AuthClient;
  /** Called after a successful verification; the mount navigates to "/". */
  onSignedIn: () => void;
  /** Injected so tests are not at the mercy of the wall clock. */
  now?: () => number;
  isDevelopment?: boolean;
}

export function Entrada({
  client,
  onSignedIn,
  now = Date.now,
  isDevelopment = process.env.NODE_ENV === "development",
}: EntradaProps) {
  const [state, dispatch] = useReducer(entradaReducer, undefined, initialEntradaState);

  /*
   * The reducer decides *that* a request should happen by moving into
   * "sending" or "verifying"; this effect is what actually performs it. Keeping
   * the network out of the reducer is what leaves the reducer pure enough to
   * table-test, which is where most of Requirement 3 is verified.
   */
  const inFlight = useRef(false);

  useEffect(() => {
    if (state.status === "idle") {
      inFlight.current = false;
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;

    let cancelled = false;
    const status = state.status;
    const { email, code } = state;

    void (async () => {
      const result =
        status === "sending"
          ? await client.requestCode(email)
          : await client.verifyCode(email, code);

      if (cancelled) return;
      inFlight.current = false;

      if (!result.ok) {
        dispatch({ type: "failed", failure: result.failure, now: now() });
        return;
      }

      if (status === "sending") {
        dispatch({ type: "codeSent", now: now() });
      } else {
        dispatch({ type: "verified" });
        onSignedIn();
      }
    })();

    return () => {
      cancelled = true;
    };
    // `state.email` and `state.code` are read at dispatch time and never change
    // while a request is in flight, so `status` is the only real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  /*
   * The cooldown is derived from the clock, not stored, so nothing would
   * re-render as it runs down and the countdown would sit frozen at 60. This
   * ticks once a second only while there is something to count.
   */
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const cooldown = cooldownRemaining(state, now());

  useEffect(() => {
    if (state.step !== "code" || cooldown === 0) return;
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [state.step, cooldown]);

  const message = state.failure ? describeFailure(state.failure, isDevelopment) : null;
  const busy = state.status !== "idle";

  return (
    <main className={styles.shell}>
      <div className={styles.column}>
        <header className={styles.header}>
          <h1 className={styles.title}>Tu libro de gastos</h1>
          <p className={styles.subtitle}>
            {state.step === "email"
              ? "Entra con tu correo. No necesitas contraseña."
              : "Escribe el código para entrar."}
          </p>
        </header>

        {state.step === "email" ? (
          <EmailStep
            email={state.email}
            busy={busy}
            message={message}
            onChange={(value) => dispatch({ type: "editEmail", value })}
            onSubmit={() => dispatch({ type: "submitEmail" })}
          />
        ) : (
          <CodeStep
            email={state.email}
            code={state.code}
            busy={busy}
            message={message}
            cooldown={cooldown}
            onChange={(value) => dispatch({ type: "editCode", value })}
            onSubmit={() => dispatch({ type: "submitCode" })}
            onResend={() => dispatch({ type: "resend", now: now() })}
            onBack={() => dispatch({ type: "backToEmail" })}
          />
        )}
      </div>
    </main>
  );
}
