import { describe, expect, it } from "vitest";

import {
  draftToInsert,
  normalizeCategory,
  rowToExpense,
  toEpochMs,
  type ExpenseRow,
} from "@/lib/expenses/mapper";

const row = (over: Partial<ExpenseRow> = {}): ExpenseRow => ({
  id: "0199a1b2-c3d4-7000-8000-000000000001",
  amount: 48500,
  currency: "COP",
  category_id: "mercado",
  description: "Éxito Poblado",
  date: "2026-09-03",
  created_at: "2026-09-03T14:22:31.500Z",
  ...over,
});

describe("rowToExpense (1.2, 10.2, 10.5, 10.6)", () => {
  it("carries every field across unchanged", () => {
    expect(rowToExpense(row())).toEqual({
      id: "0199a1b2-c3d4-7000-8000-000000000001",
      amount: 48500,
      currency: "COP",
      categoryId: "mercado",
      description: "Éxito Poblado",
      date: "2026-09-03",
      createdAt: Date.parse("2026-09-03T14:22:31.500Z"),
    });
  });

  it("passes the date through as a string, never through a Date (10.6)", () => {
    // A row dated on a day-boundary is the case that breaks under any timezone
    // conversion: parsed as UTC and rendered in Bogotá it becomes the 31st.
    expect(rowToExpense(row({ date: "2026-09-01" })).date).toBe("2026-09-01");
    expect(rowToExpense(row({ date: "2026-01-01" })).date).toBe("2026-01-01");
  });

  it("reads an amount PostgREST rendered as a string", () => {
    // `numeric` can arrive either way depending on the client's settings.
    expect(rowToExpense(row({ amount: "16800.00" })).amount).toBe(16800);
    expect(rowToExpense(row({ amount: "0.30" })).amount).toBe(0.3);
  });

  it("turns a null description into an absent one, never an empty string (10.5)", () => {
    const expense = rowToExpense(row({ description: null }));
    expect(expense.description).toBeUndefined();
    expect("description" in expense).toBe(false);
  });

  it("treats a blank description as absent too", () => {
    expect(rowToExpense(row({ description: "   " })).description).toBeUndefined();
  });

  it("keeps an unknown currency from silently becoming COP", () => {
    // Nothing writes this today, but reading it as COP would misreport money.
    expect(rowToExpense(row({ currency: "USD" })).currency).toBe("USD");
  });
});

describe("normalizeCategory (11.2, 11.3)", () => {
  it("passes the five known ids through", () => {
    for (const id of ["mercado", "restaurantes", "transporte", "suscripciones", "otros"]) {
      expect(normalizeCategory(id)).toBe(id);
    }
  });

  it("maps anything else to otros, so the book still renders (11.3)", () => {
    // The database deliberately does not constrain this column (11.1), so a row
    // written by anything other than this app can carry any string at all.
    expect(normalizeCategory("cripto")).toBe("otros");
    expect(normalizeCategory("")).toBe("otros");
    expect(normalizeCategory("MERCADO")).toBe("otros");
  });
});

describe("rowToExpense with an unknown category (11.3, 11.4)", () => {
  it("presents it as otros", () => {
    expect(rowToExpense(row({ category_id: "cripto" })).categoryId).toBe("otros");
  });

  it("keeps its amount, so the month total stays truthful (11.4)", () => {
    expect(rowToExpense(row({ category_id: "cripto", amount: 99000 })).amount).toBe(99000);
  });
});

describe("draftToInsert (10.2, 10.5, 11.2)", () => {
  it("stamps the currency and writes an absent description as null", () => {
    expect(
      draftToInsert({ amount: 12000, categoryId: "transporte", date: "2026-09-03" }),
    ).toEqual({
      amount: 12000,
      currency: "COP",
      category_id: "transporte",
      description: null,
      date: "2026-09-03",
    });
  });

  it("trims a description and writes a blank one as null (10.5)", () => {
    expect(
      draftToInsert({
        amount: 100,
        categoryId: "otros",
        date: "2026-09-03",
        description: "  Café Velvet  ",
      }).description,
    ).toBe("Café Velvet");

    expect(
      draftToInsert({ amount: 100, categoryId: "otros", date: "2026-09-03", description: "   " })
        .description,
    ).toBeNull();
  });

  it("never writes a category outside the five known ones (11.2, 11.5)", () => {
    // An expense read with an unknown category is presented as "otros"; editing
    // it writes "otros" back, so the unknown value does not survive a write the
    // interface made.
    const draft = { amount: 100, categoryId: "cripto", date: "2026-09-03" } as never;
    expect(draftToInsert(draft).category_id).toBe("otros");
  });
});

describe("toEpochMs", () => {
  it("converts a timestamptz to epoch milliseconds", () => {
    expect(toEpochMs("2026-09-03T14:22:31.500Z")).toBe(Date.parse("2026-09-03T14:22:31.500Z"));
  });

  it("preserves the ordering that decides a day's rows (1.3)", () => {
    const earlier = toEpochMs("2026-09-03T00:00:00.000Z");
    const later = toEpochMs("2026-09-03T00:00:02.000Z");
    expect(later).toBeGreaterThan(earlier);
  });
});
