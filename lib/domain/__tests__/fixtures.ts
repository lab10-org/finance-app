import { DEFAULT_CURRENCY } from "@/lib/domain/types";
import type { CategoryId, Expense, IsoDate, MonthKey } from "@/lib/domain/types";
import { SEED_TEMPLATE } from "@/lib/seed";

let sequence = 0;

/** Builds an expense with a stable, increasing `createdAt` (1.3). */
export function expense(
  date: IsoDate,
  amount: number,
  categoryId: CategoryId = "otros",
  description?: string,
): Expense {
  sequence += 1;
  return {
    id: `e${sequence}`,
    date,
    amount,
    currency: DEFAULT_CURRENCY,
    categoryId,
    ...(description === undefined ? {} : { description }),
    createdAt: 1_700_000_000_000 + sequence,
  };
}

export const TODAY: IsoDate = "2026-09-03";

/**
 * The seeded book, expanded to absolute dates — what the trigger writes, built
 * here so the tests that used to import `SEED_EXPENSES` keep asserting the same
 * behaviour against the same data.
 *
 * It mirrors the clamp and the ordering of `seed_new_account.sql`: a day the
 * target month does not have becomes that month's last day, and `sequence`
 * becomes seconds added to `createdAt`, so the highest renders on top (1.3).
 */
export function seededBook(creationMonth: MonthKey = "2026-09"): Expense[] {
  const [year, month] = creationMonth.split("-").map(Number);

  return SEED_TEMPLATE.map((row, index) => {
    const zeroBased = year * 12 + (month - 1) + row.monthOffset;
    const y = Math.floor(zeroBased / 12);
    const m = (zeroBased % 12) + 1;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const day = Math.min(row.day, lastDay);
    const date = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return {
      id: `seed-${index + 1}`,
      date,
      amount: row.amount,
      currency: DEFAULT_CURRENCY,
      categoryId: row.categoryId,
      ...(row.description === undefined ? {} : { description: row.description }),
      createdAt: Date.parse(`${date}T00:00:00Z`) + row.sequence * 1000,
    };
  });
}
