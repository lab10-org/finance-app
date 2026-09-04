import type { SupabaseClient } from "@supabase/supabase-js";

import type { ExpenseRow } from "@/lib/expenses/mapper";

/*
 * A stand-in for `SupabaseClient` that records the query the repository built
 * instead of sending it.
 *
 * The point is to assert the SHAPE of each statement — which filters, which
 * order, which columns — without a database. What the statements actually do to
 * real rows is pgTAP's job, and it is already covered there; between the two
 * there is nothing left for a mock to lie about.
 */

export interface RecordedCall {
  method: string;
  args: unknown[];
}

export interface RecordedQuery {
  table: string;
  calls: RecordedCall[];
}

export interface FakeClientOptions {
  /** Rows the next terminating call resolves with. */
  rows?: ExpenseRow[];
  /** An error the next terminating call rejects with, as PostgREST shapes it. */
  error?: { code?: string; message: string } | null;
}

export interface FakeClient {
  client: SupabaseClient;
  queries: RecordedQuery[];
  /** The last query built, which is what a single-statement test wants. */
  last(): RecordedQuery;
  /** Every method name called on the last query, in order. */
  methods(): string[];
  /** The arguments of the first call to `name` on the last query. */
  argsOf(name: string): unknown[] | undefined;
  setNext(options: FakeClientOptions): void;
}

export function createFakeClient(initial: FakeClientOptions = {}): FakeClient {
  const queries: RecordedQuery[] = [];
  let next: FakeClientOptions = { rows: [], error: null, ...initial };

  function makeBuilder(query: RecordedQuery) {
    const result = () => ({
      data: next.error ? null : (next.rows ?? []),
      error: next.error ?? null,
    });

    const singleResult = () => ({
      data: next.error ? null : ((next.rows ?? [])[0] ?? null),
      error: next.error ?? null,
    });

    const builder: Record<string, unknown> = {
      // A PostgREST builder is a thenable: awaiting it runs the query.
      then(onFulfilled: (value: unknown) => unknown) {
        return Promise.resolve(result()).then(onFulfilled);
      },
      single() {
        query.calls.push({ method: "single", args: [] });
        return Promise.resolve(singleResult());
      },
      maybeSingle() {
        query.calls.push({ method: "maybeSingle", args: [] });
        return Promise.resolve(singleResult());
      },
    };

    for (const method of [
      "select",
      "insert",
      "update",
      "delete",
      "eq",
      "gte",
      "lt",
      "lte",
      "is",
      "order",
      "limit",
    ]) {
      builder[method] = (...args: unknown[]) => {
        query.calls.push({ method, args });
        return builder;
      };
    }

    return builder;
  }

  const client = {
    from(table: string) {
      const query: RecordedQuery = { table, calls: [] };
      queries.push(query);
      return makeBuilder(query);
    },
  } as unknown as SupabaseClient;

  return {
    client,
    queries,
    last: () => queries[queries.length - 1],
    methods: () => queries[queries.length - 1].calls.map((c) => c.method),
    argsOf: (name) => queries[queries.length - 1].calls.find((c) => c.method === name)?.args,
    setNext(options) {
      next = { rows: [], error: null, ...options };
    },
  };
}
