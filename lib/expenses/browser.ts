import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import { createExpenseRepository, type ExpenseRepository } from "./repository";

let repository: ExpenseRepository | null = null;

/**
 * The repository the running app writes through.
 *
 * It lives here rather than in `state/` or `components/` so that those two keep
 * their guarantee of never importing a Supabase client — the guard test in
 * `app/__tests__/no-stray-colours.test.ts` enforces exactly that. They receive
 * an `ExpenseRepository` and cannot tell a real one from the fake.
 *
 * Memoised for the same reason `createSupabaseBrowserClient` is: one client per
 * module load, not one per render.
 */
export function browserExpenseRepository(): ExpenseRepository {
  repository ??= createExpenseRepository(createSupabaseBrowserClient());
  return repository;
}
