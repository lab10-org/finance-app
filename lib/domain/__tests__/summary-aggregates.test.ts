import { describe, expect, it } from "vitest";

import { dailyAverage, monthComparison, monthTotal } from "@/lib/domain/summary";

import { TODAY, expense } from "./fixtures";

const august = [
  expense("2026-08-10", 1_000_000, "mercado"),
  expense("2026-08-20", 412_300, "transporte"),
];
const september = [
  expense("2026-09-01", 800_000, "mercado"),
  expense("2026-09-02", 300_000, "restaurantes"),
  expense("2026-09-03", 184_500, "transporte"),
];
const all = [...august, ...september];

describe("monthTotal (2.1)", () => {
  it("sums only the expenses of the given month", () => {
    expect(monthTotal(all, "2026-09")).toBe(1_284_500);
    expect(monthTotal(all, "2026-08")).toBe(1_412_300);
  });

  it("is zero for a month with no expenses", () => {
    expect(monthTotal(all, "2026-07")).toBe(0);
  });
});

describe("dailyAverage (2.3, 2.9)", () => {
  it("divides the total by the days elapsed so far in the current month", () => {
    expect(dailyAverage(all, "2026-09", TODAY)).toEqual({
      amount: Math.round(1_284_500 / 3),
      days: 3,
    });
  });

  it("divides by the whole month for a past month", () => {
    expect(dailyAverage(all, "2026-08", TODAY)).toEqual({
      amount: Math.round(1_412_300 / 31),
      days: 31,
    });
  });

  it("is null for a month with no expenses", () => {
    expect(dailyAverage(all, "2026-07", TODAY)).toBeNull();
  });
});

describe("monthComparison (2.5, 2.11)", () => {
  it("reports spending less than the previous month", () => {
    const c = monthComparison(all, "2026-09");
    expect(c?.direction).toBe("less");
    expect(c?.previousMonth).toBe("2026-08");
    expect(c?.percent).toBeCloseTo(9.05, 2);
  });

  it("reports spending more than the previous month", () => {
    const grown = [...august, expense("2026-09-02", 2_000_000, "mercado")];
    const c = monthComparison(grown, "2026-09");
    expect(c?.direction).toBe("more");
    expect(c?.percent).toBeCloseTo(41.6, 1);
  });

  it("is null when this month is empty", () => {
    expect(monthComparison(all, "2026-07")).toBeNull();
  });

  it("is null when the previous month is empty", () => {
    expect(monthComparison(all, "2026-08")).toBeNull();
  });
});
