import { describe, expect, it } from "vitest";

import { createOpQueue } from "@/lib/expenses/op-queue";

/** A promise a test resolves when it chooses. */
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ordering within one expense (7.3)", () => {
  it("runs two tasks on the same key strictly in order", async () => {
    const queue = createOpQueue();
    const order: string[] = [];
    const first = deferred();

    const a = queue.run("e1", async () => {
      await first.promise;
      order.push("a");
    });
    const b = queue.run("e1", async () => {
      order.push("b");
    });

    // b must not have run yet: a is still in flight.
    await Promise.resolve();
    expect(order).toEqual([]);

    first.resolve();
    await Promise.all([a, b]);

    expect(order).toEqual(["a", "b"]);
  });

  it("does not serialise tasks on different keys", async () => {
    const queue = createOpQueue();
    const order: string[] = [];
    const blocked = deferred();

    const slow = queue.run("e1", async () => {
      await blocked.promise;
      order.push("slow");
    });
    await queue.run("e2", async () => {
      order.push("fast");
    });

    // e2 finished while e1 is still held: one expense never waits on another.
    expect(order).toEqual(["fast"]);

    blocked.resolve();
    await slow;
    expect(order).toEqual(["fast", "slow"]);
  });

  it("keeps running what was queued behind a task that failed (7.4)", async () => {
    const queue = createOpQueue();
    const order: string[] = [];

    const failing = queue.run("e1", async () => {
      throw new Error("write failed");
    });
    const after = queue.run("e1", async () => {
      order.push("after");
    });

    await expect(failing).rejects.toThrow("write failed");
    await after;

    // The failure is reported to its own caller and to nobody else.
    expect(order).toEqual(["after"]);
  });
});

describe("renaming a provisional id (5.3, 7.3)", () => {
  it("resolves a renamed key to the real id", () => {
    const queue = createOpQueue();
    queue.rename("local-1", "real-1");

    expect(queue.resolve("local-1")).toBe("real-1");
  });

  it("is the identity for an id that was never renamed", () => {
    expect(createOpQueue().resolve("real-1")).toBe("real-1");
  });

  it("follows a chain of renames to its end", () => {
    const queue = createOpQueue();
    queue.rename("local-1", "temp-1");
    queue.rename("temp-1", "real-1");

    expect(queue.resolve("local-1")).toBe("real-1");
  });

  it("gives a task queued under the old key the real id at execution time", async () => {
    // This is the whole point of the queue. The edit is issued while the insert
    // is still in flight, so at that moment only the provisional id exists.
    const queue = createOpQueue();
    const insert = deferred();
    const sentWith: string[] = [];

    const creating = queue.run("local-1", async () => {
      await insert.promise;
      queue.rename("local-1", "real-1");
    });

    const editing = queue.run("local-1", async () => {
      sentWith.push(queue.resolve("local-1"));
    });

    insert.resolve();
    await Promise.all([creating, editing]);

    expect(sentWith).toEqual(["real-1"]);
  });

  it("never sends a provisional id to the repository", async () => {
    const queue = createOpQueue();
    const insert = deferred();

    const creating = queue.run("local-9", async () => {
      await insert.promise;
      queue.rename("local-9", "0199a1b2-c3d4-7000-8000-000000000009");
    });
    const deleting = queue.run("local-9", async () => queue.resolve("local-9"));

    insert.resolve();
    await creating;

    await expect(deleting).resolves.not.toMatch(/^local-/);
  });
});

describe("isPending (7.1)", () => {
  it("is true while a task is in flight and false once it settles", async () => {
    const queue = createOpQueue();
    const held = deferred();

    const running = queue.run("e1", () => held.promise);
    expect(queue.isPending("e1")).toBe(true);

    held.resolve();
    await running;
    await Promise.resolve();

    expect(queue.isPending("e1")).toBe(false);
  });

  it("follows a rename", async () => {
    const queue = createOpQueue();
    const held = deferred();

    const running = queue.run("local-1", () => held.promise);
    queue.rename("local-1", "real-1");

    expect(queue.isPending("local-1")).toBe(true);
    expect(queue.isPending("real-1")).toBe(true);

    held.resolve();
    await running;
  });

  it("is false for a key nothing ever touched", () => {
    expect(createOpQueue().isPending("nobody")).toBe(false);
  });
});
