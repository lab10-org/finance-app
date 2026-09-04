import { CATEGORY_BY_ID } from "@/lib/domain/categories";
import { DEFAULT_CURRENCY } from "@/lib/domain/types";
import type {
  CategoryId,
  Currency,
  Expense,
  ExpenseDraft,
  IsoDate,
} from "@/lib/domain/types";

/*
 * The boundary between a database row and a domain `Expense`, kept pure and kept
 * in one place.
 *
 * Everything above this file works with `Expense`; everything below it works
 * with rows. Nothing else in the application needs to know that `description` is
 * nullable in the database and absent in the domain, or that `created_at` is a
 * timestamp there and a number here.
 */

export interface ExpenseRow {
  id: string;
  /** PostgREST may render `numeric` as a JSON number or as a string. */
  amount: number | string;
  currency: string;
  category_id: string;
  description: string | null;
  /** Already exactly an `IsoDate`: Postgres renders `date` as YYYY-MM-DD. */
  date: string;
  created_at: string;
}

export interface ExpenseInsert {
  amount: number;
  currency: Currency;
  category_id: CategoryId;
  description: string | null;
  date: IsoDate;
}

/** Anything outside the five known ids becomes "otros" (11.3). */
export function normalizeCategory(raw: string): CategoryId {
  return raw in CATEGORY_BY_ID ? (raw as CategoryId) : "otros";
}

export function toEpochMs(timestamptz: string): number {
  return Date.parse(timestamptz);
}

/**
 * A row as the book understands it.
 *
 * `date` is carried across as a string and never passed through `Date`. That is
 * not a style choice: it is the only reason no timezone can move an expense into
 * a different day than the one the user picked (10.6), and it is the same rule
 * `lib/domain/dates.ts` already follows.
 *
 * `currency` is carried across as stored rather than assumed. Nothing writes
 * anything but "COP" today (10.3), but reading a row as COP because the type says
 * so would misreport somebody's money.
 */
export function rowToExpense(row: ExpenseRow): Expense {
  const description = row.description?.trim();

  return {
    id: row.id,
    amount: typeof row.amount === "string" ? Number(row.amount) : row.amount,
    currency: row.currency as Currency,
    categoryId: normalizeCategory(row.category_id),
    // Absent, not empty: 10.5 in the shape of the object rather than in a check.
    ...(description ? { description } : {}),
    date: row.date,
    createdAt: toEpochMs(row.created_at),
  };
}

/**
 * What "la hoja" produced, as a row to write.
 *
 * The category is normalised on the way out as well as on the way in (11.5): an
 * expense whose stored category is unknown is shown under "Otros", and
 * confirming an edit on it stores "otros" — an unknown value never survives a
 * write this interface made (11.2).
 */
export function draftToInsert(draft: ExpenseDraft): ExpenseInsert {
  const description = draft.description?.trim();

  return {
    amount: draft.amount,
    currency: DEFAULT_CURRENCY,
    category_id: normalizeCategory(draft.categoryId),
    description: description ? description : null,
    date: draft.date,
  };
}
