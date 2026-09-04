import { RESEND_COOLDOWN_SECONDS } from "@/lib/auth/config";

export type AuthFailure =
  | { kind: "empty-email" }
  | { kind: "invalid-email" }
  | { kind: "rate-limited" }
  /** The provider conflates "wrong" and "expired"; the reducer refines it. */
  | { kind: "code-unverified" }
  | { kind: "code-rejected" }
  | { kind: "code-expired" }
  | { kind: "unreachable" }
  | { kind: "timeout" }
  | { kind: "unknown" };

/** Thrown by `withTimeout` when the auth service does not answer in time (8.2). */
export class TimeoutError extends Error {
  constructor() {
    super("La solicitud al servicio de autenticación superó el tiempo de espera.");
    this.name = "TimeoutError";
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

function statusOf(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

/**
 * Everything the auth service can throw, reduced to the closed set above.
 *
 * Matching on message text is unpleasant but unavoidable in one case: GoTrue
 * answers a wrong code and an expired code with the same 403 and the same
 * sentence. That is mapped to `code-unverified` and refined by the reducer,
 * which knows when the code was sent.
 */
export function toAuthFailure(error: unknown): AuthFailure {
  if (error instanceof TimeoutError) return { kind: "timeout" };

  // A rejected `fetch` is a TypeError in every runtime this app targets.
  if (error instanceof TypeError) return { kind: "unreachable" };

  const status = statusOf(error);
  if (status === 429) return { kind: "rate-limited" };

  const message = messageOf(error);
  if (/token has expired or is invalid|otp_expired|invalid[_ ]token/i.test(message)) {
    return { kind: "code-unverified" };
  }
  if (/rate limit/i.test(message)) return { kind: "rate-limited" };
  if (/failed to fetch|network|fetch failed|ECONNREFUSED/i.test(message)) {
    return { kind: "unreachable" };
  }

  return { kind: "unknown" };
}

const UNREACHABLE = "No pudimos conectarnos con el servicio. Intenta de nuevo.";
const DEV_HINT = "¿Está corriendo el stack local? Arráncalo con supabase start.";

/**
 * The only text a user ever sees for a failure.
 *
 * No provider string is ever passed through (7.6), and no message names or
 * blames an address (2.4, 3.7) — the two rules that keep "la entrada" from
 * telling a stranger which addresses have accounts.
 */
export function describeFailure(failure: AuthFailure, isDevelopment: boolean): string {
  switch (failure.kind) {
    case "empty-email":
      return "Escribe tu correo.";
    case "invalid-email":
      return "Ese correo no parece válido.";
    case "rate-limited":
      return `Ya te enviamos un código. Espera ${RESEND_COOLDOWN_SECONDS} segundos para pedir otro.`;
    case "code-rejected":
    // `code-unverified` should be refined before it reaches a screen; if it
    // ever does not, the safer of the two readings is that the code is wrong.
    case "code-unverified":
      return "Ese código no es. Revísalo e intenta de nuevo.";
    case "code-expired":
      return "El código venció. Pide uno nuevo.";
    case "unreachable":
    case "timeout":
      return isDevelopment ? `${UNREACHABLE} ${DEV_HINT}` : UNREACHABLE;
    case "unknown":
      return "Algo falló al entrar. Intenta de nuevo.";
  }
}
