import { RESEND_COOLDOWN_SECONDS } from "@/lib/auth/config";
import {
  type AuthFailure,
  TimeoutError,
  describeFailure,
  toAuthFailure,
} from "@/lib/auth/errors";

/** Every kind, so a new one added without copy fails this file. */
const ALL_KINDS: AuthFailure["kind"][] = [
  "empty-email",
  "invalid-email",
  "rate-limited",
  "code-unverified",
  "code-rejected",
  "code-expired",
  "unreachable",
  "timeout",
  "unknown",
];

describe("toAuthFailure (8.1, 8.2)", () => {
  it("maps a 429 from the auth service to rate-limited (2.7)", () => {
    const error = Object.assign(new Error("email rate limit exceeded"), {
      name: "AuthApiError",
      status: 429,
      code: "over_email_send_rate_limit",
    });

    expect(toAuthFailure(error)).toEqual({ kind: "rate-limited" });
  });

  it("maps a failed fetch to unreachable", () => {
    expect(toAuthFailure(new TypeError("Failed to fetch"))).toEqual({
      kind: "unreachable",
    });
  });

  it("maps our own timeout to timeout", () => {
    expect(toAuthFailure(new TimeoutError())).toEqual({ kind: "timeout" });
  });

  it("maps the conflated invalid/expired error to code-unverified (3.4, 3.5)", () => {
    // GoTrue answers the same way for a wrong code and an expired one; only
    // the reducer, with the client's own clock, can tell them apart.
    const error = Object.assign(new Error("Token has expired or is invalid"), {
      name: "AuthApiError",
      status: 403,
    });

    expect(toAuthFailure(error)).toEqual({ kind: "code-unverified" });
  });

  it("maps anything it does not recognise to unknown", () => {
    expect(toAuthFailure({})).toEqual({ kind: "unknown" });
    expect(toAuthFailure(null)).toEqual({ kind: "unknown" });
    expect(toAuthFailure("boom")).toEqual({ kind: "unknown" });
  });
});

describe("describeFailure (7.4, 7.6)", () => {
  it("has Spanish copy for every kind", () => {
    for (const kind of ALL_KINDS) {
      const message = describeFailure({ kind } as AuthFailure, false);
      expect(message.length).toBeGreaterThan(0);
      expect(message).toMatch(/[a-záéíóúñ]/i);
    }
  });

  it("never leaks the auth provider's own English text", () => {
    const providerWords = /Token|invalid|rate limit|Failed to fetch|Error:/i;

    for (const kind of ALL_KINDS) {
      expect(describeFailure({ kind } as AuthFailure, false)).not.toMatch(providerWords);
    }
  });

  it("never names an address, for any kind (2.4, 3.7)", () => {
    for (const kind of ALL_KINDS) {
      expect(describeFailure({ kind } as AuthFailure, true)).not.toContain("@");
    }
  });

  it("states the cooldown in seconds when rate-limited (2.7)", () => {
    const message = describeFailure({ kind: "rate-limited" }, false);

    expect(message).toContain(String(RESEND_COOLDOWN_SECONDS));
  });

  it("adds the stopped-stack hint only in development (8.3)", () => {
    expect(describeFailure({ kind: "unreachable" }, true)).toContain("supabase start");
    expect(describeFailure({ kind: "unreachable" }, false)).not.toContain("supabase start");
  });

  it("gives a timeout the same message and the same retry as unreachable (8.2)", () => {
    expect(describeFailure({ kind: "timeout" }, false)).toBe(
      describeFailure({ kind: "unreachable" }, false),
    );
  });

  it("distinguishes a rejected code from an expired one (3.4, 3.5)", () => {
    const rejected = describeFailure({ kind: "code-rejected" }, false);
    const expired = describeFailure({ kind: "code-expired" }, false);

    expect(rejected).not.toBe(expired);
    // Neither blames the address — the person only ever mistyped six digits.
    expect(rejected).not.toMatch(/correo/i);
    expect(expired).not.toMatch(/correo/i);
  });
});
