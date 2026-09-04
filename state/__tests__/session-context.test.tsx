import { render, screen } from "@testing-library/react";

import { SessionProvider, useSession } from "@/state/session-context";

function Probe() {
  const session = useSession();
  return <span data-testid="who">{session ? session.user.email : "sin sesión"}</span>;
}

describe("useSession (4.5)", () => {
  it("carries the signed-in account to the components below", () => {
    render(
      <SessionProvider
        value={{ user: { id: "u-1", email: "juanse@lab10.ai" }, signOut: vi.fn() }}
      >
        <Probe />
      </SessionProvider>,
    );

    expect(screen.getByTestId("who")).toHaveTextContent("juanse@lab10.ai");
  });

  it("returns null outside a provider instead of throwing", () => {
    /*
     * Deliberately unlike `useBook()`, which throws. `BookScreen` is rendered
     * without a session in every v1 test, and those tests are not about
     * accounts — a throw here would break them all to prove nothing.
     */
    expect(() => render(<Probe />)).not.toThrow();
    expect(screen.getByTestId("who")).toHaveTextContent("sin sesión");
  });
});
