import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { monthKeyOf } from "@/lib/domain/dates";
import { monthTotal } from "@/lib/domain/summary";
import type { ExpenseDraft } from "@/lib/domain/types";
import { seededBook } from "@/lib/domain/__tests__/fixtures";
import { bookReducer, createInitialState } from "@/state/book-store";

const TODAY = "2026-09-03";
const SEEDED = seededBook();
const initial = () => createInitialState(TODAY, seededBook());

const draft = (over: Partial<ExpenseDraft> = {}): ExpenseDraft => ({
  amount: 48_500,
  categoryId: "mercado",
  date: "2026-09-03",
  ...over,
});

describe("initial state (1.1, 10.1)", () => {
  it("opens on the seeded month with no filter and no sheet", () => {
    const s = initial();
    expect(s.viewedMonth).toBe("2026-09");
    expect(s.filter).toBe("todas");
    expect(s.sheet).toEqual({ mode: "closed" });
    expect(s.pendingDeletion).toBeNull();
    expect(s.expenses).toHaveLength(SEEDED.length);
    expect(s.today).toBe(TODAY);
  });
});

describe("month navigation (8.1, 8.2, 8.4, 7.6)", () => {
  it("steps back a month and resets the filter", () => {
    const filtered = bookReducer(initial(), { type: "setFilter", filter: "mercado" });
    const s = bookReducer(filtered, { type: "setMonth", month: "2026-08" });
    expect(s.viewedMonth).toBe("2026-08");
    expect(s.filter).toBe("todas");
  });

  it("steps forward within the current month", () => {
    const back = bookReducer(initial(), { type: "setMonth", month: "2026-08" });
    expect(bookReducer(back, { type: "setMonth", month: "2026-09" }).viewedMonth).toBe("2026-09");
  });

  it("refuses to move past the month containing today", () => {
    const s = bookReducer(initial(), { type: "setMonth", month: "2026-10" });
    expect(s.viewedMonth).toBe("2026-09");
  });

  it("has no limit going backwards", () => {
    const s = bookReducer(initial(), { type: "setMonth", month: "2025-01" });
    expect(s.viewedMonth).toBe("2025-01");
  });
});

describe("the sheet (4.1, 5.1)", () => {
  it("opens in create mode and closes again", () => {
    const open = bookReducer(initial(), { type: "openSheet", sheet: { mode: "create" } });
    expect(open.sheet).toEqual({ mode: "create" });
    expect(bookReducer(open, { type: "closeSheet" }).sheet).toEqual({ mode: "closed" });
  });

  it("opens in edit mode on a given expense", () => {
    const s = bookReducer(initial(), {
      type: "openSheet",
      sheet: { mode: "edit", expenseId: "seed-30" },
    });
    expect(s.sheet).toEqual({ mode: "edit", expenseId: "seed-30" });
  });
});

describe("register (4.6, 2.13)", () => {
  it("appends the expense, gives it an id, and closes the sheet", () => {
    const open = bookReducer(initial(), { type: "openSheet", sheet: { mode: "create" } });
    const s = bookReducer(open, { type: "register", draft: draft() });

    expect(s.expenses).toHaveLength(SEEDED.length + 1);
    expect(s.sheet).toEqual({ mode: "closed" });

    const added = s.expenses.at(-1)!;
    expect(added.id).toBeTruthy();
    expect(new Set(s.expenses.map((e) => e.id)).size).toBe(s.expenses.length);
    expect(added.amount).toBe(48_500);
    expect(monthTotal(s.expenses, "2026-09")).toBe(monthTotal(SEEDED, "2026-09") + 48_500);
  });

  it("never stores an empty description", () => {
    const s = bookReducer(initial(), { type: "register", draft: draft({ description: "  " }) });
    expect(s.expenses.at(-1)!.description).toBeUndefined();
  });

  it("follows the expense when it is dated outside the viewed month", () => {
    const s = bookReducer(initial(), { type: "register", draft: draft({ date: "2026-07-04" }) });
    expect(s.viewedMonth).toBe("2026-07");
  });
});

describe("edit (5.3, 5.4)", () => {
  const target = SEEDED.find((e) => e.description === "Éxito Poblado" && e.date === "2026-09-03")!;

  it("updates the expense in place, keeping its id and position", () => {
    const s = bookReducer(initial(), {
      type: "edit",
      expenseId: target.id,
      draft: { ...target, amount: 60_000, categoryId: "otros" },
    });
    const edited = s.expenses.find((e) => e.id === target.id)!;
    expect(edited.amount).toBe(60_000);
    expect(edited.categoryId).toBe("otros");
    expect(s.expenses).toHaveLength(SEEDED.length);
    expect(s.expenses.indexOf(edited)).toBe(SEEDED.indexOf(target));
  });

  it("navigates the book when the edit moves the expense to another month", () => {
    const s = bookReducer(initial(), {
      type: "edit",
      expenseId: target.id,
      draft: { ...target, date: "2026-08-28" },
    });
    expect(s.viewedMonth).toBe("2026-08");
    expect(monthKeyOf(s.expenses.find((e) => e.id === target.id)!.date)).toBe("2026-08");
  });
});

describe("prototype data lifetime (10.3, 10.4, 10.5)", () => {
  it("never touches browser storage or the network", () => {
    const source = readFileSync(resolve(process.cwd(), "state/book-store.tsx"), "utf8");
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|fetch\(/);
  });
});
