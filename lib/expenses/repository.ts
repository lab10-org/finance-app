import type { SupabaseClient } from "@supabase/supabase-js";

import { firstDayOf, nextMonth, previousMonth } from "@/lib/domain/dates";
import type { Expense, ExpenseDraft, MonthKey } from "@/lib/domain/types";
import { draftToInsert, rowToExpense, type ExpenseRow } from "@/lib/expenses/mapper";

/*
 * Every statement this feature sends to Supabase, behind one interface.
 *
 * The seam exists so the store and the components can be tested against an
 * in-memory implementation with controllable latency and failure — the optimistic
 * behaviour of requirements 5 to 9 is about what happens WHILE a write is in
 * flight, and that is unobservable through a real client.
 */

/** Postgres' unique-violation code. */
const UNIQUE_VIOLATION = "23505";

const COLUMNS = "id, amount, currency, category_id, description, date, created_at";

export interface ExpenseRepository {
  /** `month` and the month before it, deleted rows excluded (3.3, 4.1). */
  readWindow(month: MonthKey): Promise<Expense[]>;
  /**
   * `clientOpId` is generated once per confirmation and repeated by every retry
   * of it, so a retry of a write that actually landed reads that row back
   * instead of inserting a second one (5.7, 5.8).
   */
  create(draft: ExpenseDraft, clientOpId: string): Promise<Expense>;
  update(id: string, draft: ExpenseDraft): Promise<Expense>;
  /** Sets `deleted_at`; the row survives (6.4, 6.10). */
  softDelete(id: string): Promise<void>;
  /** Clears `deleted_at`: the undo of a soft deletion (6.5). */
  restore(id: string): Promise<void>;
}

interface PostgrestFailure {
  code?: string;
  message: string;
}

/*
 * `operation` is the sentence the user reads: `messageOf` in
 * `state/book-actions.ts` prefers `error.message` over its own fallback, so
 * whatever is put here lands in the aviso. That is why the driver's own text
 * does not go in it — "No se pudo guardar el gasto: TypeError: Failed to fetch"
 * is an apology in Spanish with an English stack trace stapled to the end.
 * The cause is kept, so nothing is lost for the console or a report.
 */
function fail(operation: string, error: PostgrestFailure): never {
  throw new Error(operation, { cause: error });
}

export function createExpenseRepository(client: SupabaseClient): ExpenseRepository {
  const table = () => client.from("expenses");

  return {
    async readWindow(month) {
      /*
       * A half-open range over the two months the screen needs: from the first
       * day of the previous month up to, but excluding, the first day of the
       * next one. Expressed this way there is no last-day-of-month arithmetic to
       * get wrong, and February needs no special case.
       *
       * No `user_id` filter: RLS decides that, and naming it here would be a
       * second place for the rule to be wrong (2.2, 2.4).
       */
      const { data, error } = await table()
        .select(COLUMNS)
        .gte("date", firstDayOf(previousMonth(month)))
        .lt("date", firstDayOf(nextMonth(month)))
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) fail("No se pudieron leer los gastos", error);
      return ((data ?? []) as ExpenseRow[]).map(rowToExpense);
    },

    async create(draft, clientOpId) {
      const { data, error } = await table()
        .insert({ ...draftToInsert(draft), client_op_id: clientOpId })
        .select(COLUMNS)
        .single();

      if (!error) return rowToExpense(data as ExpenseRow);

      /*
       * The key is already there, so this confirmation was already written and
       * only its response went missing. Reading that row back is what makes a
       * retry idempotent without ever comparing amounts or dates (5.7, 5.8).
       */
      if (error.code === UNIQUE_VIOLATION) {
        const existing = await table()
          .select(COLUMNS)
          .eq("client_op_id", clientOpId)
          .single();

        if (existing.error) fail("No se pudo guardar el gasto", existing.error);
        return rowToExpense(existing.data as ExpenseRow);
      }

      return fail("No se pudo guardar el gasto", error);
    },

    async update(id, draft) {
      // `client_op_id` is deliberately absent: it identifies the creation, not
      // the row, and rewriting it would break the idempotency of a later retry.
      const { data, error } = await table()
        .update(draftToInsert(draft))
        .eq("id", id)
        .select(COLUMNS)
        .single();

      if (error) fail("No se pudo guardar el cambio", error);
      return rowToExpense(data as ExpenseRow);
    },

    async softDelete(id) {
      const { error } = await table()
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) fail("No se pudo eliminar el gasto", error);
    },

    async restore(id) {
      const { error } = await table().update({ deleted_at: null }).eq("id", id);

      if (error) fail("No se pudo recuperar el gasto", error);
    },
  };
}
