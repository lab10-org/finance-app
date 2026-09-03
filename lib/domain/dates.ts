import type { IsoDate, MonthKey } from "./types";

/*
 * Dates are `YYYY-MM-DD` strings throughout. Grouping and comparison are string
 * operations, so no timezone can move an expense into the wrong day.
 */

export function monthKeyOf(date: IsoDate): MonthKey {
  return date.slice(0, 7);
}

export function dayOfMonth(date: IsoDate): number {
  return Number(date.slice(8, 10));
}

export function splitMonth(month: MonthKey): { year: number; month: number } {
  return { year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) };
}

export function formatMonthKey(year: number, month: number): MonthKey {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

export function daysInMonth(month: MonthKey): number {
  const { year, month: m } = splitMonth(month);
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const { year, month: m } = splitMonth(month);
  const zeroBased = year * 12 + (m - 1) + delta;
  return formatMonthKey(Math.floor(zeroBased / 12), (zeroBased % 12) + 1);
}

export function previousMonth(month: MonthKey): MonthKey {
  return addMonths(month, -1);
}

export function nextMonth(month: MonthKey): MonthKey {
  return addMonths(month, 1);
}

export function firstDayOf(month: MonthKey): IsoDate {
  return `${month}-01`;
}

/**
 * How many days of `month` have actually happened, as of `today` (2.3):
 * the day of the month for the current month, the whole month for a past one,
 * and nothing for a month that has not started.
 */
export function elapsedDays(month: MonthKey, today: IsoDate): number {
  const current = monthKeyOf(today);
  if (month === current) return dayOfMonth(today);
  if (month < current) return daysInMonth(month);
  return 0;
}

/** The day before `date`, still as a `YYYY-MM-DD` string. */
export function previousDay(date: IsoDate): IsoDate {
  const [y, m, d] = [date.slice(0, 4), date.slice(5, 7), date.slice(8, 10)].map(Number);
  const t = new Date(Date.UTC(y, m - 1, d - 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(
    t.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Today, in the viewer's own timezone, as `YYYY-MM-DD`. */
export function todayIso(now: Date = new Date()): IsoDate {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}
