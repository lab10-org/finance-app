import { describe, expect, it } from "vitest";

import { seededBook } from "@/lib/domain/__tests__/fixtures";
import { monthTotal } from "@/lib/domain/summary";
import type { Expense } from "@/lib/domain/types";
import {
  bookReducer,
  createInitialState,
  windowExpenses,
  windowStatus,
  type BookState,
} from "@/state/book-store";

const TODAY = "2026-09-04";
const SEEDED = seededBook("2026-09");

const initial = (over: Partial<Parameters<typeof createInitialState>[0]> = {}): BookState =>
  createInitialState({
    month: "2026-09",
    today: TODAY,
    expenses: SEEDED,
    error: false,
    ...over,
  });

const inMonth = (month: string): Expense[] =>
  SEEDED.filter((e) => e.date.startsWith(month));

describe("the store starts from what the server read (3.1, 3.3)", () => {
  it("holds the viewed month and the one before it, both loaded", () => {
    const s = initial();

    expect(Object.keys(s.months).sort()).toEqual(["2026-08", "2026-09"]);
    expect(s.months["2026-09"].status).toBe("loaded");
    expect(s.months["2026-08"].status).toBe("loaded");
  });

  it("splits the server's flat list into its months", () => {
    const s = initial();

    expect(s.months["2026-09"].expenses).toHaveLength(inMonth("2026-09").length);
    expect(s.months["2026-08"].expenses).toHaveLength(inMonth("2026-08").length);
  });

  it("opens on the month containing today (3.4)", () => {
    expect(initial().viewedMonth).toBe("2026-09");
    expect(initial().today).toBe(TODAY);
  });

  it("marks both months as failed when the server read failed (3.6)", () => {
    const s = initial({ expenses: [], error: true });

    expect(windowStatus(s, "2026-09")).toBe("error");
  });
});

describe("windowExpenses (3.3)", () => {
  it("concatenates the viewed month and the one before it", () => {
    const s = initial();
    const window = windowExpenses(s, "2026-09");

    expect(window).toHaveLength(SEEDED.length);
  });

  it("feeds the pure functions a flat list they cannot tell apart", () => {
    // The point of the selector: summary.ts keeps working unchanged.
    const s = initial();

    expect(monthTotal(windowExpenses(s, "2026-09"), "2026-08")).toBe(1_412_300);
  });

  it("yields nothing for a month it has never read", () => {
    expect(windowExpenses(initial(), "2025-03")).toEqual([]);
  });
});

describe("windowStatus (4.2)", () => {
  it("is loaded when both months are", () => {
    expect(windowStatus(initial(), "2026-09")).toBe("loaded");
  });

  it("is loading when either month of the window is", () => {
    const s = bookReducer(initial(), { type: "monthLoading", months: ["2026-08"] });

    // August is only the comparison, but a comparison that has not arrived is
    // not a figure that may be shown as final.
    expect(windowStatus(s, "2026-09")).toBe("loading");
  });

  it("is loading for a month that was never asked for", () => {
    expect(windowStatus(initial(), "2025-03")).toBe("loading");
  });

  it("prefers loading over error when one month is doing each", () => {
    let s = bookReducer(initial(), { type: "monthFailed", months: ["2026-08"] });
    s = bookReducer(s, { type: "monthLoading", months: ["2026-09"] });

    expect(windowStatus(s, "2026-09")).toBe("loading");
  });
});

describe("an empty month is not a loading month (3.5)", () => {
  it("reports loaded for a month that came back with nothing", () => {
    const s = initial({ expenses: [] });

    expect(windowStatus(s, "2026-09")).toBe("loaded");
    expect(windowExpenses(s, "2026-09")).toEqual([]);
  });
});

describe("navigating to a month that has not been read (4.1, 4.2, 4.3)", () => {
  it("moves without touching the months it already holds", () => {
    const s = bookReducer(initial(), { type: "setMonth", month: "2026-07" });

    expect(s.viewedMonth).toBe("2026-07");
    expect(s.months["2026-09"].expenses).toHaveLength(inMonth("2026-09").length);
    expect(s.months["2026-08"].status).toBe("loaded");
  });

  it("reports the new window as loading until it is filled", () => {
    const s = bookReducer(initial(), { type: "setMonth", month: "2026-07" });

    expect(windowStatus(s, "2026-07")).toBe("loading");
  });

  it("fills the window when the read returns", () => {
    let s = bookReducer(initial(), { type: "setMonth", month: "2026-07" });
    s = bookReducer(s, { type: "monthLoading", months: ["2026-06", "2026-07"] });
    s = bookReducer(s, { type: "monthLoaded", months: ["2026-06", "2026-07"], expenses: [] });

    expect(windowStatus(s, "2026-07")).toBe("loaded");
  });

  it("keeps a month already read, so returning to it needs no read (4.3)", () => {
    let s = bookReducer(initial(), { type: "setMonth", month: "2026-07" });
    s = bookReducer(s, { type: "setMonth", month: "2026-09" });

    expect(windowStatus(s, "2026-09")).toBe("loaded");
    expect(windowExpenses(s, "2026-09")).toHaveLength(SEEDED.length);
  });

  it("still refuses to move past the month containing today (4.5)", () => {
    const s = bookReducer(initial(), { type: "setMonth", month: "2026-10" });

    expect(s.viewedMonth).toBe("2026-09");
  });
});

describe("a failed month keeps what it had (4.4, 9.5)", () => {
  it("marks the status without emptying the data", () => {
    const s = bookReducer(initial(), { type: "monthFailed", months: ["2026-09"] });

    expect(s.months["2026-09"].status).toBe("error");
    expect(s.months["2026-09"].expenses).toHaveLength(inMonth("2026-09").length);
  });

  it("leaves the other month of the window untouched", () => {
    const s = bookReducer(initial(), { type: "monthFailed", months: ["2026-07"] });

    expect(s.months["2026-09"].status).toBe("loaded");
  });

  it("does not empty a reloading month either", () => {
    const s = bookReducer(initial(), { type: "monthLoading", months: ["2026-09"] });

    // Emptying it would flash the book to $0 on every refresh.
    expect(s.months["2026-09"].expenses).toHaveLength(inMonth("2026-09").length);
  });
});

describe("registering into a month the book has not read", () => {
  it("keeps the expense and marks that month unread, so it will be loaded", () => {
    const s = bookReducer(initial(), {
      type: "register",
      id: "local-1",
      draft: { amount: 1000, categoryId: "otros", date: "2026-05-15" },
    });

    expect(s.viewedMonth).toBe("2026-05");
    expect(s.months["2026-05"].expenses.map((e) => e.id)).toEqual(["local-1"]);
    expect(s.months["2026-05"].status).toBe("loading");
  });
});
