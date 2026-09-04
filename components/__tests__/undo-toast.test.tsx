import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BookScreen from "@/components/book/BookScreen";
import { seededBook } from "@/lib/domain/__tests__/fixtures";

const SEEDED = seededBook();
import { UNDO_WINDOW_MS } from "@/state/book-store";

import { renderInBook } from "./render-book";

const sheet = () => within(screen.getByTestId("expense-sheet"));
const target = SEEDED.find(
  (e) => e.description === "Uber a la oficina" && e.date === "2026-09-03",
)!;

async function deleteTarget(user: ReturnType<typeof renderInBook>["user"]) {
  await user.click(screen.getByTestId(`row-${target.id}`));
  await user.click(sheet().getByRole("button", { name: /eliminar/i }));
}

describe("deleting (6.1, 6.2)", () => {
  it("removes the row, closes the sheet and offers to undo", async () => {
    const { user } = renderInBook(<BookScreen />);
    await deleteTarget(user);

    expect(screen.queryByTestId("expense-sheet")).toBeNull();
    expect(screen.queryByTestId(`row-${target.id}`)).toBeNull();
    expect(screen.getByTestId("undo-toast")).toHaveTextContent("Gasto eliminado");
    expect(screen.getByRole("button", { name: /deshacer/i })).toBeInTheDocument();
  });

  it("shows every figure as if the deletion were already final", async () => {
    const { user } = renderInBook(<BookScreen />);
    await deleteTarget(user);

    expect(screen.getByTestId("month-total")).toHaveTextContent("$236.900");
    expect(
      within(screen.getAllByTestId("day-strip")[0]).getByTestId("day-subtotal"),
    ).toHaveTextContent("$67.400");
  });
});

describe("undoing (6.3)", () => {
  it("puts the expense back exactly where it was", async () => {
    const { user } = renderInBook(<BookScreen />);
    const before = screen
      .getByTestId("day-2026-09-03")
      .querySelectorAll("[data-testid^='row-']").length;

    await deleteTarget(user);
    await user.click(screen.getByRole("button", { name: /deshacer/i }));

    expect(screen.queryByTestId("undo-toast")).toBeNull();
    expect(screen.getByTestId("month-total")).toHaveTextContent("$248.900");

    const today = within(screen.getByTestId("day-2026-09-03"));
    expect(today.getAllByTestId("row-title").map((t) => t.textContent)).toEqual([
      "Éxito Poblado",
      "Uber a la oficina",
      "Café Velvet",
    ]);
    expect(
      screen.getByTestId("day-2026-09-03").querySelectorAll("[data-testid^='row-']").length,
    ).toBe(before);
  });
});

describe("letting the window close (6.4)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("makes the deletion final and hides the notice", () => {
    // fireEvent rather than userEvent: userEvent's own waits do not cooperate
    // with fake timers, and this test is about the clock, not the pointer.
    renderInBook(<BookScreen />);

    fireEvent.click(screen.getByTestId(`row-${target.id}`));
    fireEvent.click(sheet().getByRole("button", { name: /eliminar/i }));
    expect(screen.getByTestId("undo-toast")).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(UNDO_WINDOW_MS - 1));
    expect(screen.getByTestId("undo-toast")).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(1));
    expect(screen.queryByTestId("undo-toast")).toBeNull();
    expect(screen.queryByTestId(`row-${target.id}`)).toBeNull();
  });
});

describe("emptying a month by deleting (6.6, 3.6)", () => {
  it("falls through to the empty state, and back again on undo", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    await user.click(screen.getByRole("button", { name: /registrar un gasto/i }));
    await user.type(sheet().getByLabelText(/monto/i), "30000");
    await user.click(sheet().getByRole("button", { name: "Otros" }));
    await user.click(sheet().getByRole("button", { name: /guardar/i }));

    expect(screen.queryByTestId("empty-month")).toBeNull();

    const onlyRow = screen.getAllByTestId(/^row-/)[0];
    await user.click(onlyRow);
    await user.click(sheet().getByRole("button", { name: /eliminar/i }));

    expect(screen.getByTestId("empty-month")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /deshacer/i }));
    expect(screen.queryByTestId("empty-month")).toBeNull();
    expect(screen.getByText("1 DE JULIO")).toBeInTheDocument();
  });
});
