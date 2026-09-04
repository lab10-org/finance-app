import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SEED_TEMPLATE, renderSeedValues, type SeedRow } from "@/lib/seed";

/*
 * The seed is now a template of offsets rather than dates (8.2), but what it has
 * to reproduce is unchanged: the previous month's total under "MES ANTERIOR" and
 * the eight rows the mockup draws for the creation month.
 */

const previousMonth = SEED_TEMPLATE.filter((r) => r.monthOffset === -1);
const creationMonth = SEED_TEMPLATE.filter((r) => r.monthOffset === 0);

describe("the seed template (8.1, 8.2, 8.3)", () => {
  it("spans exactly two months: the creation month and the one before", () => {
    const offsets = [...new Set(SEED_TEMPLATE.map((r) => r.monthOffset))].sort();
    expect(offsets).toEqual([-1, 0]);
  });

  it("has thirty-seven rows", () => {
    expect(SEED_TEMPLATE).toHaveLength(37);
  });

  it("makes the previous month total exactly what the mockup shows", () => {
    const total = previousMonth.reduce((sum, r) => sum + r.amount, 0);
    expect(total).toBe(1_412_300);
  });

  it("gives the previous month enough to make the comparativo appear (8.3)", () => {
    expect(previousMonth.length).toBeGreaterThan(0);
    expect(creationMonth.length).toBeGreaterThan(0);
  });

  it("reproduces the creation-month rows of the mockup, in order", () => {
    // Within a day the highest sequence renders on top (1.3), so descending
    // sequence is the reading order of the book.
    const ordered = [...creationMonth].sort(
      (a, b) => a.day - b.day || b.sequence - a.sequence,
    );
    expect(
      ordered.map((r) => [r.day, r.description, r.amount, r.categoryId]),
    ).toEqual([
      [1, "La Mayorista", 63_400, "mercado"],
      [1, "Spotify Premium", 16_900, "suscripciones"],
      [2, "Netflix", 26_900, "suscripciones"],
      [2, "Crepes & Waffles", 42_300, "restaurantes"],
      [2, "Recarga Cívica", 20_000, "transporte"],
      [3, "Éxito Poblado", 48_500, "mercado"],
      [3, "Uber a la oficina", 12_000, "transporte"],
      [3, "Café Velvet", 18_900, "restaurantes"],
    ]);
  });

  it("gives every amount as a positive whole number of pesos", () => {
    for (const row of SEED_TEMPLATE) {
      expect(Number.isInteger(row.amount)).toBe(true);
      expect(row.amount).toBeGreaterThan(0);
    }
  });

  it("keeps every day within a month, and every sequence unique inside a day", () => {
    const seen = new Set<string>();
    for (const row of SEED_TEMPLATE) {
      expect(row.day).toBeGreaterThanOrEqual(1);
      expect(row.day).toBeLessThanOrEqual(31);
      const key = `${row.monthOffset}:${row.day}:${row.sequence}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("never carries a blank description — absent is absent (10.5)", () => {
    for (const row of SEED_TEMPLATE) {
      if (row.description !== undefined) expect(row.description.trim()).not.toBe("");
    }
  });
});

describe("renderSeedValues (12.1)", () => {
  it("renders one line per row", () => {
    expect(renderSeedValues().split("\n")).toHaveLength(37);
  });

  it("writes an absent description as SQL null, not as an empty string", () => {
    const row: SeedRow = { monthOffset: 0, day: 4, amount: 100, categoryId: "otros", sequence: 0 };
    expect(renderSeedValues([row])).toBe("    (0, 4, 100, 'otros', null, 0)");
  });

  it("doubles a quote inside a description", () => {
    // "Mondongo's" is in the real table; without this the migration would not
    // even parse.
    const row: SeedRow = {
      monthOffset: -1,
      day: 12,
      amount: 52_000,
      categoryId: "restaurantes",
      description: "Mondongo's",
      sequence: 0,
    };
    expect(renderSeedValues([row])).toContain("'Mondongo''s'");
  });

  it("appears verbatim inside the committed seed migration", () => {
    // The one assertion that stops the TypeScript table and the SQL from
    // drifting apart.
    const dir = join(process.cwd(), "supabase", "migrations");
    const sql = readdirSync(dir)
      .filter((name) => name.endsWith("_seed_new_account.sql"))
      .map((name) => readFileSync(join(dir, name), "utf8"))
      .join("\n");

    expect(sql).not.toBe("");
    expect(sql).toContain(renderSeedValues());
  });
});
