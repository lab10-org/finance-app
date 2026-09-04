import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { groupByDay } from "@/lib/domain/summary";
import { seededBook } from "@/lib/domain/__tests__/fixtures";
import {
  BookProvider,
  UNDO_WINDOW_MS,
  bookReducer,
  bookFrom,
  createInitialState,
  useBook,
  windowExpenses,
} from "@/state/book-store";

const SEEDED = seededBook();
const TODAY = "2026-09-03";
const initial = () => createInitialState(bookFrom(seededBook(), TODAY));
const target = SEEDED.find((e) => e.description === "Uber a la oficina" && e.date === "2026-09-03")!;

describe("delete (6.1, 6.2)", () => {
  it("removes the expense and holds it in the undo buffer", () => {
    const s = bookReducer(initial(), { type: "delete", expenseId: target.id });
    expect(windowExpenses(s, s.viewedMonth).some((e) => e.id === target.id)).toBe(false);
    expect(s.pendingDeletion?.id).toBe(target.id);
    expect(s.sheet).toEqual({ mode: "closed" });
  });
});

describe("undo (6.3)", () => {
  it("restores the expense to its original day and position", () => {
    const before = groupByDay(windowExpenses(initial(), "2026-09"), "2026-09", "todas");
    const deleted = bookReducer(initial(), { type: "delete", expenseId: target.id });
    const restored = bookReducer(deleted, { type: "undoDelete" });

    expect(restored.pendingDeletion).toBeNull();
    expect(groupByDay(windowExpenses(restored, "2026-09"), "2026-09", "todas")).toEqual(before);
  });

  it("does nothing once the deletion has been finalised", () => {
    const deleted = bookReducer(initial(), { type: "delete", expenseId: target.id });
    const finalised = bookReducer(deleted, { type: "finalizeDelete" });
    const undone = bookReducer(finalised, { type: "undoDelete" });

    expect(finalised.pendingDeletion).toBeNull();
    expect(windowExpenses(undone, undone.viewedMonth).some((e) => e.id === target.id)).toBe(false);
  });
});

describe("a second delete while one is pending (6.5)", () => {
  it("finalises the first and offers undo for the second", () => {
    const other = SEEDED.find((e) => e.description === "Café Velvet" && e.date === "2026-09-03")!;
    const first = bookReducer(initial(), { type: "delete", expenseId: target.id });
    const second = bookReducer(first, { type: "delete", expenseId: other.id });

    expect(second.pendingDeletion?.id).toBe(other.id);
    const undone = bookReducer(second, { type: "undoDelete" });
    expect(windowExpenses(undone, undone.viewedMonth).some((e) => e.id === other.id)).toBe(true);
    expect(windowExpenses(undone, undone.viewedMonth).some((e) => e.id === target.id)).toBe(false);
  });
});

describe("deleting the filtered category's last expense (7.7)", () => {
  it("falls back to Todas", () => {
    let s = createInitialState(bookFrom(seededBook(), TODAY));
    s = bookReducer(s, { type: "setMonth", month: "2026-08" });
    s = bookReducer(s, { type: "setFilter", filter: "otros" });

    const others = windowExpenses(s, s.viewedMonth).filter((e) => e.date.startsWith("2026-08") && e.categoryId === "otros");
    for (const e of others.slice(0, -1)) {
      s = bookReducer(s, { type: "delete", expenseId: e.id });
    }
    expect(s.filter).toBe("otros");

    s = bookReducer(s, { type: "delete", expenseId: others.at(-1)!.id });
    expect(s.filter).toBe("todas");
  });
});

function Probe() {
  const { state, dispatch } = useBook();
  return (
    <div>
      <span data-testid="pending">{state.pendingDeletion?.id ?? "none"}</span>
      <button onClick={() => dispatch({ type: "delete", expenseId: target.id })}>borrar</button>
    </div>
  );
}

describe("the 5-second window (6.4)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("finalises the deletion by itself after the window closes", () => {
    render(
      <BookProvider initial={bookFrom(seededBook(), TODAY)}>
        <Probe />
      </BookProvider>,
    );

    act(() => screen.getByText("borrar").click());
    expect(screen.getByTestId("pending")).toHaveTextContent(target.id);

    act(() => void vi.advanceTimersByTime(UNDO_WINDOW_MS - 1));
    expect(screen.getByTestId("pending")).toHaveTextContent(target.id);

    act(() => void vi.advanceTimersByTime(1));
    expect(screen.getByTestId("pending")).toHaveTextContent("none");
  });

  it("waits five seconds, not some other number", () => {
    expect(UNDO_WINDOW_MS).toBe(5000);
  });
});
