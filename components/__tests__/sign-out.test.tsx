import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

import BookScreen from "@/components/book/BookScreen";
import { BookProvider } from "@/state/book-store";
import { SessionProvider } from "@/state/session-context";

import { createFakeRepository } from "@/lib/expenses/__tests__/fake-repository";

import { initialBook } from "./render-book";

const EMAIL = "juanse@lab10.ai";

function renderSignedIn(signOut = vi.fn().mockResolvedValue(undefined)) {
  const ui: ReactElement = (
    <SessionProvider value={{ user: { id: "u-1", email: EMAIL }, signOut }}>
      <BookProvider initial={initialBook()} repository={createFakeRepository()}>
        <BookScreen />
      </BookProvider>
    </SessionProvider>
  );

  return { user: userEvent.setup(), signOut, ...render(ui) };
}

describe("who is signed in (6.1)", () => {
  it("shows the address and a way out, in the header", () => {
    renderSignedIn();

    expect(screen.getByText(EMAIL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("shows neither when there is no session", () => {
    // What keeps every v1 test green: `useSession()` returns null outside a
    // provider and the control simply is not there.
    render(
      <BookProvider initial={initialBook()} repository={createFakeRepository()}>
        <BookScreen />
      </BookProvider>,
    );

    expect(screen.queryByText(EMAIL)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });
});

describe("asking before ending the session (6.2)", () => {
  it("confirms with the full address before doing anything", async () => {
    const { user, signOut } = renderSignedIn();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(EMAIL);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("ends the session once when confirmed", async () => {
    const { user, signOut } = renderSignedIn();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await user.click(screen.getByRole("button", { name: "Sí, cerrar sesión" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("does nothing when dismissed", async () => {
    const { user, signOut } = renderSignedIn();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(signOut).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("when signing out fails against the server (6.4)", () => {
  it("still runs to completion rather than trapping the person in the book", async () => {
    // The session value's `signOut` is what navigates; it must be awaited and
    // must not leave an unhandled rejection behind.
    const signOut = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const { user } = renderSignedIn(signOut);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await user.click(screen.getByRole("button", { name: "Sí, cerrar sesión" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("the month stepper is untouched (8.7 of the prototype)", () => {
  it("still steps months with the account control beside it", async () => {
    const { user } = renderSignedIn();

    expect(screen.getByText("Septiembre 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    expect(screen.getByText("Agosto 2026")).toBeInTheDocument();
  });
});
