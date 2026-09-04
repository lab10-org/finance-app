import {
  CODE_LENGTH,
  CODE_TTL_SECONDS,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/config";
import type { AuthFailure } from "@/lib/auth/errors";
import { validateEmail } from "@/lib/auth/validate-email";

export interface EntradaState {
  step: "email" | "code";
  email: string;
  code: string;
  status: "idle" | "sending" | "verifying";
  failure: AuthFailure | null;
  /** Epoch ms of the last *successful* send; drives expiry and cooldown. */
  codeSentAt: number | null;
}

export type EntradaAction =
  | { type: "editEmail"; value: string }
  | { type: "submitEmail" }
  | { type: "codeSent"; now: number }
  | { type: "editCode"; value: string }
  | { type: "submitCode" }
  | { type: "verified" }
  | { type: "failed"; failure: AuthFailure; now: number }
  | { type: "resend"; now: number }
  | { type: "backToEmail" };

export function initialEntradaState(): EntradaState {
  return {
    step: "email",
    email: "",
    code: "",
    status: "idle",
    failure: null,
    codeSentAt: null,
  };
}

/** Seconds left before another code may be requested; 0 when free. */
export function cooldownRemaining(state: EntradaState, now: number): number {
  if (state.codeSentAt === null) return 0;
  const elapsed = Math.floor((now - state.codeSentAt) / 1000);
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
}

/** True once CODE_TTL_SECONDS have passed since `codeSentAt`. */
export function codeHasExpired(state: EntradaState, now: number): boolean {
  if (state.codeSentAt === null) return false;
  return (now - state.codeSentAt) / 1000 >= CODE_TTL_SECONDS;
}

/**
 * GoTrue answers a wrong code and an expired one identically, so the only
 * clock that can tell them apart is ours. Past the TTL the code is certainly
 * dead; before it, the likeliest reading is that six digits were mistyped.
 */
function refine(
  failure: AuthFailure,
  state: EntradaState,
  now: number,
): AuthFailure {
  if (failure.kind !== "code-unverified") return failure;
  return codeHasExpired(state, now)
    ? { kind: "code-expired" }
    : { kind: "code-rejected" };
}

export function entradaReducer(
  state: EntradaState,
  action: EntradaAction,
): EntradaState {
  switch (action.type) {
    case "editEmail":
      return { ...state, email: action.value, failure: null };

    case "submitEmail": {
      // 2.6: one impatient double-tap must not send two codes.
      if (state.status !== "idle") return state;

      const failure = validateEmail(state.email);
      // 2.3: an obviously malformed address never leaves the device.
      if (failure) return { ...state, failure };

      return { ...state, status: "sending", failure: null };
    }

    case "codeSent":
      return {
        ...state,
        step: "code",
        status: "idle",
        failure: null,
        code: "",
        codeSentAt: action.now,
      };

    case "editCode":
      // 3.2: digits only, capped — dropped on input rather than rejected on
      // submit, so a pasted code with separators simply works.
      return {
        ...state,
        code: action.value.replace(/\D/g, "").slice(0, CODE_LENGTH),
        failure: null,
      };

    case "submitCode": {
      if (state.status !== "idle") return state;
      return { ...state, status: "verifying", failure: null };
    }

    case "verified":
      return { ...state, status: "idle", failure: null };

    case "failed": {
      const failure = refine(action.failure, state, action.now);
      return {
        ...state,
        status: "idle",
        failure,
        /*
         * 8.4 says preserve what they typed; 3.4 says clear the field. The
         * more specific rule wins for the code field, and only for the one
         * failure that means "those six digits were wrong" — 8.4 still governs
         * the address, which is never cleared here.
         */
        code: failure.kind === "code-rejected" ? "" : state.code,
      };
    }

    case "resend": {
      if (state.status !== "idle") return state;
      // 3.6: the cooldown is enforced here, not only in the disabled button,
      // so no request can leave the device early.
      if (cooldownRemaining(state, action.now) > 0) return state;
      return { ...state, status: "sending", failure: null };
    }

    case "backToEmail":
      // 3.1: the way back keeps the address, so correcting a typo is one edit.
      return { ...state, step: "email", status: "idle", failure: null, code: "" };

    default:
      return state;
  }
}
