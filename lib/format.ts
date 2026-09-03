import { dayOfMonth, previousDay, splitMonth } from "@/lib/domain/dates";
import type { IsoDate, MonthKey } from "@/lib/domain/types";

/*
 * Every user-visible string derived from a number or a date is produced here.
 * The month names are a table rather than a locale lookup, so the output cannot
 * vary with the runtime's ICU data.
 */
const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const MAX_AMOUNT_DIGITS = 9;

function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 1284500 -> "$1.284.500" (9.1, 9.2) */
export function formatCop(amount: number): string {
  return `$${groupThousands(Math.round(amount))}`;
}

/** 9.04 -> "9,0%" (9.3) */
export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

/** 0.384 -> "38%" (2.7) */
export function formatSharePercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function monthName(month: MonthKey): string {
  return MONTH_NAMES[splitMonth(month).month - 1];
}

/** "2026-09" -> "Septiembre 2026" (8.3) */
export function formatMonthTitle(month: MonthKey): string {
  const name = monthName(month);
  return `${name[0].toUpperCase()}${name.slice(1)} ${splitMonth(month).year}`;
}

/** "2026-09" -> "SEPTIEMBRE 2026" (3.4) */
export function formatMonthUpper(month: MonthKey): string {
  return `${monthName(month).toUpperCase()} ${splitMonth(month).year}`;
}

/** "2026-09" -> "SEPTIEMBRE" (1.9) */
export function formatMonthNameUpper(month: MonthKey): string {
  return monthName(month).toUpperCase();
}

/** "2026-08" -> "agosto" (2.2, 2.5) */
export function formatMonthLower(month: MonthKey): string {
  return monthName(month);
}

/** "HOY" | "AYER" | "1 DE SEPTIEMBRE" (1.4) */
export function formatDayStrip(date: IsoDate, today: IsoDate): string {
  if (date === today) return "HOY";
  if (date === previousDay(today)) return "AYER";
  return `${dayOfMonth(date)} DE ${monthName(date.slice(0, 7)).toUpperCase()}`;
}

/**
 * Digits only, no decimals, and never more than nine digits — which is exactly
 * "ignore further digits past 999.999.999" (9.5, 9.6, 4.10).
 */
export function parseAmountInput(raw: string): number {
  const digits = raw.replace(/\D/g, "").slice(0, MAX_AMOUNT_DIGITS);
  return digits === "" ? 0 : Number(digits);
}

/** What the amount field shows while the user types (9.5). */
export function formatAmountInput(raw: string): string {
  const value = parseAmountInput(raw);
  return value === 0 ? "" : groupThousands(value);
}
