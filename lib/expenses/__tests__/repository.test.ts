import { describe, expect, it } from "vitest";

import { createFakeClient } from "@/lib/expenses/__tests__/fake-client";
import type { ExpenseRow } from "@/lib/expenses/mapper";
import { createExpenseRepository } from "@/lib/expenses/repository";

const row = (over: Partial<ExpenseRow> = {}): ExpenseRow => ({
  id: "0199a1b2-c3d4-7000-8000-000000000001",
  amount: 48500,
  currency: "COP",
  category_id: "mercado",
  description: "Éxito Poblado",
  date: "2026-09-03",
  created_at: "2026-09-03T14:22:31.500Z",
  ...over,
});

const draft = { amount: 48_500, categoryId: "mercado" as const, date: "2026-09-03" };

describe("readWindow (3.3, 4.1)", () => {
  it("spans the viewed month and the one before it", () => {
    const fake = createFakeClient();
    void createExpenseRepository(fake.client).readWindow("2026-09");

    // Half-open: from the first day of August up to, but excluding, the first
    // day of October. No "last day of the month" arithmetic to get wrong.
    expect(fake.argsOf("gte")).toEqual(["date", "2026-08-01"]);
    expect(fake.argsOf("lt")).toEqual(["date", "2026-10-01"]);
  });

  it("crosses a year boundary correctly", () => {
    const fake = createFakeClient();
    void createExpenseRepository(fake.client).readWindow("2026-01");

    expect(fake.argsOf("gte")).toEqual(["date", "2025-12-01"]);
    expect(fake.argsOf("lt")).toEqual(["date", "2026-02-01"]);
  });

  it("excludes soft-deleted rows (6.7)", () => {
    const fake = createFakeClient();
    void createExpenseRepository(fake.client).readWindow("2026-09");

    expect(fake.argsOf("is")).toEqual(["deleted_at", null]);
  });

  it("orders by date then created_at, both descending (1.2, 1.3)", () => {
    const fake = createFakeClient();
    void createExpenseRepository(fake.client).readWindow("2026-09");

    const orders = fake.last().calls.filter((c) => c.method === "order");
    expect(orders.map((c) => c.args)).toEqual([
      ["date", { ascending: false }],
      ["created_at", { ascending: false }],
    ]);
  });

  it("names no user_id — RLS owns that rule (2.2, 2.4)", () => {
    const fake = createFakeClient();
    void createExpenseRepository(fake.client).readWindow("2026-09");

    const mentionsUser = JSON.stringify(fake.last().calls).includes("user_id");
    expect(mentionsUser).toBe(false);
  });

  it("maps the rows it reads", async () => {
    const fake = createFakeClient({ rows: [row()] });
    const expenses = await createExpenseRepository(fake.client).readWindow("2026-09");

    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount).toBe(48500);
    expect(expenses[0].categoryId).toBe("mercado");
  });

  it("throws when the read fails, so the caller can say so (3.6)", async () => {
    const fake = createFakeClient({ error: { message: "network down" } });

    await expect(
      createExpenseRepository(fake.client).readWindow("2026-09"),
    ).rejects.toThrow(/network down/);
  });
});

describe("create (5.7, 5.8)", () => {
  it("sends the draft with the client's idempotency key", async () => {
    const fake = createFakeClient({ rows: [row()] });
    await createExpenseRepository(fake.client).create(draft, "key-1");

    const [payload] = fake.argsOf("insert") as [Record<string, unknown>];
    expect(payload).toEqual({
      amount: 48_500,
      currency: "COP",
      category_id: "mercado",
      description: null,
      date: "2026-09-03",
      client_op_id: "key-1",
    });
  });

  it("returns the row the database assigned, ids and all (5.3)", async () => {
    const fake = createFakeClient({ rows: [row({ id: "real-id" })] });
    const created = await createExpenseRepository(fake.client).create(draft, "key-1");

    expect(created.id).toBe("real-id");
  });

  it("adopts the existing row when the key was already used (5.7)", async () => {
    // The write landed but its response was lost; the retry collides with the
    // unique index and must read that row rather than insert a second one.
    const fake = createFakeClient({ error: { code: "23505", message: "duplicate key" } });
    const repo = createExpenseRepository(fake.client);

    const pending = repo.create(draft, "key-1");
    fake.setNext({ rows: [row({ id: "the-one-that-landed" })] });

    await expect(pending).resolves.toMatchObject({ id: "the-one-that-landed" });
    expect(fake.queries).toHaveLength(2);
    expect(fake.argsOf("eq")).toEqual(["client_op_id", "key-1"]);
  });

  it("rethrows any other failure (5.4)", async () => {
    const fake = createFakeClient({ error: { code: "23514", message: "amount must be positive" } });

    await expect(
      createExpenseRepository(fake.client).create(draft, "key-1"),
    ).rejects.toThrow(/amount must be positive/);
  });
});

describe("update (1.4, 6.1)", () => {
  it("writes the draft against the id and returns the stored row", async () => {
    const fake = createFakeClient({ rows: [row({ amount: 60_000 })] });
    const updated = await createExpenseRepository(fake.client).update("real-id", {
      ...draft,
      amount: 60_000,
    });

    expect(fake.methods()).toContain("update");
    expect(fake.argsOf("eq")).toEqual(["id", "real-id"]);
    expect(updated.amount).toBe(60_000);
  });

  it("does not touch client_op_id on an update", async () => {
    const fake = createFakeClient({ rows: [row()] });
    await createExpenseRepository(fake.client).update("real-id", draft);

    const [payload] = fake.argsOf("update") as [Record<string, unknown>];
    expect("client_op_id" in payload).toBe(false);
  });
});

describe("softDelete and restore (6.4, 6.5, 6.10)", () => {
  it("marks the row deleted instead of removing it (6.10)", async () => {
    const fake = createFakeClient({ rows: [row()] });
    await createExpenseRepository(fake.client).softDelete("real-id");

    expect(fake.methods()).toContain("update");
    expect(fake.methods()).not.toContain("delete");

    const [payload] = fake.argsOf("update") as [Record<string, unknown>];
    expect(payload.deleted_at).toEqual(expect.any(String));
    expect(fake.argsOf("eq")).toEqual(["id", "real-id"]);
  });

  it("clears the mark to undo it (6.5)", async () => {
    const fake = createFakeClient({ rows: [row()] });
    await createExpenseRepository(fake.client).restore("real-id");

    const [payload] = fake.argsOf("update") as [Record<string, unknown>];
    expect(payload).toEqual({ deleted_at: null });
  });

  it("issues no DELETE anywhere in the repository (6.10)", async () => {
    const fake = createFakeClient({ rows: [row()] });
    const repo = createExpenseRepository(fake.client);

    await repo.softDelete("a");
    await repo.restore("a");

    const everyMethod = fake.queries.flatMap((q) => q.calls.map((c) => c.method));
    expect(everyMethod).not.toContain("delete");
  });

  it("reports a failed deletion so the book can put the row back (6.8)", async () => {
    const fake = createFakeClient({ error: { message: "offline" } });

    await expect(createExpenseRepository(fake.client).softDelete("a")).rejects.toThrow(/offline/);
  });
});
