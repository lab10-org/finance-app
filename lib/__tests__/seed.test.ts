import { describe, expect, it } from "vitest";

import { monthKeyOf } from "@/lib/domain/dates";
import { monthTotal } from "@/lib/domain/summary";
import { SEED_EXPENSES, SEED_MONTH } from "@/lib/seed";

describe("seed data (10.1, 10.2)", () => {
  it("covers July, August and September 2026 and nothing else", () => {
    const months = [...new Set(SEED_EXPENSES.map((e) => monthKeyOf(e.date)))].sort();
    expect(months).toEqual(["2026-08", "2026-09"]);
    expect(monthTotal(SEED_EXPENSES, "2026-07")).toBe(0);
  });

  it("leaves July 2026 empty so the empty state is reachable", () => {
    expect(SEED_EXPENSES.filter((e) => monthKeyOf(e.date) === "2026-07")).toEqual([]);
  });

  it("makes August total exactly what the mockup shows under MES ANTERIOR", () => {
    expect(monthTotal(SEED_EXPENSES, "2026-08")).toBe(1_412_300);
  });

  it("reproduces the September rows of the mockup", () => {
    const september = SEED_EXPENSES.filter((e) => monthKeyOf(e.date) === "2026-09");
    expect(
      september.map((e) => [e.date, e.description, e.amount, e.categoryId]),
    ).toEqual([
      ["2026-09-01", "La Mayorista", 63_400, "mercado"],
      ["2026-09-01", "Spotify Premium", 16_900, "suscripciones"],
      ["2026-09-02", "Netflix", 26_900, "suscripciones"],
      ["2026-09-02", "Crepes & Waffles", 42_300, "restaurantes"],
      ["2026-09-02", "Recarga Cívica", 20_000, "transporte"],
      ["2026-09-03", "Éxito Poblado", 48_500, "mercado"],
      ["2026-09-03", "Uber a la oficina", 12_000, "transporte"],
      ["2026-09-03", "Café Velvet", 18_900, "restaurantes"],
    ]);
  });

  it("opens on the most recent month that has data", () => {
    expect(SEED_MONTH).toBe("2026-09");
  });

  it("gives every expense a unique id and a positive whole amount", () => {
    const ids = new Set(SEED_EXPENSES.map((e) => e.id));
    expect(ids.size).toBe(SEED_EXPENSES.length);
    for (const e of SEED_EXPENSES) {
      expect(Number.isInteger(e.amount)).toBe(true);
      expect(e.amount).toBeGreaterThan(0);
    }
  });
});
