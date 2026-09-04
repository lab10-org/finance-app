import { DEFAULT_CURRENCY } from "@/lib/domain/types";
import type { CategoryId, Expense, IsoDate } from "@/lib/domain/types";

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
