/*
 * Requirement 7's machinery, and deliberately not React.
 *
 * A row that has just been registered has a provisional id and an insert in
 * flight. The user may edit or delete it during that instant — 7.1 says the
 * controls stay live — and the action must reach the right row and no other.
 *
 * Two rules make that safe:
 *
 *   1. Operations on the same expense run strictly in order, so a delete can
 *      never overtake the insert that created the row.
 *   2. An operation looks up its id at EXECUTION time, not when it was queued,
 *      so an edit queued behind an insert is sent with the real id the insert
 *      returned — never with the provisional one (7.3).
 */

export interface OpQueue {
  /** Appends `task` to `key`'s chain and resolves with the task's own result. */
  run<T>(key: string, task: () => Promise<T>): Promise<T>;
  /** Moves a chain onto a new key once the database supplies the real id. */
  rename(from: string, to: string): void;
  /** The real id for a provisional one, or the id itself if it is already real. */
  resolve(key: string): string;
  /** Whether anything is still in flight for `key`. */
  isPending(key: string): boolean;
}

export function createOpQueue(): OpQueue {
  /** The tail of each key's chain. Resolved chains are dropped. */
  const chains = new Map<string, Promise<unknown>>();
  /** Provisional id -> real id, once it is known. */
  const renamed = new Map<string, string>();
  const pending = new Map<string, number>();

  function resolve(key: string): string {
    // A chain of renames is followed to its end, so a key renamed twice still
    // lands on the id that actually exists.
    let current = key;
    const seen = new Set<string>();
    while (renamed.has(current) && !seen.has(current)) {
      seen.add(current);
      current = renamed.get(current)!;
    }
    return current;
  }

  return {
    resolve,

    isPending(key) {
      return (pending.get(resolve(key)) ?? 0) > 0;
    },

    rename(from, to) {
      if (from === to) return;
      renamed.set(from, to);

      // The chain moves with the name, so an operation queued under the old key
      // still runs after whatever was already in flight under it.
      const chain = chains.get(from);
      if (chain) {
        chains.set(to, chain);
        chains.delete(from);
      }

      const count = pending.get(from);
      if (count) {
        pending.set(to, (pending.get(to) ?? 0) + count);
        pending.delete(from);
      }
    },

    run<T>(key: string, task: () => Promise<T>): Promise<T> {
      const start = resolve(key);
      const previous = chains.get(start) ?? Promise.resolve();

      pending.set(start, (pending.get(start) ?? 0) + 1);

      const result = previous
        // A failed predecessor must not cancel what was queued behind it: the
        // caller of each task hears about its own failure, and only that.
        .catch(() => undefined)
        .then(() => task());

      // The chain tracks completion, not success, for the same reason.
      const chained = result.catch(() => undefined).then(() => {
        const current = resolve(key);
        const count = (pending.get(current) ?? 1) - 1;
        if (count <= 0) pending.delete(current);
        else pending.set(current, count);
      });

      chains.set(start, chained);
      return result;
    },
  };
}
