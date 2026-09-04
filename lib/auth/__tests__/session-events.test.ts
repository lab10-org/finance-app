import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { subscribeToSessionEnd } from "@/lib/auth/session-events";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Handler = (event: AuthChangeEvent, session: Session | null) => void;

/**
 * Captures the handler Supabase would call, so the events can be replayed.
 * The browser client is memoised per module load, so patching the instance
 * reaches the one `subscribeToSessionEnd` will use.
 */
function captureHandler() {
  const unsubscribe = vi.fn();
  let handler: Handler = () => {};

  const client = createSupabaseBrowserClient();
  vi.spyOn(client.auth, "onAuthStateChange").mockImplementation((callback) => {
    handler = callback as Handler;
    return {
      data: { subscription: { id: "sub-1", callback, unsubscribe } },
    } as unknown as ReturnType<typeof client.auth.onAuthStateChange>;
  });

  return { fire: (event: AuthChangeEvent) => handler(event, null), unsubscribe };
}

afterEach(() => vi.restoreAllMocks());

describe("subscribeToSessionEnd (5.5, 5.6)", () => {
  it("reports a sign-out", () => {
    const onEnded = vi.fn();
    const { fire } = captureHandler();
    subscribeToSessionEnd(onEnded);

    fire("SIGNED_OUT");

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("ignores the INITIAL_SESSION that arrives on subscribing", () => {
    /*
     * Supabase emits this immediately, with a null session when there is none.
     * An earlier version treated a null session as an ending, which blanked
     * the book the moment it mounted.
     */
    const onEnded = vi.fn();
    const { fire } = captureHandler();
    subscribeToSessionEnd(onEnded);

    fire("INITIAL_SESSION");

    expect(onEnded).not.toHaveBeenCalled();
  });

  it.each<AuthChangeEvent>(["TOKEN_REFRESHED", "USER_UPDATED", "SIGNED_IN"])(
    "ignores %s",
    (event) => {
      const onEnded = vi.fn();
      const { fire } = captureHandler();
      subscribeToSessionEnd(onEnded);

      fire(event);

      expect(onEnded).not.toHaveBeenCalled();
    },
  );

  it("returns the unsubscribe", () => {
    const { unsubscribe } = captureHandler();

    subscribeToSessionEnd(vi.fn())();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
