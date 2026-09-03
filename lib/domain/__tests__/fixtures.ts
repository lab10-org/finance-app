import type { CategoryId, Expense, IsoDate } from "@/lib/domain/types";

let sequence = 0;

/** Builds an expense with a stable, increasing `createdAt` (1.3). */
export function expense(
  date: IsoDate,
  amountCop: number,
  categoryId: CategoryId = "otros",
  description?: string,
): Expense {
  sequence += 1;
  return {
    id: `e${sequence}`,
    date,
    amountCop,
    categoryId,
    ...(description === undefined ? {} : { description }),
    createdAt: 1_700_000_000_000 + sequence,
  };
}

export const TODAY: IsoDate = "2026-09-03";
