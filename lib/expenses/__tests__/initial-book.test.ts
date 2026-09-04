import { describe, expect, it } from "vitest";

import { seededBook } from "@/lib/domain/__tests__/fixtures";
import { createFakeRepository } from "@/lib/expenses/__tests__/fake-repository";
import { readInitialBook } from "@/lib/expenses/initial-book";

describe("readInitialBook (3.1, 3.2, 3.3, 3.4, 3.6)", () => {
  it("opens on the month containing the server's today (3.4)", async () => {
    const repo = createFakeRepository();
    const book = await readInitialBook(repo, "2026-09-04");

    expect(book.month).toBe("2026-09");
    expect(book.today).toBe("2026-09-04");
  });

  it("brings the viewed month and the one before it (3.3)", async () => {
    const repo = createFakeRepository(seededBook("2026-09"));
    const book = await readInitialBook(repo, "2026-09-04");

    const months = [...new Set(book.expenses.map((e) => e.date.slice(0, 7)))].sort();
    expect(months).toEqual(["2026-08", "2026-09"]);
    expect(book.expenses).toHaveLength(37);
  });

  it("reports no error on a good read", async () => {
    const book = await readInitialBook(createFakeRepository(), "2026-09-04");
    expect(book.error).toBe(false);
  });

  it("returns an empty book rather than an error when the account has nothing (3.5)", async () => {
    const book = await readInitialBook(createFakeRepository(), "2026-09-04");

    expect(book.expenses).toEqual([]);
    expect(book.error).toBe(false);
  });

  it("reports a failed read instead of an empty book (3.6)", async () => {
    // An empty book would misrepresent the month's spending as zero, which is
    // worse than saying nothing: the number would be wrong and look right.
    const repo = createFakeRepository(seededBook("2026-09"));
    repo.failNext("network down", ["read"]);

    const book = await readInitialBook(repo, "2026-09-04");

    expect(book.error).toBe(true);
    expect(book.expenses).toEqual([]);
  });

  it("never throws, so a failed read cannot take the page down with it", async () => {
    const repo = createFakeRepository();
    repo.failNext("boom", ["read"]);

    await expect(readInitialBook(repo, "2026-09-04")).resolves.toBeDefined();
  });

  it("produces only JSON-serialisable values, since it crosses to the client", async () => {
    const book = await readInitialBook(createFakeRepository(seededBook("2026-09")), "2026-09-04");

    // A Date or a Map here would fail at the Server/Client boundary at runtime,
    // in a way no type checks.
    expect(JSON.parse(JSON.stringify(book))).toEqual(book);
  });
});
