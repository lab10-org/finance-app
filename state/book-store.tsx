"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import { monthKeyOf, todayIso } from "@/lib/domain/dates";
import { DEFAULT_CURRENCY } from "@/lib/domain/types";
import type {
  CategoryFilterValue,
  Expense,
  ExpenseDraft,
  IsoDate,
  MonthKey,
} from "@/lib/domain/types";
import { SEED_EXPENSES, SEED_MONTH } from "@/lib/seed";

export type SheetState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; expenseId: string };

export interface BookState {
  expenses: Expense[];
  viewedMonth: MonthKey;
  filter: CategoryFilterValue;
  sheet: SheetState;
  /** The undo buffer: an expense deleted but still recoverable (6.1, 6.3). */
  pendingDeletion: Expense | null;
  today: IsoDate;
}

export type BookAction =
  | { type: "setMonth"; month: MonthKey }
  | { type: "setFilter"; filter: CategoryFilterValue }
  | { type: "openSheet"; sheet: Exclude<SheetState, { mode: "closed" }> }
  | { type: "closeSheet" }
  | { type: "register"; draft: ExpenseDraft }
  | { type: "edit"; expenseId: string; draft: ExpenseDraft }
  | { type: "delete"; expenseId: string }
  | { type: "undoDelete" }
  | { type: "finalizeDelete" };

/** How long a deleted expense stays recoverable (6.4). */
export const UNDO_WINDOW_MS = 5000;

export function createInitialState(today: IsoDate = todayIso()): BookState {
  return {
    expenses: [...SEED_EXPENSES],
    viewedMonth: SEED_MONTH,
    filter: "todas",
    sheet: { mode: "closed" },
    pendingDeletion: null,
    today,
  };
}

/** Blank descriptions are stored as absent, never as "" (1.7, 1.8). */
function cleanDescription(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Keeps the filter only while the selected category still has something in the
 * viewed month; otherwise falls back to "todas" (7.7).
 */
function stillPresent(
  expenses: Expense[],
  month: MonthKey,
  filter: CategoryFilterValue,
): CategoryFilterValue {
  if (filter === "todas") return "todas";
  const survives = expenses.some(
    (e) => e.categoryId === filter && monthKeyOf(e.date) === month,
  );
  return survives ? filter : "todas";
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `e-${Math.random().toString(36).slice(2)}`;
}

export function bookReducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case "setMonth": {
      // The book never moves past the month containing today (8.4).
      if (action.month > monthKeyOf(state.today)) return state;
      if (action.month === state.viewedMonth) return state;
      // Changing month always clears the filter (7.6).
      return { ...state, viewedMonth: action.month, filter: "todas" };
    }

    case "setFilter":
      return { ...state, filter: action.filter };

    case "openSheet":
      return { ...state, sheet: action.sheet };

    case "closeSheet":
      return { ...state, sheet: { mode: "closed" } };

    case "register": {
      const expense: Expense = {
        id: newId(),
        amount: action.draft.amount,
        // The one place an expense is built, and so the one place the currency
        // is decided (10.3).
        currency: DEFAULT_CURRENCY,
        categoryId: action.draft.categoryId,
        ...(cleanDescription(action.draft.description) === undefined
          ? {}
          : { description: cleanDescription(action.draft.description) }),
        date: action.draft.date,
        createdAt: Date.now(),
      };
      return {
        ...state,
        expenses: [...state.expenses, expense],
        sheet: { mode: "closed" },
        // Follow the expense so it is never recorded out of sight (4.5, 5.4).
        viewedMonth: monthKeyOf(expense.date),
      };
    }

    case "edit": {
      const expenses = state.expenses.map((e) =>
        e.id === action.expenseId
          ? {
              ...e,
              amount: action.draft.amount,
              categoryId: action.draft.categoryId,
              description: cleanDescription(action.draft.description),
              date: action.draft.date,
            }
          : e,
      );
      return {
        ...state,
        expenses,
        sheet: { mode: "closed" },
        viewedMonth: monthKeyOf(action.draft.date),
      };
    }

    case "delete": {
      const expense = state.expenses.find((e) => e.id === action.expenseId);
      if (!expense) return state;
      const expenses = state.expenses.filter((e) => e.id !== action.expenseId);
      // A second deletion finalises the first one on the spot (6.5).
      return {
        ...state,
        expenses,
        pendingDeletion: expense,
        sheet: { mode: "closed" },
        filter: stillPresent(expenses, state.viewedMonth, state.filter),
      };
    }

    case "undoDelete": {
      if (!state.pendingDeletion) return state;
      // Order derives from `date` and `createdAt`, so appending restores the
      // expense to exactly where it was (6.3).
      return {
        ...state,
        expenses: [...state.expenses, state.pendingDeletion],
        pendingDeletion: null,
      };
    }

    case "finalizeDelete":
      return state.pendingDeletion === null ? state : { ...state, pendingDeletion: null };

    default:
      return state;
  }
}

const BookContext = createContext<{
  state: BookState;
  dispatch: Dispatch<BookAction>;
} | null>(null);

export function BookProvider({
  children,
  today,
}: {
  children: ReactNode;
  today?: IsoDate;
}) {
  const [state, dispatch] = useReducer(
    bookReducer,
    today,
    (t) => createInitialState(t ?? todayIso()),
  );

  /*
   * The undo timer lives here rather than in the reducer: a reducer that
   * schedules timers is no longer pure, and no longer testable as one (6.4).
   */
  useEffect(() => {
    if (!state.pendingDeletion) return;
    const timer = setTimeout(
      () => dispatch({ type: "finalizeDelete" }),
      UNDO_WINDOW_MS,
    );
    return () => clearTimeout(timer);
  }, [state.pendingDeletion]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

export function useBook() {
  const value = useContext(BookContext);
  if (!value) throw new Error("useBook must be used inside <BookProvider>");
  return value;
}

export type { Expense, ExpenseDraft };
