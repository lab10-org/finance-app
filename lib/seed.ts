import type { CategoryId } from "@/lib/domain/types";

/*
 * The book a brand-new account starts with (Requirement 8).
 *
 * The rows are stored as OFFSETS, not dates: `monthOffset` 0 is the month the
 * account was created in and -1 the month before it, so a seeded book always
 * lands on months the user will actually look at, whenever they sign up (8.2).
 * Turning them into absolute dates is the migration's job, because that is where
 * the account's creation date is known.
 *
 * This stays TypeScript rather than moving into the .sql file so that the
 * assertions tying these numbers to the mockup — the previous month's
 * $1.412.300, the eight rows of frame zKnc1 — remain runnable under vitest. A
 * test compares `renderSeedValues()` against the committed migration, which is
 * what keeps the two from drifting apart.
 */

export interface SeedRow {
  /** 0 = the month the account was created in, -1 = the month before it (8.2). */
  monthOffset: 0 | -1;
  /** Day of month, 1-31. The trigger clamps it to the month's real length. */
  day: number;
  /** Whole Colombian pesos. */
  amount: number;
  categoryId: CategoryId;
  /** Absent where the mockup shows a bare category name instead (1.8). */
  description?: string;
  /**
   * Orders the rows of a single day: the highest renders on top (1.3). It
   * becomes a number of seconds added to the row's `created_at`.
   */
  sequence: number;
}

export const SEED_TEMPLATE: readonly SeedRow[] = [
  { monthOffset: -1, day: 1, amount: 132400, categoryId: "mercado", description: "Éxito Poblado", sequence: 0 },
  { monthOffset: -1, day: 2, amount: 38900, categoryId: "restaurantes", description: "Crepes & Waffles", sequence: 0 },
  { monthOffset: -1, day: 3, amount: 20000, categoryId: "transporte", description: "Recarga Cívica", sequence: 0 },
  { monthOffset: -1, day: 4, amount: 87600, categoryId: "mercado", description: "Carulla Oviedo", sequence: 0 },
  { monthOffset: -1, day: 5, amount: 26900, categoryId: "suscripciones", description: "Netflix", sequence: 0 },
  { monthOffset: -1, day: 6, amount: 15600, categoryId: "restaurantes", description: "Café Velvet", sequence: 0 },
  { monthOffset: -1, day: 7, amount: 22000, categoryId: "otros", sequence: 0 },
  { monthOffset: -1, day: 8, amount: 96300, categoryId: "mercado", description: "La Mayorista", sequence: 0 },
  { monthOffset: -1, day: 9, amount: 34500, categoryId: "restaurantes", description: "Salón Málaga", sequence: 0 },
  { monthOffset: -1, day: 10, amount: 14200, categoryId: "transporte", description: "Uber a la oficina", sequence: 0 },
  { monthOffset: -1, day: 11, amount: 41200, categoryId: "mercado", description: "D1 Laureles", sequence: 0 },
  { monthOffset: -1, day: 12, amount: 52000, categoryId: "restaurantes", description: "Mondongo's", sequence: 0 },
  { monthOffset: -1, day: 14, amount: 16900, categoryId: "suscripciones", description: "Spotify Premium", sequence: 0 },
  { monthOffset: -1, day: 15, amount: 118700, categoryId: "mercado", description: "Carulla Oviedo", sequence: 0 },
  { monthOffset: -1, day: 16, amount: 18300, categoryId: "transporte", description: "Uber al centro", sequence: 0 },
  { monthOffset: -1, day: 17, amount: 45000, categoryId: "transporte", description: "Taxi al aeropuerto", sequence: 0 },
  { monthOffset: -1, day: 18, amount: 16800, categoryId: "restaurantes", description: "Café Velvet", sequence: 0 },
  { monthOffset: -1, day: 19, amount: 63800, categoryId: "otros", description: "Farmacia Cruz Verde", sequence: 0 },
  { monthOffset: -1, day: 21, amount: 28400, categoryId: "restaurantes", description: "Al Alma", sequence: 0 },
  { monthOffset: -1, day: 22, amount: 89900, categoryId: "suscripciones", description: "Claro Hogar", sequence: 0 },
  { monthOffset: -1, day: 23, amount: 74500, categoryId: "mercado", description: "D1 Laureles", sequence: 0 },
  { monthOffset: -1, day: 24, amount: 45000, categoryId: "otros", description: "Regalo cumpleaños", sequence: 0 },
  { monthOffset: -1, day: 25, amount: 13800, categoryId: "transporte", description: "Uber a la oficina", sequence: 0 },
  { monthOffset: -1, day: 26, amount: 12900, categoryId: "suscripciones", description: "iCloud", sequence: 0 },
  { monthOffset: -1, day: 27, amount: 16600, categoryId: "mercado", description: "Éxito Poblado", sequence: 0 },
  { monthOffset: -1, day: 28, amount: 61200, categoryId: "restaurantes", description: "Bao Bar", sequence: 0 },
  { monthOffset: -1, day: 29, amount: 143900, categoryId: "mercado", description: "Éxito Poblado", sequence: 0 },
  { monthOffset: -1, day: 30, amount: 45000, categoryId: "otros", description: "Peluquería", sequence: 0 },
  { monthOffset: -1, day: 31, amount: 20000, categoryId: "transporte", description: "Recarga Cívica", sequence: 0 },
  { monthOffset: 0, day: 1, amount: 63400, categoryId: "mercado", description: "La Mayorista", sequence: 1 },
  { monthOffset: 0, day: 1, amount: 16900, categoryId: "suscripciones", description: "Spotify Premium", sequence: 0 },
  { monthOffset: 0, day: 2, amount: 26900, categoryId: "suscripciones", description: "Netflix", sequence: 2 },
  { monthOffset: 0, day: 2, amount: 42300, categoryId: "restaurantes", description: "Crepes & Waffles", sequence: 1 },
  { monthOffset: 0, day: 2, amount: 20000, categoryId: "transporte", description: "Recarga Cívica", sequence: 0 },
  { monthOffset: 0, day: 3, amount: 48500, categoryId: "mercado", description: "Éxito Poblado", sequence: 2 },
  { monthOffset: 0, day: 3, amount: 12000, categoryId: "transporte", description: "Uber a la oficina", sequence: 1 },
  { monthOffset: 0, day: 3, amount: 18900, categoryId: "restaurantes", description: "Café Velvet", sequence: 0 },
];

/**
 * A SQL string literal. Doubling the quote is the whole of the escaping, and it
 * is not optional: "Mondongo's" is in the table above, and without this the
 * migration would not parse.
 */
function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * The `values` list the seed migration embeds, one row per line.
 *
 * Column order is (month_offset, day, amount, category_id, description,
 * sequence) — it must match the migration's `insert`, and the test that compares
 * this output to the committed file is what enforces that.
 */
export function renderSeedValues(rows: readonly SeedRow[] = SEED_TEMPLATE): string {
  return rows
    .map((row) => {
      const description =
        row.description === undefined ? "null" : sqlString(row.description);
      return `    (${row.monthOffset}, ${row.day}, ${row.amount}, ${sqlString(
        row.categoryId,
      )}, ${description}, ${row.sequence})`;
    })
    .join(",\n");
}
