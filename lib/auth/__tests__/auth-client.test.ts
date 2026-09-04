import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAuthClient, withTimeout } from "@/lib/auth/auth-client";
import { AUTH_TIMEOUT_MS } from "@/lib/auth/config";
import { TimeoutError } from "@/lib/auth/errors";

interface AuthStub {
  signInWithOtp: ReturnType<typeof vi.fn>;
  verifyOtp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
}

/** The three methods this app touches, shaped like supabase-js. */
function stub(overrides: Partial<AuthStub> = {}): {
  client: SupabaseClient;
  auth: AuthStub;
} {
  const auth: AuthStub = {
    signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    verifyOtp: vi.fn().mockResolvedValue({
      data: { user: { id: "u-1", email: "juanse@lab10.ai" } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };

  return { client: { auth } as unknown as SupabaseClient, auth };
}

describe("requestCode (2.2, 2.5)", () => {
  it("asks for a code and lets the first sign-in create the account", async () => {
    const { client, auth } = stub();

    const result = await createSupabaseAuthClient(client).requestCode("juanse@lab10.ai");

    expect(result).toEqual({ ok: true, value: undefined });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "juanse@lab10.ai",
      options: { shouldCreateUser: true },
    });
  });

  it("reports a returned error as a failure instead of throwing", async () => {
    // supabase-js answers with `{ error }` rather than rejecting, so a client
    // that only caught rejections would treat every refusal as a success.
    const { client } = stub({
      signInWithOtp: vi.fn().mockResolvedValue({
        data: {},
        error: Object.assign(new Error("email rate limit exceeded"), { status: 429 }),
      }),
    });

    expect(await createSupabaseAuthClient(client).requestCode("juanse@lab10.ai")).toEqual({
      ok: false,
      failure: { kind: "rate-limited" },
    });
  });

  it("reports a rejection as a failure instead of throwing (8.1)", async () => {
    const { client } = stub({
      signInWithOtp: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    });

    expect(await createSupabaseAuthClient(client).requestCode("juanse@lab10.ai")).toEqual({
      ok: false,
      failure: { kind: "unreachable" },
    });
  });
});

describe("verifyCode (3.3)", () => {
  it("verifies the code as an email OTP and returns the account", async () => {
    const { client, auth } = stub();

    const result = await createSupabaseAuthClient(client).verifyCode(
      "juanse@lab10.ai",
      "481902",
    );

    expect(result).toEqual({
      ok: true,
      value: { id: "u-1", email: "juanse@lab10.ai" },
    });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: "juanse@lab10.ai",
      token: "481902",
      type: "email",
    });
  });

  it("maps the conflated wrong/expired error without deciding which (3.4, 3.5)", async () => {
    const { client } = stub({
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: null },
        error: Object.assign(new Error("Token has expired or is invalid"), {
          status: 403,
        }),
      }),
    });

    expect(
      await createSupabaseAuthClient(client).verifyCode("juanse@lab10.ai", "000000"),
    ).toEqual({ ok: false, failure: { kind: "code-unverified" } });
  });

  it("treats a session without a user as unknown rather than crashing", async () => {
    const { client } = stub({
      verifyOtp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    });

    expect(
      await createSupabaseAuthClient(client).verifyCode("juanse@lab10.ai", "481902"),
    ).toEqual({ ok: false, failure: { kind: "unknown" } });
  });

  it("falls back to the submitted address when the account carries none", async () => {
    // `SessionUser.email` is non-empty by contract — the header shows it.
    const { client } = stub({
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: { id: "u-2", email: null } },
        error: null,
      }),
    });

    expect(
      await createSupabaseAuthClient(client).verifyCode("juanse@lab10.ai", "481902"),
    ).toEqual({ ok: true, value: { id: "u-2", email: "juanse@lab10.ai" } });
  });
});

describe("signOut (6.4)", () => {
  it("ends the session", async () => {
    const { client, auth } = stub();

    expect(await createSupabaseAuthClient(client).signOut()).toEqual({
      ok: true,
      value: undefined,
    });
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("falls back to a local sign-out when the server refuses, and still succeeds", async () => {
    // Failing closed: the credential must leave this device even when the
    // server cannot be told about it.
    const signOut = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ error: null });
    const { client } = stub({ signOut });

    expect(await createSupabaseAuthClient(client).signOut()).toEqual({
      ok: true,
      value: undefined,
    });
    expect(signOut).toHaveBeenNthCalledWith(2, { scope: "local" });
  });

  it("still reports success when even the local sign-out fails", async () => {
    const { client } = stub({
      signOut: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    });

    expect(await createSupabaseAuthClient(client).signOut()).toEqual({
      ok: true,
      value: undefined,
    });
  });
});

describe("withTimeout (8.2)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("rejects with a TimeoutError once AUTH_TIMEOUT_MS has passed", async () => {
    const pending = withTimeout(new Promise<never>(() => {}), AUTH_TIMEOUT_MS);
    const assertion = expect(pending).rejects.toBeInstanceOf(TimeoutError);

    await vi.advanceTimersByTimeAsync(AUTH_TIMEOUT_MS);
    await assertion;
  });

  it("passes a settled promise through untouched", async () => {
    await expect(withTimeout(Promise.resolve("listo"), AUTH_TIMEOUT_MS)).resolves.toBe(
      "listo",
    );
  });

  it("gives a hung request the same failure a dead service gets", async () => {
    const { client } = stub({
      signInWithOtp: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const pending = createSupabaseAuthClient(client).requestCode("juanse@lab10.ai");

    await vi.advanceTimersByTimeAsync(AUTH_TIMEOUT_MS);

    expect(await pending).toEqual({ ok: false, failure: { kind: "timeout" } });
  });
});
