import { describe, expect, it, vi } from "vitest";

import { seededBook } from "@/lib/domain/__tests__/fixtures";
import { createFakeRepository } from "@/lib/expenses/__tests__/fake-repository";
import { goToMonth, loadWindow, needsLoad, refreshWindow } from "@/state/book-actions";
import { bookReducer, createInitialState, type BookAction, type BookState } from "@/state/book-store";

const TODAY = "2026-09-04";

function harness(expenses = seededBook("2026-09")) {
  const repository = createFakeRepository(expenses);
  let state: BookState = createInitialState({
    month: "2026-09",
    today: TODAY,
    expenses,
    error: false,
  });

  const dispatched: BookAction[] = [];
  const dispatch = (action: BookAction) => {
    dispatched.push(action);
    state = bookReducer(state, action);
  };

  return {
    repository,
    dispatched,
    dispatch,
    get context() {
      return { state, dispatch, repository };
    },
    get state() {
      return state;
    },
  };
}

describe("needsLoad (4.1, 4.3)", () => {
  it("is false for a window already held", () => {
    const h = harness();
    expect(needsLoad(h.state, "2026-09")).toBe(false);
  });

  it("is true when either month of the window is missing", () => {
    const h = harness();
    // August is held, July is not — and July is what September-minus-two needs.
    expect(needsLoad(h.state, "2026-08")).toBe(true);
    expect(needsLoad(h.state, "2026-05")).toBe(true);
  });
});

describe("loadWindow (4.1, 4.2, 4.4)", () => {
  it("marks the window loading, then loaded", async () => {
    const h = harness();
    await loadWindow(h.context, "2026-05");

    expect(h.dispatched.map((a) => a.type)).toEqual(["monthLoading", "monthLoaded"]);
    expect(h.state.months["2026-05"].status).toBe("loaded");
    expect(h.state.months["2026-04"].status).toBe("loaded");
  });

  it("does not read a window it already holds (4.3)", async () => {
    const h = harness();
    const spy = vi.spyOn(h.repository, "readWindow");

    await loadWindow(h.context, "2026-09");

    expect(spy).not.toHaveBeenCalled();
    expect(h.dispatched).toEqual([]);
  });

  it("reads it anyway when forced, which is what a refresh is (9.1)", async () => {
    const h = harness();
    const spy = vi.spyOn(h.repository, "readWindow");

    await loadWindow(h.context, "2026-09", { force: true });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("marks the window failed and keeps the data it had (4.4, 9.5)", async () => {
    const h = harness();
    h.repository.failNext("network down", ["read"]);

    await loadWindow(h.context, "2026-09", { force: true });

    expect(h.state.months["2026-09"].status).toBe("error");
    // The point of 9.5: a failed refresh must not empty the book.
    expect(h.state.months["2026-09"].expenses.length).toBeGreaterThan(0);
  });

  it("never throws, whatever the repository does", async () => {
    const h = harness();
    h.repository.failNext("boom", ["read"]);

    await expect(loadWindow(h.context, "2026-09", { force: true })).resolves.toBeUndefined();
  });

  it("can be retried after a failure and succeeds (4.4)", async () => {
    const h = harness();
    h.repository.failNext("network down", ["read"]);
    await loadWindow(h.context, "2026-09", { force: true });
    expect(h.state.months["2026-09"].status).toBe("error");

    await loadWindow(h.context, "2026-09", { force: true });

    expect(h.state.months["2026-09"].status).toBe("loaded");
  });
});

describe("goToMonth (4.1, 4.3, 4.5)", () => {
  it("moves the book and reads the month it landed on", async () => {
    const h = harness();
    await goToMonth(h.context, "2026-05");

    expect(h.state.viewedMonth).toBe("2026-05");
    expect(h.state.months["2026-05"].status).toBe("loaded");
  });

  it("reads nothing when returning to a month already read (4.3)", async () => {
    const h = harness();
    await goToMonth(h.context, "2026-05");
    const spy = vi.spyOn(h.repository, "readWindow");

    await goToMonth(h.context, "2026-09");

    expect(spy).not.toHaveBeenCalled();
    expect(h.state.viewedMonth).toBe("2026-09");
  });

  it("refuses to move past the month containing today, and reads nothing (4.5)", async () => {
    const h = harness();
    const spy = vi.spyOn(h.repository, "readWindow");

    await goToMonth(h.context, "2026-10");

    expect(h.state.viewedMonth).toBe("2026-09");
    expect(spy).not.toHaveBeenCalled();
  });

  it("reads each unread month exactly once", async () => {
    const h = harness();
    const spy = vi.spyOn(h.repository, "readWindow");

    await goToMonth(h.context, "2026-05");
    await goToMonth(h.context, "2026-09");
    await goToMonth(h.context, "2026-05");

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("refreshWindow (9.1, 9.3)", () => {
  it("re-reads the viewed window even though it is held", async () => {
    const h = harness();
    const spy = vi.spyOn(h.repository, "readWindow");

    await refreshWindow(h.context);

    expect(spy).toHaveBeenCalledWith("2026-09");
  });

  it("takes up what changed elsewhere (9.3)", async () => {
    const h = harness();
    const fewer = seededBook("2026-09").slice(0, 5);
    h.repository.seed(fewer);

    await refreshWindow(h.context);

    expect(h.state.months["2026-08"].expenses.length + h.state.months["2026-09"].expenses.length)
      .toBe(5);
  });
});
