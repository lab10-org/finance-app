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

/**
 * ISO 4217. Stored alongside every amount so the schema does not have to change
 * the day a second one appears — but this version only ever writes `"COP"`
 * (10.2, 10.3), and no total ever mixes two.
 */
export type Currency = "COP";

export const DEFAULT_CURRENCY: Currency = "COP";

export interface Expense {
  id: string;
  /**
   * The amount in `currency`. Stored as `numeric(14,2)`, so it may arrive with
   * decimals even though every COP amount the app writes is whole (10.1).
   */
  amount: number;
  currency: Currency;
  categoryId: CategoryId;
  /** Absent when the user did not write one — never an empty string (1.8). */
  description?: string;
  date: IsoDate;
  /** Epoch ms; orders expenses within a day (1.3). */
  createdAt: number;
}

/**
 * What "la hoja" produces. `currency` is absent on purpose: nothing in the
 * interface offers a choice, so it is stamped as `DEFAULT_CURRENCY` at the one
 * place an expense is built (10.3).
 */
export type ExpenseDraft = Omit<Expense, "id" | "createdAt" | "currency">;

/** The category filter, where `"todas"` means no filter is applied. */
export type CategoryFilterValue = CategoryId | "todas";
