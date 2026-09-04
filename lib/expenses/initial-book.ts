import { monthKeyOf, todayIso } from "@/lib/domain/dates";
import type { Expense, IsoDate, MonthKey } from "@/lib/domain/types";
import type { ExpenseRepository } from "@/lib/expenses/repository";

/**
 * The book as the server hands it to the browser.
 *
 * Plain JSON — strings, numbers, arrays. It crosses the Server/Client boundary,
 * so a `Date`, a `Map` or a class instance in here fails at runtime in a way no
 * type catches.
 */
export interface InitialBook {
  /** The month the server opened on, from the server's own date (3.4). */
  month: MonthKey;
  today: IsoDate;
  /** `month` and the month before it, already mapped. Empty when `error`. */
  expenses: Expense[];
  /** True when the read failed: the client shows a retry, not an empty book. */
  error: boolean;
}

/**
 * Reads the opening window (3.1, 3.3).
 *
 * It never throws. A read that fails must produce a book flagged as failed, not
 * an exception that takes the page down — and above all not an empty book, which
 * would state that the month's spending was zero (3.6). Being wrong while
 * looking right is the one outcome a spending tracker cannot afford.
 */
export async function readInitialBook(
  repository: ExpenseRepository,
  today: IsoDate = todayIso(),
): Promise<InitialBook> {
  const month = monthKeyOf(today);

  try {
    const expenses = await repository.readWindow(month);
    return { month, today, expenses, error: false };
  } catch {
    return { month, today, expenses: [] as Expense[], error: true };
  }
}
