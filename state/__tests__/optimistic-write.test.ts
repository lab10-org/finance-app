import { describe, expect, it } from "vitest";

import { seededBook } from "@/lib/domain/__tests__/fixtures";
import { groupByDay, monthTotal } from "@/lib/domain/summary";
import type { ExpenseDraft } from "@/lib/domain/types";
import { createFakeRepository } from "@/lib/expenses/__tests__/fake-repository";
import { createOpQueue } from "@/lib/expenses/op-queue";
import {
  deleteExpense,
  editExpense,
  registerExpense,
  undoDelete,
} from "@/state/book-actions";
import {
  bookReducer,
  createInitialState,
  findExpense,
  isLocalId,
  windowExpenses,
  windowStatus,
  type BookState,
} from "@/state/book-store";

const TODAY = "2026-09-04";

function harness(expenses = seededBook("2026-09")) {
  const repository = createFakeRepository(expenses);
  const queue = createOpQueue();
  let state: BookState = createInitialState({
    month: "2026-09",
    today: TODAY,
    expenses,
    error: false,
  });

  const dispatch = (action: Parameters<typeof bookReducer>[1]) => {
    state = bookReducer(state, action);
  };

  return {
    repository,
    queue,
    get context() {
      return { state, dispatch, repository, queue };
    },
    get state() {
      return state;
    },
    get window() {
      return windowExpenses(state, state.viewedMonth);
    },
  };
}

const draft = (over: Partial<ExpenseDraft> = {}): ExpenseDraft => ({
  amount: 48_500,
  categoryId: "mercado",
  date: "2026-09-04",
  ...over,
});

describe("registering is instant (5.1, 5.2)", () => {
  it("shows the expense and closes the sheet before the write returns", async () => {
    const h = harness();
    h.repository.defer(["create"]);

    const writing = registerExpense(h.context, draft());

    // Nothing has been awaited by the test yet, and the book already has it.
    expect(h.window).toHaveLength(seededBook("2026-09").length + 1);
    expect(h.state.sheet).toEqual({ mode: "closed" });

    await h.repository.release();
    await writing;
  });

  it("counts the unconfirmed expense in the header (5.2)", async () => {
    const h = harness();
    const before = monthTotal(h.window, "2026-09");
    h.repository.defer(["create"]);

    const writing = registerExpense(h.context, draft({ amount: 10_000 }));

    // The header must never disagree with the list it sits above.
    expect(monthTotal(h.window, "2026-09")).toBe(before + 10_000);

    await h.repository.release();
    await writing;
  });

  it("follows the expense to its month (5.6)", async () => {
    const h = harness();
    await registerExpense(h.context, draft({ date: "2026-08-15" }));

    expect(h.state.viewedMonth).toBe("2026-08");
  });

  it("loads the window when the expense lands in a month never read (5.6, 4.1)", async () => {
    // Without this the book would move to a month whose window is incomplete
    // and sit on "cargando" forever: nothing else would ever ask for it.
    const h = harness();
    await registerExpense(h.context, draft({ date: "2026-03-10" }));

    expect(h.state.viewedMonth).toBe("2026-03");
    expect(windowStatus(h.state, "2026-03")).toBe("loaded");
  });

  it("loads the window when an EDIT moves the expense to an unread month", async () => {
    const h = harness();
    const target = seededBook("2026-09").find((e) => e.date === "2026-09-02")!;

    await editExpense(h.context, target.id, draft({ date: "2026-03-10" }));

    expect(h.state.viewedMonth).toBe("2026-03");
    expect(windowStatus(h.state, "2026-03")).toBe("loaded");
  });
});

describe("adopting the real id (5.3)", () => {
  it("replaces the provisional id with the stored one", async () => {
    const h = harness();
    await registerExpense(h.context, draft());

    const added = h.window.filter((e) => e.amount === 48_500 && e.date === "2026-09-04");
    expect(added).toHaveLength(1);
    expect(isLocalId(added[0].id)).toBe(false);
  });

  it("does not move the row or change a value while doing it (5.3)", async () => {
    const h = harness();
    h.repository.defer(["create"]);

    const writing = registerExpense(h.context, draft({ amount: 7_777 }));
    const positionBefore = groupByDay(h.window, "2026-09", "todas")
      .find((d) => d.date === "2026-09-04")!
      .expenses.findIndex((e) => e.amount === 7_777);

    await h.repository.release();
    await writing;

    const day = groupByDay(h.window, "2026-09", "todas").find((d) => d.date === "2026-09-04")!;
    const positionAfter = day.expenses.findIndex((e) => e.amount === 7_777);

    expect(positionAfter).toBe(positionBefore);
    expect(day.expenses[positionAfter].amount).toBe(7_777);
  });

  it("sends the draft to the repository exactly once (5.6)", async () => {
    const h = harness();
    await registerExpense(h.context, draft());

    expect(h.repository.created).toHaveLength(1);
  });

  it("never sends a provisional id to the repository", async () => {
    const h = harness();
    await registerExpense(h.context, draft());

    for (const row of h.repository.rows) expect(isLocalId(row.id)).toBe(false);
  });
});

describe("a failed registration (5.4, 5.5)", () => {
  it("takes the row back out and reports it", async () => {
    const h = harness();
    const before = h.window.length;
    h.repository.failNext("No se pudo guardar el gasto", ["create"]);

    await registerExpense(h.context, draft());

    expect(h.window).toHaveLength(before);
    expect(h.state.failure?.message).toBe("No se pudo guardar el gasto");
  });

  it("keeps the draft, so nothing the user typed is lost (5.4)", async () => {
    const h = harness();
    h.repository.failNext("offline", ["create"]);

    await registerExpense(h.context, draft({ amount: 33_000, description: "Café Velvet" }));

    expect(h.state.failure?.draft).toMatchObject({
      amount: 33_000,
      description: "Café Velvet",
    });
  });

  it("offers a retry that succeeds and clears the failure (5.5)", async () => {
    const h = harness();
    const before = h.window.length;
    h.repository.failNext("offline", ["create"]);

    await registerExpense(h.context, draft());
    expect(h.state.failure).not.toBeNull();

    await h.state.failure!.retry();

    expect(h.state.failure).toBeNull();
    expect(h.window).toHaveLength(before + 1);
  });

  it("retries with the SAME key, so a write that had landed is not duplicated (5.7)", async () => {
    const h = harness();
    h.repository.failNext("lost response", ["create"]);

    await registerExpense(h.context, draft());
    await h.state.failure!.retry();

    const keys = h.repository.created.map((c) => c.clientOpId);
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(1);
  });

  it("ends with one expense, not two, when the first write had actually landed", async () => {
    // The fake repository keys rows by clientOpId exactly as the unique index
    // does, so a retry of a landed write reads it back instead of inserting.
    const h = harness([]);
    h.repository.failNext("lost response", ["create"]);

    await registerExpense(h.context, draft());
    await h.state.failure!.retry();

    expect(h.repository.rows).toHaveLength(1);
  });

  it("keeps two genuinely identical expenses apart (5.8)", async () => {
    // Two coffees, same amount, same day, same category, no description. They
    // must remain two expenses — this is what a value-matching heuristic broke.
    const h = harness([]);
    const identical = draft({ amount: 16_800, categoryId: "restaurantes" });

    await registerExpense(h.context, identical);
    await registerExpense(h.context, identical);

    expect(h.repository.rows).toHaveLength(2);
    const keys = h.repository.created.map((c) => c.clientOpId);
    expect(new Set(keys).size).toBe(2);
  });
});

describe("acting on an expense that is still in flight (7.1, 7.2, 7.3)", () => {
  it("lets an edit be issued before the insert has returned", async () => {
    const h = harness([]);
    h.repository.defer(["create"]);

    const writing = registerExpense(h.context, draft({ amount: 1_000 }));
    const pendingRow = h.window[0];
    expect(isLocalId(pendingRow.id)).toBe(true);

    // 7.2: the result is shown at once, exactly as for a confirmed expense.
    const editing = editExpense(h.context, pendingRow.id, draft({ amount: 2_000 }));
    expect(h.window[0].amount).toBe(2_000);

    await h.repository.release();
    await Promise.all([writing, editing]);

    // 7.3: the edit reached the row the user acted on, with its real id.
    expect(h.repository.rows).toHaveLength(1);
    expect(h.repository.rows[0].amount).toBe(2_000);
    expect(isLocalId(h.repository.rows[0].id)).toBe(false);
  });

  it("lets a delete be issued before the insert has returned", async () => {
    const h = harness([]);
    h.repository.defer(["create"]);

    const writing = registerExpense(h.context, draft());
    const pendingRow = h.window[0];

    const deleting = deleteExpense(h.context, pendingRow.id);
    expect(h.window).toHaveLength(0);

    await h.repository.release();
    await Promise.all([writing, deleting]);

    // The row exists in the table and is marked deleted — never orphaned.
    expect(h.repository.rows).toHaveLength(1);
    expect(h.repository.deleted.has(h.repository.rows[0].id)).toBe(true);
  });

  it("applies the action to that expense and to no other (7.4)", async () => {
    const h = harness([]);
    h.repository.defer(["create"]);

    const first = registerExpense(h.context, draft({ amount: 111 }));
    const firstRow = h.window.find((e) => e.amount === 111)!;
    const second = registerExpense(h.context, draft({ amount: 222 }));

    const editing = editExpense(h.context, firstRow.id, draft({ amount: 999 }));

    await h.repository.release();
    await Promise.all([first, second, editing]);

    const amounts = h.repository.rows.map((r) => r.amount).sort((a, b) => a - b);
    expect(amounts).toEqual([222, 999]);
  });
});

describe("editing and deleting a stored expense (6.1, 6.2, 6.4, 6.5)", () => {
  const target = seededBook("2026-09").find((e) => e.date === "2026-09-03")!;

  it("persists an edit", async () => {
    const h = harness();
    await editExpense(h.context, target.id, draft({ amount: 60_000, date: target.date }));

    expect(h.repository.rows.find((e) => e.id === target.id)!.amount).toBe(60_000);
  });

  it("puts the previous values back when the edit fails (6.2)", async () => {
    const h = harness();
    h.repository.failNext("offline", ["update"]);

    await editExpense(h.context, target.id, draft({ amount: 60_000, date: target.date }));

    expect(findExpense(h.state, target.id)!.amount).toBe(target.amount);
    expect(h.state.failure?.message).toBe("offline");
  });

  it("marks the deletion at once, not when the window expires (6.4, 6.6)", async () => {
    const h = harness();
    await deleteExpense(h.context, target.id);

    // Nothing waited for the undo timer: closing the tab now leaves it deleted.
    expect(h.repository.deleted.has(target.id)).toBe(true);
    expect(h.state.pendingDeletion?.id).toBe(target.id);
  });

  it("restores it in the database when undone (6.5)", async () => {
    const h = harness();
    await deleteExpense(h.context, target.id);
    await undoDelete(h.context);

    expect(h.repository.deleted.has(target.id)).toBe(false);
    expect(findExpense(h.state, target.id)).not.toBeNull();
  });

  it("returns the expense to the book when the deletion fails (6.8)", async () => {
    const h = harness();
    h.repository.failNext("offline", ["delete"]);

    await deleteExpense(h.context, target.id);

    expect(findExpense(h.state, target.id)).not.toBeNull();
    expect(h.state.failure?.message).toBe("offline");
  });

  it("offers a retry for a failed deletion (6.9)", async () => {
    const h = harness();
    h.repository.failNext("offline", ["delete"]);

    await deleteExpense(h.context, target.id);
    await h.state.failure!.retry();

    expect(h.repository.deleted.has(target.id)).toBe(true);
    expect(h.state.failure).toBeNull();
  });
});
