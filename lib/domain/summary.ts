import { categoryRank } from "./categories";
import { elapsedDays, monthKeyOf, previousMonth } from "./dates";
import type { CategoryFilterValue, CategoryId, Expense, IsoDate, MonthKey } from "./types";

/*
 * Everything the header shows is derived here, from the flat expense list, by
 * pure functions. No aggregate is ever stored, so none can go stale (2.13).
 */

export function inMonth(expenses: Expense[], month: MonthKey): Expense[] {
  return expenses.filter((e) => monthKeyOf(e.date) === month);
}

/** The month's total (2.1). */
export function monthTotal(expenses: Expense[], month: MonthKey): number {
  return inMonth(expenses, month).reduce((sum, e) => sum + e.amount, 0);
}

export interface DailyAverage {
  amount: number;
  days: number;
}

/** Total over days elapsed; `null` when the month has nothing in it (2.3, 2.9). */
export function dailyAverage(
  expenses: Expense[],
  month: MonthKey,
  today: string,
): DailyAverage | null {
  const total = monthTotal(expenses, month);
  const days = elapsedDays(month, today);
  if (total === 0 || days === 0) return null;
  return { amount: Math.round(total / days), days };
}

export interface MonthComparison {
  direction: "less" | "more";
  percent: number;
  previousMonth: MonthKey;
}

/**
 * How this month compares with the previous one. `null` when either side is
 * empty, which is what hides the line entirely (2.5, 2.11).
 */
export function monthComparison(
  expenses: Expense[],
  month: MonthKey,
): MonthComparison | null {
  const previous = previousMonth(month);
  const current = monthTotal(expenses, month);
  const before = monthTotal(expenses, previous);
  if (current === 0 || before === 0) return null;
  return {
    direction: current < before ? "less" : "more",
    percent: (Math.abs(current - before) / before) * 100,
    previousMonth: previous,
  };
}

export interface BreakdownSlice {
  categoryId: CategoryId;
  total: number;
  share: number;
}

/**
 * One slice per category present in the month, ordered by share descending
 * (2.6). Categories with nothing in them are simply absent (2.8), and an empty
 * month yields an empty list, which is what collapses the bar (2.10).
 */
export function categoryBreakdown(
  expenses: Expense[],
  month: MonthKey,
): BreakdownSlice[] {
  const rows = inMonth(expenses, month);
  const total = rows.reduce((sum, e) => sum + e.amount, 0);
  if (total === 0) return [];

  const totals = new Map<CategoryId, number>();
  for (const e of rows) {
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
  }

  return [...totals.entries()]
    .map(([categoryId, categoryTotal]) => ({
      categoryId,
      total: categoryTotal,
      share: categoryTotal / total,
    }))
    .sort((a, b) => b.total - a.total || categoryRank(a.categoryId) - categoryRank(b.categoryId));
}

/** The month's biggest category, ties broken by the fixed order (2.4, 2.12). */
export function topCategory(
  expenses: Expense[],
  month: MonthKey,
): { categoryId: CategoryId; total: number } | null {
  const [first] = categoryBreakdown(expenses, month);
  return first ? { categoryId: first.categoryId, total: first.total } : null;
}

export interface DayGroup {
  date: IsoDate;
  subtotal: number;
  expenses: Expense[];
}

/**
 * The month as "jornadas", newest day first and newest expense first within a
 * day (1.2, 1.3, 1.5). This is the only function that knows about the category
 * filter — 7.4 and 7.5 expressed in a signature rather than in a component.
 */
export function groupByDay(
  expenses: Expense[],
  month: MonthKey,
  filter: CategoryFilterValue,
): DayGroup[] {
  const rows = inMonth(expenses, month).filter(
    (e) => filter === "todas" || e.categoryId === filter,
  );

  const byDate = new Map<IsoDate, Expense[]>();
  for (const e of rows) {
    const bucket = byDate.get(e.date);
    if (bucket) bucket.push(e);
    else byDate.set(e.date, [e]);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, dayExpenses]) => ({
      date,
      subtotal: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
      expenses: [...dayExpenses].sort((a, b) => b.createdAt - a.createdAt),
    }));
}
