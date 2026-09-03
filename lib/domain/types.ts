export type CategoryId =
  | "mercado"
  | "restaurantes"
  | "transporte"
  | "suscripciones"
  | "otros";

/** A calendar date as `YYYY-MM-DD`. Never parsed into a `Date`. */
export type IsoDate = string;

/** A calendar month as `YYYY-MM`. */
export type MonthKey = string;

export interface Category {
  id: CategoryId;
  /** The Spanish name shown in the UI. */
  label: string;
  /** lucide icon name. */
  glyph: string;
  /** CSS custom property holding this category's colour. */
  colorToken: string;
}

export interface Expense {
  id: string;
  /** Whole Colombian pesos, always >= 1. */
  amountCop: number;
  categoryId: CategoryId;
  /** Absent when the user did not write one — never an empty string (1.8). */
  description?: string;
  date: IsoDate;
  /** Epoch ms; orders expenses within a day (1.3). */
  createdAt: number;
}

export type ExpenseDraft = Omit<Expense, "id" | "createdAt">;

/** The category filter, where `"todas"` means no filter is applied. */
export type CategoryFilterValue = CategoryId | "todas";
