"use client";

import { useMemo, type Dispatch } from "react";

import { monthKeyOf } from "@/lib/domain/dates";
import type { ExpenseDraft, MonthKey } from "@/lib/domain/types";
import type { OpQueue } from "@/lib/expenses/op-queue";
import type { ExpenseRepository } from "@/lib/expenses/repository";

import {
  findExpense,
  newLocalId,
  windowMonths,
  type BookAction,
  type BookState,
} from "./book-store";

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
  /** Serialises the operations of one expense. Required by every write. */
  queue: OpQueue;
}

/** The message a failed write shows. Spanish, because the user reads it. */
function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
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

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Loads `month`'s window if the book does not hold it yet.
 *
 * Registering or editing moves the book to the month of the expense (5.6), and
 * that month may never have been read — nothing else would ask for it, so the
 * book would sit on "cargando" indefinitely. `loadWindow` swallows its own
 * failures, so this can never affect the write it accompanies.
 */
function ensureWindow(context: ActionContext, month: MonthKey): void {
  if (needsLoad(context.state, month)) void loadWindow(context, month);
}

/**
 * Records an expense (Requirement 5).
 *
 * The row is in the book before this function awaits anything: the sheet closes,
 * the header counts it, and the month follows it — all synchronously, which is
 * what keeps registering under ten seconds regardless of the network (5.1, 5.2).
 *
 * `clientOpId` is generated once, here, and captured by the retry closure. A
 * retry therefore carries the same key, and a write that had actually landed is
 * read back rather than written twice (5.7, 5.8).
 */
export function registerExpense(context: ActionContext, draft: ExpenseDraft): Promise<void> {
  const { dispatch, repository, queue } = context;
  const localId = newLocalId();
  const clientOpId = crypto.randomUUID();

  dispatch({ type: "register", draft, id: localId });
  ensureWindow(context, monthKeyOf(draft.date));

  const send = async (): Promise<void> => {
    try {
      const stored = await repository.create(draft, clientOpId);
      // The queue learns the real id before anything queued behind this runs,
      // so a pending edit or delete is sent with it and not with `localId` (7.3).
      queue.rename(localId, stored.id);
      dispatch({ type: "adoptExpense", localId, expense: stored });
    } catch (error) {
      // The book goes back to showing only what is stored (5.4), and the draft
      // is kept so nothing the user typed is lost.
      dispatch({ type: "dropExpense", id: localId });
      dispatch({
        type: "writeFailed",
        failure: {
          message: messageOf(error, "No se pudo guardar el gasto"),
          draft,
          retry: async () => {
            dispatch({ type: "dismissFailure" });
            dispatch({ type: "register", draft, id: localId });
            await queue.run(localId, send);
          },
        },
      });
    }
  };

  return queue.run(localId, send);
}

/** Applies an edit and persists it (6.1, 6.2, 6.9, 7.2). */
export function editExpense(
  context: ActionContext,
  expenseId: string,
  draft: ExpenseDraft,
): Promise<void> {
  const { state, dispatch, repository, queue } = context;
  const before = findExpense(state, expenseId);

  dispatch({ type: "edit", expenseId, draft });
  ensureWindow(context, monthKeyOf(draft.date));

  const send = async (): Promise<void> => {
    try {
      // Resolved HERE, not when the edit was issued: if the row was still being
      // inserted, this is the real id by now (7.3).
      const stored = await repository.update(queue.resolve(expenseId), draft);
      dispatch({ type: "replaceExpense", expense: stored });
    } catch (error) {
      // The previous values come back, so the book shows what is stored (6.2).
      if (before) dispatch({ type: "replaceExpense", expense: before });
      dispatch({
        type: "writeFailed",
        failure: {
          message: messageOf(error, "No se pudo guardar el cambio"),
          draft,
          retry: async () => {
            dispatch({ type: "dismissFailure" });
            dispatch({ type: "edit", expenseId, draft });
            await queue.run(expenseId, send);
          },
        },
      });
    }
  };

  return queue.run(expenseId, send);
}

/**
 * Deletes an expense (Requirement 6).
 *
 * The mark is written immediately, not when the undo window expires: 6.6 says
 * closing the app during that window leaves the deletion final, and a statement
 * waiting on a timer cannot promise that. Undo is therefore a `restore`.
 */
export function deleteExpense(context: ActionContext, expenseId: string): Promise<void> {
  const { state, dispatch, repository, queue } = context;
  const before = findExpense(state, expenseId);

  dispatch({ type: "delete", expenseId });

  const send = async (): Promise<void> => {
    try {
      await repository.softDelete(queue.resolve(expenseId));
    } catch (error) {
      if (before) dispatch({ type: "replaceExpense", expense: before });
      dispatch({ type: "finalizeDelete" });
      dispatch({
        type: "writeFailed",
        failure: {
          message: messageOf(error, "No se pudo eliminar el gasto"),
          retry: async () => {
            dispatch({ type: "dismissFailure" });
            dispatch({ type: "delete", expenseId });
            await queue.run(expenseId, send);
          },
        },
      });
    }
  };

  return queue.run(expenseId, send);
}

/** Puts a deleted expense back, in the book and in the database (6.5, 6.8). */
export function undoDelete(context: ActionContext): Promise<void> {
  const { state, dispatch, repository, queue } = context;
  const expense = state.pendingDeletion;
  if (!expense) return Promise.resolve();

  dispatch({ type: "undoDelete" });

  const send = async (): Promise<void> => {
    try {
      await repository.restore(queue.resolve(expense.id));
    } catch (error) {
      dispatch({ type: "dropExpense", id: expense.id });
      dispatch({
        type: "writeFailed",
        failure: {
          message: messageOf(error, "No se pudo recuperar el gasto"),
          retry: async () => {
            dispatch({ type: "dismissFailure" });
            dispatch({ type: "replaceExpense", expense });
            await queue.run(expense.id, send);
          },
        },
      });
    }
  };

  return queue.run(expense.id, send);
}

/* -------------------------------------------------------------------------- */
/* The hook the components use                                                 */
/* -------------------------------------------------------------------------- */

export interface BookActions {
  register(draft: ExpenseDraft): Promise<void>;
  edit(expenseId: string, draft: ExpenseDraft): Promise<void>;
  remove(expenseId: string): Promise<void>;
  undo(): Promise<void>;
  goTo(month: MonthKey): Promise<void>;
  refresh(): Promise<void>;
  dismissFailure(): void;
  retryFailure(): Promise<void>;
}

/**
 * Binds the actions to the store's current state.
 *
 * Every call reads `context` at invocation time, so an action issued from an
 * event handler always sees the state as of that moment rather than the one
 * captured when the component last rendered.
 */
export function useBookActions(context: ActionContext): BookActions {
  const { state, dispatch } = context;

  return useMemo(
    () => ({
      register: (draft) => registerExpense(context, draft),
      edit: (expenseId, draft) => editExpense(context, expenseId, draft),
      remove: (expenseId) => deleteExpense(context, expenseId),
      undo: () => undoDelete(context),
      goTo: (month) => goToMonth(context, month),
      refresh: () => refreshWindow(context),
      dismissFailure: () => dispatch({ type: "dismissFailure" }),
      retryFailure: () => state.failure?.retry() ?? Promise.resolve(),
    }),
    // `context` is rebuilt on every render of the provider, which is what keeps
    // these bound to fresh state.
    [context, state.failure, dispatch],
  );
}
