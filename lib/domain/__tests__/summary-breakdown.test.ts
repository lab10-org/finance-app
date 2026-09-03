import { describe, expect, it } from "vitest";

import { categoryBreakdown, groupByDay, topCategory } from "@/lib/domain/summary";

import { expense } from "./fixtures";

const september = [
  expense("2026-09-01", 100_000, "mercado", "La Mayorista"),
  expense("2026-09-02", 50_000, "restaurantes", "Café Velvet"),
  expense("2026-09-02", 30_000, "transporte"),
  expense("2026-09-03", 20_000, "mercado", "Éxito Poblado"),
];

describe("categoryBreakdown (2.6, 2.8, 2.10)", () => {
  it("orders categories by share, largest first", () => {
    expect(categoryBreakdown(september, "2026-09")).toEqual([
      { categoryId: "mercado", total: 120_000, share: 0.6 },
      { categoryId: "restaurantes", total: 50_000, share: 0.25 },
      { categoryId: "transporte", total: 30_000, share: 0.15 },
    ]);
  });

  it("omits categories with no expenses this month", () => {
    const ids = categoryBreakdown(september, "2026-09").map((s) => s.categoryId);
    expect(ids).not.toContain("suscripciones");
    expect(ids).not.toContain("otros");
  });

  it("is empty for a month with no expenses", () => {
    expect(categoryBreakdown(september, "2026-07")).toEqual([]);
  });
});

describe("topCategory (2.4, 2.9, 2.12)", () => {
  it("returns the highest-spending category", () => {
    expect(topCategory(september, "2026-09")).toEqual({
      categoryId: "mercado",
      total: 120_000,
    });
  });

  it("breaks a tie by the fixed category order", () => {
    const tied = [
      expense("2026-09-01", 40_000, "transporte"),
      expense("2026-09-01", 40_000, "restaurantes"),
    ];
    expect(topCategory(tied, "2026-09")?.categoryId).toBe("restaurantes");
  });

  it("is null for a month with no expenses", () => {
    expect(topCategory(september, "2026-07")).toBeNull();
  });
});

describe("groupByDay (1.2, 1.3, 1.5, 7.4)", () => {
  it("orders days most recent first, with each day's subtotal", () => {
    const days = groupByDay(september, "2026-09", "todas");
    expect(days.map((d) => d.date)).toEqual(["2026-09-03", "2026-09-02", "2026-09-01"]);
    expect(days.map((d) => d.subtotal)).toEqual([20_000, 80_000, 100_000]);
  });

  it("orders expenses within a day most recently registered first", () => {
    const days = groupByDay(september, "2026-09", "todas");
    const second = days[1].expenses.map((e) => e.categoryId);
    expect(second).toEqual(["transporte", "restaurantes"]);
  });

  it("keeps only the selected category, and recomputes the subtotals from it", () => {
    const days = groupByDay(september, "2026-09", "mercado");
    expect(days.map((d) => d.date)).toEqual(["2026-09-03", "2026-09-01"]);
    expect(days.map((d) => d.subtotal)).toEqual([20_000, 100_000]);
  });

  it("is empty for a month with no expenses", () => {
    expect(groupByDay(september, "2026-07", "todas")).toEqual([]);
  });
});
