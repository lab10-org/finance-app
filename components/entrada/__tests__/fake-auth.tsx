import { render } from "@testing-library/react";
import type { Mock } from "vitest";

import { Entrada } from "@/components/entrada/Entrada";
import type { AuthClient } from "@/lib/auth/auth-client";

/*
 * A hand-written fake, not a mock of the Supabase module. The whole reason
 * `AuthClient` exists is that this repository has no end-to-end runner: the
 * only way Requirements 3 and 8 get tested is by handing "la entrada" a client
 * that succeeds, fails or hangs on demand.
 */
/** Every method of `AuthClient`, still callable as itself but spy-able. */
export type FakeAuthClient = {
  [K in keyof AuthClient]: Mock<AuthClient[K]>;
};

export function createFakeAuthClient(): FakeAuthClient {
  return {
    requestCode: vi.fn(async () => ({ ok: true as const, value: undefined })),
    verifyCode: vi.fn(async () => ({
      ok: true as const,
      value: { id: "u-1", email: "juanse@lab10.ai" },
    })),
    signOut: vi.fn(async () => ({ ok: true as const, value: undefined })),
  };
}

/** A controllable clock, so no test depends on the wall clock. */
export function createClock(start = 1_760_000_000_000) {
  let now = start;
  return {
    now: () => now,
    advanceSeconds: (seconds: number) => {
      now += seconds * 1000;
    },
  };
}

export function renderEntrada(
  options: {
    client?: FakeAuthClient;
    onSignedIn?: () => void;
    now?: () => number;
    isDevelopment?: boolean;
  } = {},
) {
  const client = options.client ?? createFakeAuthClient();
  const onSignedIn = options.onSignedIn ?? vi.fn();
  const clock = createClock();

  const result = render(
    <Entrada
      client={client}
      onSignedIn={onSignedIn}
      now={options.now ?? clock.now}
      isDevelopment={options.isDevelopment}
    />,
  );

  return { ...result, client, onSignedIn, clock };
}
