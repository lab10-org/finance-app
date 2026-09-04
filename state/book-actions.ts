"use client";

import type { Dispatch } from "react";

import type { MonthKey } from "@/lib/domain/types";
import type { ExpenseRepository } from "@/lib/expenses/repository";

import { windowMonths, type BookAction, type BookState } from "./book-store";

/*
 * The asynchronous half of the store.
 *
 * The reducer stays pure and synchronous; everything that talks to the database
 * lives here, as plain functions over (state, dispatch, repository). They are
 * not hooks, so a test can call them directly and await them.
 */

export interface ActionContext {
  state: BookState;
  dispatch: Dispatch<BookAction>;
  repository: ExpenseRepository;
}

/** True when either month of `month`'s window has never been read (4.1, 4.3). */
export function needsLoad(state: BookState, month: MonthKey): boolean {
  return windowMonths(month).some((key) => state.months[key] === undefined);
}

/**
 * Reads `month`'s window unless it is already held.
 *
 * 4.3 is the reason for the guard: returning to a month already read must not
 * read it again. 4.1 is the reason for the read: a month never seen must be
 * fetched together with the month before it, because the "comparativo" needs it.
 */
export async function loadWindow(
  { state, dispatch, repository }: ActionContext,
  month: MonthKey,
  { force = false }: { force?: boolean } = {},
): Promise<void> {
  if (!force && !needsLoad(state, month)) return;

  const months = windowMonths(month);
  dispatch({ type: "monthLoading", months });

  try {
    const expenses = await repository.readWindow(month);
    dispatch({ type: "monthLoaded", months, expenses });
  } catch {
    // The months keep whatever data they already had; only the status changes,
    // so a failed refresh never empties the book (4.4, 9.5).
    dispatch({ type: "monthFailed", months });
  }
}

/** Moves the book, then reads the destination if it has not been read (4.1). */
export async function goToMonth(context: ActionContext, month: MonthKey): Promise<void> {
  const { state, dispatch } = context;

  // The book never moves past the month containing today (4.5); asking the
  // reducer rather than repeating the rule keeps it in one place.
  const moved = { ...state, viewedMonth: month };
  dispatch({ type: "setMonth", month });

  if (month > state.today.slice(0, 7)) return;
  await loadWindow({ ...context, state: moved }, month);
}

/** Re-reads the window the book is showing, keeping what it has on failure. */
export async function refreshWindow(context: ActionContext): Promise<void> {
  await loadWindow(context, context.state.viewedMonth, { force: true });
}
