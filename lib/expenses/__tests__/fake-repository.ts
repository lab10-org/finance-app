import { monthKeyOf, previousMonth } from "@/lib/domain/dates";
import { DEFAULT_CURRENCY } from "@/lib/domain/types";
import type { Expense, ExpenseDraft, MonthKey } from "@/lib/domain/types";
import type { ExpenseRepository } from "@/lib/expenses/repository";

/*
 * An `ExpenseRepository` held in memory, with latency and failure under the
 * test's control.
 *
 * Requirements 5 to 9 are almost entirely about the interval between issuing a
 * write and hearing back about it: the row is visible, it is editable, its id is
 * provisional, the header already counts it. None of that is observable unless a
 * test can hold a write open, so `deferred` exists to do exactly that.
 */

export interface FakeRepository extends ExpenseRepository {
  /** Everything stored, including soft-deleted rows. */
  rows: Expense[];
  /** Ids of the rows currently marked deleted. */
  deleted: Set<string>;
  /** Every (draft, key) pair `create` was called with, in order. */
  created: { draft: ExpenseDraft; clientOpId: string }[];
  /** While true, the next call of each kind hangs until `release` is called. */
  defer(kinds?: OpKind[]): void;
  /** Resolves everything `defer` is holding. */
  release(): Promise<void>;
  /** The next call of these kinds rejects with `message`. */
  failNext(message: string, kinds?: OpKind[]): void;
  /** Replaces the stored rows, as a re-read from elsewhere would. */
  seed(rows: Expense[]): void;
}

export type OpKind = "read" | "create" | "update" | "delete" | "restore";

const ALL: OpKind[] = ["read", "create", "update", "delete", "restore"];

let counter = 0;

function newRealId(): string {
  counter += 1;
  // Shaped like the uuid v7 the database generates, and ascending like one, so
  // ordering assertions mean the same thing here as they do in Postgres.
  return `0199a1b2-c3d4-7000-8000-${String(counter).padStart(12, "0")}`;
}

export function createFakeRepository(initial: Expense[] = []): FakeRepository {
  let rows = [...initial];
  const deleted = new Set<string>();
  const created: { draft: ExpenseDraft; clientOpId: string }[] = [];
  const byKey = new Map<string, Expense>();

  let deferring: OpKind[] = [];
  let failing: { kinds: OpKind[]; message: string } | null = null;
  let pending: (() => void)[] = [];

  async function gate(kind: OpKind): Promise<void> {
    if (deferring.includes(kind)) {
      await new Promise<void>((resolve) => pending.push(resolve));
    }
    if (failing && failing.kinds.includes(kind)) {
      const { message } = failing;
      failing = null;
      throw new Error(message);
    }
  }

  const repo: FakeRepository = {
    get rows() {
      return rows;
    },
    deleted,
    created,

    defer(kinds = ALL) {
      deferring = kinds;
    },

    async release() {
      const waiting = pending;
      pending = [];
      deferring = [];
      for (const resolve of waiting) resolve();
      // Let the continuations run before the test asserts on them.
      await Promise.resolve();
    },

    failNext(message, kinds = ALL) {
      failing = { kinds, message };
    },

    seed(next) {
      rows = [...next];
    },

    async readWindow(month: MonthKey) {
      await gate("read");
      const window = [month, previousMonth(month)];
      return rows
        .filter((e) => !deleted.has(e.id) && window.includes(monthKeyOf(e.date)))
        .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
    },

    async create(draft, clientOpId) {
      created.push({ draft, clientOpId });
      await gate("create");

      // The unique index, in miniature: the same key twice is the same row.
      const already = byKey.get(clientOpId);
      if (already) return already;

      const expense: Expense = {
        id: newRealId(),
        amount: draft.amount,
        currency: DEFAULT_CURRENCY,
        categoryId: draft.categoryId,
        ...(draft.description?.trim() ? { description: draft.description.trim() } : {}),
        date: draft.date,
        createdAt: Date.now(),
      };

      rows = [...rows, expense];
      byKey.set(clientOpId, expense);
      return expense;
    },

    async update(id, draft) {
      await gate("update");
      const existing = rows.find((e) => e.id === id);
      if (!existing) throw new Error(`no such expense: ${id}`);

      const updated: Expense = {
        ...existing,
        amount: draft.amount,
        categoryId: draft.categoryId,
        date: draft.date,
        ...(draft.description?.trim()
          ? { description: draft.description.trim() }
          : { description: undefined }),
      };

      rows = rows.map((e) => (e.id === id ? updated : e));
      return updated;
    },

    async softDelete(id) {
      await gate("delete");
      deleted.add(id);
    },

    async restore(id) {
      await gate("restore");
      deleted.delete(id);
    },
  };

  return repo;
}
