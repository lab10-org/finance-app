import { describe, expect, it } from "vitest";

import { seededBook } from "@/lib/domain/__tests__/fixtures";
import type { ExpenseDraft } from "@/lib/domain/types";
import { createFakeRepository } from "@/lib/expenses/__tests__/fake-repository";
import { createOpQueue } from "@/lib/expenses/op-queue";
import { refreshWindow, registerExpense } from "@/state/book-actions";
import {
  bookReducer,
  createInitialState,
  isLocalId,
  windowExpenses,
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

const draft: ExpenseDraft = {
  amount: 12_345,
  categoryId: "otros",
  date: "2026-09-04",
};

describe("a re-read keeps what is still in flight (9.4)", () => {
  it("does not drop an expense whose write has not returned", async () => {
    const h = harness();
    h.repository.defer(["create"]);

    const writing = registerExpense(h.context, draft);
    const pending = h.window.find((e) => e.amount === 12_345)!;
    expect(isLocalId(pending.id)).toBe(true);

    // The refresh reads a database that does not know about it yet — exactly
    // what happens when the tab wakes up mid-write.
    await refreshWindow(h.context);

    expect(h.window.some((e) => e.id === pending.id)).toBe(true);

    await h.repository.release();
    await writing;
  });

  it("still shows it in the total while the re-read lands", async () => {
    const h = harness([]);
    h.repository.defer(["create"]);

    const writing = registerExpense(h.context, draft);
    await refreshWindow(h.context);

    // The header must not disagree with the list, refresh or no refresh.
    expect(h.window).toHaveLength(1);
    expect(h.window[0].amount).toBe(12_345);

    await h.repository.release();
    await writing;
  });

  it("leaves exactly one row once the write lands after the re-read", async () => {
    const h = harness([]);
    h.repository.defer(["create"]);

    const writing = registerExpense(h.context, draft);
    await refreshWindow(h.context);
    await h.repository.release();
    await writing;

    // The optimistic row was adopted, not duplicated by the refresh.
    expect(h.window).toHaveLength(1);
    expect(isLocalId(h.window[0].id)).toBe(false);
  });

  it("takes up a change made elsewhere (9.3)", async () => {
    const h = harness();
    h.repository.seed(seededBook("2026-09").slice(0, 3));

    await refreshWindow(h.context);

    expect(h.window).toHaveLength(3);
  });

  it("keeps the book it has when the re-read fails (9.5)", async () => {
    const h = harness();
    const before = h.window.length;
    h.repository.failNext("offline", ["read"]);

    await refreshWindow(h.context);

    expect(h.window).toHaveLength(before);
  });
});
