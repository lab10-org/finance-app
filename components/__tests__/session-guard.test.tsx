import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BookApp from "@/components/book/BookApp";
import { SessionGuard } from "@/components/book/SessionGuard";
import type { SessionUser } from "@/lib/auth/types";

describe("SessionGuard (5.5, 5.6)", () => {
  it("renders the book while the session holds", () => {
    render(
      <SessionGuard subscribe={() => () => {}} onSessionEnded={vi.fn()}>
        <p>el libro</p>
      </SessionGuard>,
    );

    expect(screen.getByText("el libro")).toBeInTheDocument();
  });

  it("takes every figure off the screen the instant the session ends", () => {
    let end: () => void = () => {};
    const onSessionEnded = vi.fn();

    render(
      <SessionGuard
        subscribe={(fire) => {
          end = fire;
          return () => {};
        }}
        onSessionEnded={onSessionEnded}
      >
        <p>$1.284.500</p>
      </SessionGuard>,
    );

    act(() => end());

    // 5.6: gone from the DOM, not merely hidden — the figures must not be
    // readable by anyone who now holds the phone.
    expect(screen.queryByText("$1.284.500")).not.toBeInTheDocument();
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("does not report the same ending twice", () => {
    let end: () => void = () => {};
    const onSessionEnded = vi.fn();

    render(
      <SessionGuard
        subscribe={(fire) => {
          end = fire;
          return () => {};
        }}
        onSessionEnded={onSessionEnded}
      >
        <p>el libro</p>
      </SessionGuard>,
    );

    act(() => end());
    act(() => end());

    expect(onSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes when it goes away", () => {
    const unsubscribe = vi.fn();
    const { unmount } = render(
      <SessionGuard subscribe={() => unsubscribe} onSessionEnded={vi.fn()}>
        <p>el libro</p>
      </SessionGuard>,
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("a second account on the same device (6.3)", () => {
  const A: SessionUser = { id: "a", email: "a@lab10.ai" };
  const B: SessionUser = { id: "b", email: "b@lab10.ai" };

  it("starts from the seeded month rather than inheriting the previous book", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BookApp user={A} />);

    const seededMonth = screen.getByText(/^\w+ \d{4}$/).textContent as string;

    // Move the first account off its seeded month, so "inherited" and
    // "re-initialised" are visibly different states.
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));
    expect(screen.queryByText(seededMonth)).not.toBeInTheDocument();

    rerender(<BookApp user={B} />);

    expect(screen.getByText(seededMonth)).toBeInTheDocument();
  });
});
