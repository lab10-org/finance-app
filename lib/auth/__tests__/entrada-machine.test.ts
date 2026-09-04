import {
  CODE_LENGTH,
  CODE_TTL_SECONDS,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/config";
import type { AuthFailure } from "@/lib/auth/errors";
import {
  type EntradaState,
  codeHasExpired,
  cooldownRemaining,
  entradaReducer as reduce,
  initialEntradaState,
} from "@/lib/auth/entrada-machine";

const T0 = 1_760_000_000_000;
const s = (seconds: number) => T0 + seconds * 1000;

/** The state after a successful send: on the code step, clock started. */
function onCodeStep(overrides: Partial<EntradaState> = {}): EntradaState {
  let state = reduce(initialEntradaState(), {
    type: "editEmail",
    value: "juanse@lab10.ai",
  });
  state = reduce(state, { type: "submitEmail" });
  state = reduce(state, { type: "codeSent", now: T0 });
  return { ...state, ...overrides };
}

describe("the email step (2.3, 2.6)", () => {
  it("starts idle on the email step", () => {
    expect(initialEntradaState()).toEqual({
      step: "email",
      email: "",
      code: "",
      status: "idle",
      failure: null,
      codeSentAt: null,
    });
  });

  it("refuses an invalid address without leaving the step or going idle", () => {
    const state = reduce(
      reduce(initialEntradaState(), { type: "editEmail", value: "no-es-correo" }),
      { type: "submitEmail" },
    );

    expect(state.failure).toEqual({ kind: "invalid-email" });
    expect(state.status).toBe("idle");
    expect(state.step).toBe("email");
  });

  it("reports an empty address as empty, not as malformed", () => {
    const state = reduce(initialEntradaState(), { type: "submitEmail" });

    expect(state.failure).toEqual({ kind: "empty-email" });
  });

  it("goes to sending for a valid address", () => {
    const state = reduce(
      reduce(initialEntradaState(), { type: "editEmail", value: "juanse@lab10.ai" }),
      { type: "submitEmail" },
    );

    expect(state.status).toBe("sending");
    expect(state.failure).toBeNull();
  });

  it("ignores a second submit while one is in flight (2.6)", () => {
    const sending = reduce(
      reduce(initialEntradaState(), { type: "editEmail", value: "juanse@lab10.ai" }),
      { type: "submitEmail" },
    );

    expect(reduce(sending, { type: "submitEmail" })).toBe(sending);
  });

  it("clears a previous failure when the address is edited", () => {
    const failed = reduce(initialEntradaState(), { type: "submitEmail" });

    expect(reduce(failed, { type: "editEmail", value: "j" }).failure).toBeNull();
  });
});

describe("moving to the code step (3.1)", () => {
  it("records when the code was sent, and only on a successful send (3.6)", () => {
    const state = onCodeStep();

    expect(state.step).toBe("code");
    expect(state.codeSentAt).toBe(T0);
    expect(state.status).toBe("idle");
  });

  it("leaves codeSentAt null when the send failed, so no cooldown is earned", () => {
    const sending = reduce(
      reduce(initialEntradaState(), { type: "editEmail", value: "juanse@lab10.ai" }),
      { type: "submitEmail" },
    );
    const failed = reduce(sending, {
      type: "failed",
      failure: { kind: "unreachable" },
      now: T0,
    });

    expect(failed.codeSentAt).toBeNull();
    expect(failed.step).toBe("email");
  });

  it("returns to the email step keeping the address (3.1)", () => {
    const back = reduce(onCodeStep(), { type: "backToEmail" });

    expect(back.step).toBe("email");
    expect(back.email).toBe("juanse@lab10.ai");
  });
});

describe("a failure never moves the person or loses their typing (8.4)", () => {
  const kinds: AuthFailure["kind"][] = [
    "rate-limited",
    "unreachable",
    "timeout",
    "unknown",
    "code-expired",
  ];

  it.each(kinds)("keeps step and email for %s", (kind) => {
    const state = reduce(onCodeStep({ code: "4819" }), {
      type: "failed",
      failure: { kind } as AuthFailure,
      now: s(1),
    });

    expect(state.step).toBe("code");
    expect(state.email).toBe("juanse@lab10.ai");
    expect(state.status).toBe("idle");
  });

  it("keeps the typed code for every failure that is not a rejected code", () => {
    const state = reduce(onCodeStep({ code: "4819" }), {
      type: "failed",
      failure: { kind: "unreachable" },
      now: s(1),
    });

    expect(state.code).toBe("4819");
  });
});

describe("refining the provider's one ambiguous error (3.4, 3.5)", () => {
  it("reads it as a wrong code while the code is still alive, and clears the field", () => {
    const state = reduce(onCodeStep({ code: "000000" }), {
      type: "failed",
      failure: { kind: "code-unverified" },
      now: s(CODE_TTL_SECONDS - 1),
    });

    expect(state.failure).toEqual({ kind: "code-rejected" });
    expect(state.code).toBe("");
    expect(state.email).toBe("juanse@lab10.ai");
  });

  it("reads it as an expired code once the TTL has passed, and keeps the field", () => {
    const state = reduce(onCodeStep({ code: "481902" }), {
      type: "failed",
      failure: { kind: "code-unverified" },
      now: s(CODE_TTL_SECONDS + 1),
    });

    expect(state.failure).toEqual({ kind: "code-expired" });
    expect(state.code).toBe("481902");
  });

  it("reads it as a wrong code when no send was recorded", () => {
    const state = reduce(
      { ...onCodeStep({ code: "000000" }), codeSentAt: null },
      { type: "failed", failure: { kind: "code-unverified" }, now: s(99_999) },
    );

    expect(state.failure).toEqual({ kind: "code-rejected" });
  });
});

describe("the code field (3.2)", () => {
  it("drops everything that is not a digit", () => {
    expect(reduce(onCodeStep(), { type: "editCode", value: "4-8 1a9" }).code).toBe("4819");
  });

  it("truncates beyond CODE_LENGTH", () => {
    const code = reduce(onCodeStep(), { type: "editCode", value: "1234567890" }).code;

    expect(code).toBe("123456");
    expect(code).toHaveLength(CODE_LENGTH);
  });

  it("truncates a pasted code that carries separators", () => {
    expect(reduce(onCodeStep(), { type: "editCode", value: "481 902 77" }).code).toBe(
      "481902",
    );
  });

  it("goes to verifying on submit, and ignores a second submit", () => {
    const verifying = reduce(onCodeStep({ code: "481902" }), { type: "submitCode" });

    expect(verifying.status).toBe("verifying");
    expect(reduce(verifying, { type: "submitCode" })).toBe(verifying);
  });
});

describe("asking for another code (3.6)", () => {
  it("is ignored while the cooldown is still running", () => {
    const state = onCodeStep();

    expect(reduce(state, { type: "resend", now: s(RESEND_COOLDOWN_SECONDS - 1) })).toBe(
      state,
    );
  });

  it("sends again once the cooldown has elapsed", () => {
    const state = reduce(onCodeStep(), {
      type: "resend",
      now: s(RESEND_COOLDOWN_SECONDS),
    });

    expect(state.status).toBe("sending");
    expect(state.failure).toBeNull();
  });
});

describe("cooldownRemaining (2.7, 3.6)", () => {
  it.each([
    [0, RESEND_COOLDOWN_SECONDS],
    [59, 1],
    [60, 0],
    [601, 0],
  ])("is %i s after the send -> %i s left", (elapsed, expected) => {
    expect(cooldownRemaining(onCodeStep(), s(elapsed))).toBe(expected);
  });

  it("is 0 before any code was sent", () => {
    expect(cooldownRemaining(initialEntradaState(), T0)).toBe(0);
  });
});

describe("codeHasExpired (3.5)", () => {
  it.each([
    [0, false],
    [59, false],
    [599, false],
    [CODE_TTL_SECONDS, true],
    [601, true],
  ])("at %i s -> %s", (elapsed, expected) => {
    expect(codeHasExpired(onCodeStep(), s(elapsed))).toBe(expected);
  });

  it("is false before any code was sent", () => {
    expect(codeHasExpired(initialEntradaState(), T0)).toBe(false);
  });
});
