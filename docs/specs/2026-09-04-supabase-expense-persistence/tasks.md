# Tasks — Supabase expense persistence

**Status:** Not started
**Date:** 2026-09-04
**Requirements:** ./requirements.md
**Design:** ./design.md

## Purpose

This file is two things at once: the **ordered list of work** that turns
`design.md` into working code, and the **execution log** of that work. The
checklist says what is left; the Decision log and Outcome of each task say what
actually happened and why — the reasoning behind a non-obvious choice is worth
more later than the checkmark next to it.

## How to use this document

- Work **one task at a time, top to bottom**. Do not start a task whose
  dependencies are not `[x] Done` — the TDD plan of a task assumes what came
  before it exists.
- Follow the **TDD plan** of each task in order: write the failing test first,
  then the implementation, then verify. A test written after the code only
  proves the code does what it does.
- **Append to the Decision log** any non-obvious choice, surprising finding, or
  deviation from the design, as you make it. Written later, it is reconstructed;
  written now, it is true.
- If the design turns out to be incomplete or wrong, **update `design.md`** and
  note it in the Decision log of the task that found it. Leaving a stale design
  in place is worse than having none, because it is still trusted.
- Fill in **Outcome** when closing a task, and set its Status.

## Two kinds of verification

`npm test` runs vitest, which cannot execute SQL. Tasks T2, T3 and T4 therefore
verify twice: with vitest, which reads the committed migration files as text,
and with **pgTAP through the Supabase CLI**, which runs the SQL. The CLI
commands (`supabase db reset`, `supabase test db`) are not npm scripts and are
not being invented here — they are the commands `README.md` already documents
for the local stack, and Docker must be running for them.

## Status legend

| Mark | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done and verified |
| `[!]` | Blocked — see the task's Decision log |

## Task overview

- [x] T1 — An expense carries an amount and a currency
- [x] T2 — `uuid_generate_v7()` and its bit layout
- [x] T3 — The `expenses` table, its index and its ownership rules
- [ ] T4 — The seeded book as a relative template and a trigger
- [ ] T5 — The row mapper and the unknown category
- [ ] T6 — The `ExpenseRepository` seam and the widened import guard
- [ ] T7 — The window read on the server, handed down as props
- [ ] T8 — The store keeps months, statuses and navigation
- [ ] T9 — Optimistic registration and the adoption of the real id
- [ ] T10 — Editing, deleting and undoing reach the database
- [ ] T11 — Re-reading the window and merging it with what is in flight
- [ ] T12 — What the book shows while loading, and when a write fails
- [ ] T13 — Document the migrations and run the manual pass

## Requirements coverage

| Acceptance criterion | Task(s) |
|---|---|
| 1.1 | T3, T6 |
| 1.2 | T5, T7 |
| 1.3 | T4, T5, T6 |
| 1.4 | T10 |
| 1.5 | T10 |
| 1.6 | T13 |
| 2.1 | T3 |
| 2.2 | T3, T6 |
| 2.3 | T3 |
| 2.4 | T3 |
| 2.5 | T7 |
| 2.6 | T13 |
| 3.1 | T7, T8 |
| 3.2 | T7 |
| 3.3 | T6, T7 |
| 3.4 | T7, T8 |
| 3.5 | T8 |
| 3.6 | T7, T12 |
| 4.1 | T8 |
| 4.2 | T8, T12 |
| 4.3 | T8 |
| 4.4 | T8, T12 |
| 4.5 | T8 |
| 5.1 | T9 |
| 5.2 | T9 |
| 5.3 | T9 |
| 5.4 | T9, T12 |
| 5.5 | T9, T12 |
| 5.6 | T9 |
| 5.7 | T9 |
| 5.8 | T3, T6, T9 |
| 6.1 | T10 |
| 6.2 | T10, T12 |
| 6.3 | T10 |
| 6.4 | T10 |
| 6.5 | T10 |
| 6.6 | T10 |
| 6.7 | T6, T10 |
| 6.8 | T10, T12 |
| 6.9 | T10, T12 |
| 6.10 | T3, T6 |
| 7.1 | T9 |
| 7.2 | T9 |
| 7.3 | T9 |
| 7.4 | T9 |
| 7.5 | T10, T12 |
| 8.1 | T4 |
| 8.2 | T4 |
| 8.3 | T4 |
| 8.4 | T4, T13 |
| 8.5 | T4 |
| 8.6 | T4 |
| 8.7 | T4 |
| 9.1 | T11 |
| 9.2 | T11 |
| 9.3 | T11 |
| 9.4 | T11 |
| 9.5 | T11 |
| 10.1 | T1, T3 |
| 10.2 | T1, T5 |
| 10.3 | T1 |
| 10.4 | T3, T9 |
| 10.5 | T3, T5 |
| 10.6 | T3, T5 |
| 10.7 | T3 |
| 10.8 | T2 |
| 11.1 | T3 |
| 11.2 | T5 |
| 11.3 | T5 |
| 11.4 | T5 |
| 11.5 | T5, T10 |
| 12.1 | T2, T3, T4 |
| 12.2 | T13 |
| 12.3 | T13 |
| 12.4 | T13 |

## Tasks

### T1 — An expense carries an amount and a currency

- **Status:** `[x]`
- **Traces to:** 10.1, 10.2, 10.3 — `lib/domain/types.ts`, the data models
- **Depends on:** none
- **Objective:** `Expense.amountCop` becomes `amount` plus `currency`
  throughout, with no change to what any pure function computes.

**TDD plan**

1. **Test (red):** update `lib/domain/__tests__/fixtures.ts` to build
   `{ amount, currency: "COP" }`, leaving every expected value in
   `summary-aggregates.test.ts` and `summary-breakdown.test.ts` exactly as it
   is — the point of the task is that those numbers do not move. Add to
   `lib/__tests__/format.test.ts` a case asserting `formatAmount` on an
   `Expense` renders the same string `formatCop(amount)` does. The suite goes
   red on the type change.
2. **Implement (green):** add `Currency` and `DEFAULT_CURRENCY` to
   `lib/domain/types.ts`, rename the field, drop `currency` from
   `ExpenseDraft`, and follow the compiler through `lib/domain/summary.ts`,
   `lib/format.ts` (add `formatAmount`), `lib/seed.ts`,
   `components/sheet/ExpenseSheet.tsx`, `state/book-store.tsx` (stamp
   `DEFAULT_CURRENCY` when building an expense) and every test fixture.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

- `lib/seed.ts` keeps its 37 rows as `SeedRow = Omit<Expense, "currency">` and
  stamps `DEFAULT_CURRENCY` once in a `.map`, rather than repeating
  `currency: "COP"` 37 times. It also sets up T4, where those rows become the
  template the migration renders.
- `formatAmount` takes the expense, not its number, so the day a second currency
  exists the change is in one function instead of in every view. `formatCop`
  stays exported and unchanged — it is what 9.1 and 9.2 are tested against.
- `ExpenseDraft` drops `currency` entirely (`Omit<Expense, "id" | "createdAt" |
  "currency">`). Nothing in "la hoja" offers a choice, so letting a draft carry
  one would invent a decision the interface never makes.

**Outcome**

Done and verified. `npm run typecheck` clean; `npm test` 341 passing across 40
files. No expected value in `summary-aggregates.test.ts` or
`summary-breakdown.test.ts` was touched, which is the evidence that the rename
changed the field and not the arithmetic. `grep amountCop` over the source tree
returns nothing outside `docs/specs`.

### T2 — `uuid_generate_v7()` and its bit layout

- **Status:** `[x]`
- **Traces to:** 10.8, 12.1 — `supabase/migrations/<ts>_uuid_generate_v7.sql`
- **Depends on:** none
- **Objective:** Postgres can generate a UUIDv7, and the claim that it *is* a v7
  is tested rather than assumed.

**TDD plan**

1. **Test (red):** create `supabase/tests/database/uuid_generate_v7.test.sql`
   (pgTAP): the function exists; `substring(id::text from 15 for 1) = '7'`;
   `substring(id::text from 20 for 1)` is one of `8 9 a b`; a hundred ids
   generated in a `generate_series` come back in the same order when sorted
   ascending as `uuid`. Add
   `supabase/__tests__/migrations.test.ts` under vitest asserting the migration
   folder exists and contains a file defining `public.uuid_generate_v7`. Both
   fail: the folder does not exist yet.
2. **Implement (green):** `supabase migration new uuid_generate_v7` and write
   the function from *design.md → `uuid_generate_v7()`*. Postgres 17 has no
   `uuidv7()` builtin, so this is plpgsql over `gen_random_uuid()`.
3. **Verify:** `npm run typecheck` and `npm test` for the static half;
   `supabase db reset && supabase test db` for the pgTAP half.

**Decision log**

- **The 12 bits of `rand_a` hold the sub-millisecond clock, not random data**
  (RFC 9562 §6.2, "replace leftmost random bits with increased clock
  precision"). The design warned that the copied snippets differ; they do, and
  the difference matters. Measured against the local database, the widely-copied
  variant — timestamp in the first six bytes, `set_bit(52)`/`set_bit(53)`,
  `rand_a` left random — produced **61,076 out-of-order pairs among 500 ids
  generated in one burst**, out of 124,750 possible: ordering inside a
  millisecond is a coin flip. The same measurement on this implementation gives
  **0**. Both report version `7`, so a test that only checked the version nibble
  would have passed the broken one. That is why the burst test exists.
- `clock_timestamp()` rather than `now()`: `now()` is fixed for the whole
  transaction, so a multi-row insert — the seed of T4 is exactly that — would put
  every row in the same millisecond and hand their order back to chance.
- Verified that `set_bit`'s index numbers bits from the least significant end of
  each byte, which is why the version nibble of byte 6 sits at indices 52-55. The
  implementation sets whole bytes with `set_byte` instead, which makes the layout
  legible without that footnote.
- The static vitest file asserts only what text can prove — the folder exists,
  the filenames sort, the version byte is written at all. Everything behavioural
  is pgTAP's job.

**Outcome**

Done and verified. `npm test` green on the static half. `supabase db reset`
applies the migration cleanly, and `supabase test db` reports **7/7 pgTAP
assertions passing**: the function exists, the version nibble is `7`, the variant
bits are `10xx`, the leading 48 bits are the current unix time in milliseconds,
12 ids generated 2 ms apart sort in generation order, 500 ids generated in a
tight burst also sort in generation order, and all 500 are distinct.

### T3 — The `expenses` table, its index and its ownership rules

- **Status:** `[x]`
- **Traces to:** 1.1, 2.1, 2.2, 2.3, 2.4, 5.8, 6.10, 10.1, 10.4, 10.5, 10.6,
  10.7, 11.1, 12.1 — `supabase/migrations/<ts>_expenses.sql`
- **Depends on:** T2
- **Objective:** an expense has a place to live that only its owner can reach.

**TDD plan**

1. **Test (red):** `supabase/tests/database/expenses_rls.test.sql` — with two
   accounts created through `auth.users` and `set local role authenticated` plus
   a claims override: each sees only its own rows; an update or delete against
   the other's row affects zero rows; an insert with a forged `user_id` is
   rejected; an insert omitting `user_id` gets `auth.uid()`. A second file
   `expenses_constraints.test.sql` — `amount = 0` and `amount < 0` rejected,
   `description = '  '` rejected, `description = null` accepted,
   `category_id = 'cripto'` accepted, an update moves `updated_at` and leaves
   `created_at` alone, `date` round-trips as `YYYY-MM-DD`. Extend the vitest
   migration test to assert the committed SQL enables RLS, declares four
   policies using the `(select auth.uid())` form, creates the partial index, and
   contains no `check` on `category_id`.
2. **Implement (green):** `supabase migration new expenses` with the DDL from
   *design.md → `supabase/migrations/<ts>_expenses.sql`*, including the
   `set_updated_at` trigger.
3. **Verify:** `npm run typecheck` and `npm test`; `supabase db reset && supabase test db`.

**Decision log**

- **The design was missing a `grant`, and only running the SQL revealed it.**
  Enabling RLS and writing four correct policies is not enough: a table created
  by a migration carries no privileges for the API roles, so every request from
  the app failed with `permission denied for table expenses` — an error that
  looks nothing like a policy problem and would have surfaced as a broken app,
  not a broken test. Added
  `grant select, insert, update, delete on public.expenses to authenticated`,
  and a pgTAP assertion for it. `anon` is granted nothing, which is 2.5 stated
  where it cannot be forgotten. `design.md` updated.
- **`created_at` and `updated_at` default to `clock_timestamp()`, not `now()`.**
  Two failures forced this. First, `now()` is the transaction's start time, so
  the `set_updated_at` trigger wrote back the same instant `created_at` already
  held and 10.7 could not be observed. Second, and worse: a multi-row insert
  would give every row an identical `created_at`, and the order of expenses
  within a day derives from it (1.3) — the 37-row seed of T4 is exactly such an
  insert, so its rows would have had no defined order. A test now pins that
  three rows written by one statement get three distinct `created_at` values.
- The static vitest test asserts `(select auth.uid())` is used and a bare
  `= auth.uid()` is not. The bare form is re-evaluated once per row; on a month
  of expenses that is the difference between one call and a few hundred.

**Outcome**

Done and verified. `npm run typecheck` clean, `npm test` 353 passing across 41
files, and `supabase test db` reports **32/32 pgTAP assertions passing** over
three files. Ownership is covered end to end: each account reads only its own
rows, cross-account updates and deletes affect zero rows, an insert bearing
another account's `user_id` is rejected with `42501`, and a soft-deleted row
survives and stays readable to its owner. Constraints are covered too, including
that `0.1 + 0.2` sums to exactly `0.3` — the evidence that `numeric` is doing
what `float` could not.

### T4 — The seeded book as a relative template and a trigger

- **Status:** `[ ]`
- **Traces to:** 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 12.1 — `lib/seed.ts`,
  `supabase/migrations/<ts>_seed_new_account.sql`
- **Depends on:** T1, T3
- **Objective:** a brand-new account opens on a month that already has data, and
  a failed seed can never cost anyone their sign-in.

**TDD plan**

1. **Test (red):** rewrite `lib/__tests__/seed.test.ts` against `SEED_TEMPLATE`:
   thirty-seven rows, offsets only `0` and `-1`, the previous month totalling
   `1_412_300`, the eight creation-month rows in the mockup's order, `sequence`
   unique and ascending within a day, every amount a positive integer. Add a
   test asserting `renderSeedValues()` appears verbatim inside the committed
   seed migration. Add `supabase/tests/database/seed_new_account.test.sql`:
   inserting a user yields 37 rows over exactly two months; an account created
   on a 31st-less month still gets valid dates (create one with
   `created_at = '2026-03-15'` and assert no row has a null or out-of-range
   date); a second insert for the same user id is impossible, and re-running the
   sign-in path adds nothing; a user inserted while the seed is forced to fail
   still exists; a user row that predates the migration has no expenses.
2. **Implement (green):** convert `lib/seed.ts` to `SEED_TEMPLATE` +
   `renderSeedValues`, delete `SEED_EXPENSES` and `SEED_MONTH`, then
   `supabase migration new seed_new_account` with the function and trigger from
   *design.md*, embedding the rendered `values` list and the day clamp.
   `state/book-store.tsx` stops importing the seed — `createInitialState` takes
   an empty book for now; T7 gives it the real one.
3. **Verify:** `npm run typecheck` and `npm test`; `supabase db reset && supabase test db`.

**Decision log**

**Outcome**

### T5 — The row mapper and the unknown category

- **Status:** `[ ]`
- **Traces to:** 1.2, 1.3, 10.2, 10.5, 10.6, 11.2, 11.3, 11.4 —
  `lib/expenses/mapper.ts`
- **Depends on:** T1
- **Objective:** a database row becomes a domain `Expense`, and back, with
  nothing lost and no timezone introduced.

**TDD plan**

1. **Test (red):** `lib/expenses/__tests__/mapper.test.ts` — `rowToExpense`
   maps `description: null` to an absent key, `amount: "132400.00"` and
   `amount: 132400` both to `132400`, `created_at` to epoch ms, and `date`
   through untouched as the same string; `draftToInsert` maps an absent or
   blank description to `null`, stamps `currency: "COP"`, and never emits a
   `user_id`; `normalizeCategory` returns the five known ids and `"otros"` for
   `"cripto"`; a row with an unknown category still carries its amount.
2. **Implement (green):** write `lib/expenses/mapper.ts`. No Supabase import —
   the module is pure, which is what keeps it out of every guard's way.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T6 — The `ExpenseRepository` seam and the widened import guard

- **Status:** `[ ]`
- **Traces to:** 1.1, 1.3, 2.2, 3.3, 5.8, 6.7, 6.10 — `lib/expenses/repository.ts`,
  `app/__tests__/no-stray-colours.test.ts`
- **Depends on:** T3, T5
- **Objective:** every statement this feature sends lives behind one interface a
  test can implement.

**TDD plan**

1. **Test (red):** `lib/expenses/__tests__/repository.test.ts` against a fake
   `SupabaseClient` recording the query it was built: `readWindow("2026-09")`
   spans `2026-08-01` to `2026-09-30`, filters `deleted_at is null`, orders by
   `date desc, created_at desc`, and names no `user_id`; `create` sends the
   insert and returns the mapped row from `.select().single()`; `softDelete`
   and `restore` issue updates of `deleted_at` and never a `DELETE`; `create`
   called twice with the same `clientOpId` inserts once and returns the same
   row, and called twice with different ones for an identical draft returns two
   distinct rows (5.8). Update
   `app/__tests__/no-stray-colours.test.ts` first, so it fails for the right
   reason: add `lib/expenses` and `app/page.tsx` to the whitelist and delete the
   "persists no expense in the browser" clause, whose subject this feature
   removes.
2. **Implement (green):** write `lib/expenses/repository.ts` with
   `createExpenseRepository(client)`, plus
   `lib/expenses/__tests__/fake-repository.ts` — an in-memory implementation
   with controllable latency and failure, used by every later task.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T7 — The window read on the server, handed down as props

- **Status:** `[ ]`
- **Traces to:** 1.2, 2.5, 3.1, 3.2, 3.3, 3.4, 3.6 — `app/page.tsx`,
  `components/book/BookMount.tsx`, `components/book/BookApp.tsx`, `InitialBook`
- **Depends on:** T6
- **Objective:** the book arrives with its two months already in it.

**TDD plan**

1. **Test (red):** `app/__tests__/initial-book.test.ts` — a `loadInitialBook`
   helper built over an injected repository returns `{ month, today, expenses,
   error: false }` for the current month and the one before, and
   `{ ..., expenses: [], error: true }` when the repository rejects, without
   throwing. Add to `components/__tests__/book-app.test.tsx` a render with an
   `InitialBook` of two months asserting the total, the average, the top
   category, the breakdown and the "comparativo" are all correct on the first
   rendered output — and that `InitialBook` survives `JSON.parse(JSON.stringify())`
   unchanged, which is the boundary it has to cross.
2. **Implement (green):** add `loadInitialBook` beside the page, call it in
   `app/page.tsx` after `requireSessionUser()` using
   `createSupabaseServerClient()`, thread `initialBook` through `BookMount` into
   `BookApp` and into `BookProvider`. Mount the `RepositoryProvider` in
   `BookApp` over `createExpenseRepository(createSupabaseBrowserClient())`.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T8 — The store keeps months, statuses and navigation

- **Status:** `[ ]`
- **Traces to:** 3.1, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5 —
  `state/book-store.tsx`, `state/book-actions.ts`, `windowExpenses`
- **Depends on:** T7
- **Objective:** the book can be looking at a month it has not read yet, and
  says so.

**TDD plan**

1. **Test (red):** extend `state/__tests__/book-store.test.ts` — `months` starts
   from `InitialBook` with two `loaded` slices; `setMonth` into an unread month
   marks it and its predecessor `loading` and leaves the previous month's slices
   intact; `monthLoaded` fills them; `monthFailed` marks them `error` and keeps
   the old data; returning to a `loaded` month dispatches no load; `setMonth`
   past the month containing today is still refused; `windowStatus` is
   `loading` when either month of the window is; `windowExpenses` concatenates
   the two slices; a `loaded` empty month is the empty state, not a spinner. Add
   a `book-actions` test with the fake repository asserting `goToMonth` reads
   once per unread month and offers a retry after a failure.
2. **Implement (green):** rewrite `BookState`, `bookReducer` and the provider
   per *design.md → `state/book-store.tsx`*; add `state/book-actions.ts` with
   `goToMonth` and the client/server `today` reconciliation on mount; point
   `BookScreen` at `windowExpenses(state, viewedMonth)`.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T9 — Optimistic registration and the adoption of the real id

- **Status:** `[ ]`
- **Traces to:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.1, 7.2, 7.3, 7.4,
  10.4 —
  `lib/expenses/op-queue.ts`, `state/book-actions.ts`, `bookReducer`
- **Depends on:** T8
- **Objective:** confirming the sheet is instantaneous, and the row quietly
  becomes a real one.

**TDD plan**

1. **Test (red):** `lib/expenses/__tests__/op-queue.test.ts` — two tasks under
   one key run in order, `rename` mid-flight moves the chain, `resolve` returns
   the real id for a provisional one and is the identity for a real one.
   `state/__tests__/register-optimistic.test.tsx` with the fake repository — a
   never-resolving `create` still closes the sheet, shows the row and moves the
   month; the header includes it; the row is editable and deletable while
   pending, with the same controls; `adoptId` swaps the id without the row
   changing position or value; a queued edit runs against the adopted id and
   against no other row; a rejecting `create` removes the row, records the
   failure with its draft, and `retryFailure` re-sends the op carrying the same
   `clientOpId`, so a write that had actually landed is adopted rather than
   inserted a second time.
2. **Implement (green):** write `lib/expenses/op-queue.ts`; add `register`,
   `retryFailure` and `dismissFailure` to `state/book-actions.ts`; add the
   `register` / `adoptId` / `opSettled` / `opFailed` cases to the reducer.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T10 — Editing, deleting and undoing reach the database

- **Status:** `[ ]`
- **Traces to:** 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.5 —
  `state/book-actions.ts`, `ExpenseRepository.softDelete` / `restore`
- **Depends on:** T9
- **Objective:** a correction and a deletion stick, and undo is a restore rather
  than a cancellation.

**TDD plan**

1. **Test (red):** extend `state/__tests__/delete-undo.test.tsx` with the fake
   repository — an edit shows at once and sends one update; a rejected update
   puts the previous values back and records a retryable failure; a deletion
   sends `softDelete` **immediately**, not on the timer, and the expense is
   gone from every list and total; letting the window expire sends nothing more;
   undo restores the expense to its exact position and sends `restore`; a
   rejected `softDelete` returns the expense to the book with a message; a
   queued action whose create failed is dropped with a message rather than
   silently, and the book shows what is stored.
2. **Implement (green):** add `edit`, `remove` and `undoDelete` to
   `state/book-actions.ts`, routed through the op queue, and the matching
   reducer cases.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T11 — Re-reading the window and merging it with what is in flight

- **Status:** `[ ]`
- **Traces to:** 9.1, 9.2, 9.3, 9.4, 9.5 — `reconcile`,
  `state/book-actions.ts#refresh`
- **Depends on:** T10
- **Objective:** a tab left open catches up without eating the change the user
  just made in it.

**TDD plan**

1. **Test (red):** a reducer test for `reconcile` — server rows replace a
   slice; a provisional row with a pending `create` survives; a row deleted
   locally but not yet settled stays out; a row edited locally but not yet
   settled keeps its local values; everything else takes the server's values and
   the header follows. A component test firing `visibilitychange` with
   `visibilityState: "visible"` asserting exactly one re-read, none when hidden,
   and that a rejecting re-read leaves the book exactly as it was.
2. **Implement (green):** add the `reconcile` case and `refresh()`, with the
   `visibilitychange` listener in `BookProvider`.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T12 — What the book shows while loading, and when a write fails

- **Status:** `[ ]`
- **Traces to:** 3.6, 4.2, 4.4, 5.4, 5.5, 6.2, 6.8, 6.9, 7.5 —
  `components/book/BookStatus.tsx`, `BookScreen`
- **Depends on:** T11
- **Objective:** every failure this feature can produce has a Spanish sentence
  and a way out, at 390px, in the existing tokens.

**TDD plan**

1. **Test (red):** `components/__tests__/book-status.test.tsx` — while a month
   loads, the book says so and shows no total presented as final; when a month
   fails, the message names the month and "Reintentar" calls back; when a write
   fails, the toast carries its message and both "Reintentar" and a dismissal;
   the initial-error `InitialBook` renders the retry rather than an empty book
   reading `$0`. The existing `app/__tests__/no-stray-colours.test.ts` and
   `app/__tests__/tokens.test.ts` must stay green — no new colour.
2. **Implement (green):** write `components/book/BookStatus.tsx` and its CSS
   module from the existing tokens, and wire it into `BookScreen`.
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T13 — Document the migrations and run the manual pass

- **Status:** `[ ]`
- **Traces to:** 1.6, 2.6, 8.4, 12.2, 12.3, 12.4 — `README.md`
- **Depends on:** T12
- **Objective:** a fresh clone reproduces the database with no dashboard step,
  and the criteria that only a browser can show are actually seen.

**TDD plan**

1. **Test (red):** extend `app/__tests__/readme.test.ts` with the strings the
   new section must keep naming: `supabase migration new`, `supabase test db`,
   `supabase/migrations`, `supabase db reset`.
2. **Implement (green):** add a "Migraciones" section to `README.md` — how to
   apply them locally, how to run the pgTAP tests, and the fact that no change
   is ever made in the dashboard. Then run the pass and record it in the
   Outcome: `supabase db reset` from clean; sign in with a new email and confirm
   the seeded book opens on the current month with a "comparativo"; edit,
   filter and delete a seeded expense; register, reload, confirm it survived;
   edit and reload; delete, let the window expire, reload; delete and reload
   *during* the window; sign out and back in; sign in with a second email and
   confirm nothing of the first account is visible.
3. **Verify:** `npm run typecheck` and `npm test`; `supabase db reset` and the
   manual pass above.

**Decision log**

**Outcome**

## Open items

None yet. Filled during execution.
