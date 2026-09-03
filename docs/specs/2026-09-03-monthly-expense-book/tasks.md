# Tasks — Monthly Expense Book (v1 prototype)

**Status:** Done
**Date:** 2026-09-03
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

## Status legend

| Mark | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done and verified |
| `[!]` | Blocked — see the task's Decision log |

## Task overview

- [x] T1 — Project scaffold and test toolchain
- [x] T2 — Design tokens, fonts and the 390px shell
- [x] T3 — Domain types, the category table and date helpers
- [x] T4 — Peso, percentage and Spanish date formatting
- [x] T5 — Month aggregates: total, daily average, comparison
- [x] T6 — Category breakdown, top category and day grouping
- [x] T7 — Seed data for July, August and September 2026
- [x] T8 — Store: month, filter, sheet, register and edit
- [x] T9 — Store: delete, undo and the 5-second finalisation
- [x] T10 — Month header and total with the comparison line
- [x] T11 — Category breakdown bar and legend
- [x] T12 — Summary row of three metrics
- [x] T13 — Category filter chips
- [x] T14 — The book: jornadas, rows, footer and the register button
- [x] T15 — Empty month
- [x] T16 — The sheet in registration mode
- [x] T17 — The sheet in edit mode, with Eliminar
- [x] T18 — Undo notice
- [x] T19 — Installable manifest and icons
- [x] T20 — Visual pass against the mockup at 390px

## Requirements coverage

| Acceptance criterion | Task(s) |
|---|---|
| 1.1 | T8 |
| 1.2 | T6, T14 |
| 1.3 | T6, T14 |
| 1.4 | T4, T14 |
| 1.5 | T6, T14 |
| 1.6 | T14 |
| 1.7 | T14 |
| 1.8 | T14 |
| 1.9 | T4, T14 |
| 1.10 | T14, T20 |
| 2.1 | T5, T10 |
| 2.2 | T4, T12 |
| 2.3 | T3, T5, T12 |
| 2.4 | T6, T12 |
| 2.5 | T5, T10 |
| 2.6 | T6, T11 |
| 2.7 | T4, T6, T11 |
| 2.8 | T6, T11 |
| 2.9 | T5, T6, T12 |
| 2.10 | T6, T11 |
| 2.11 | T5, T10 |
| 2.12 | T3, T6 |
| 2.13 | T8, T9, T16 |
| 3.1 | T15 |
| 3.2 | T15 |
| 3.3 | T15 |
| 3.4 | T4, T15 |
| 3.5 | T15, T16 |
| 3.6 | T15, T18 |
| 4.1 | T16 |
| 4.2 | T16 |
| 4.3 | T3, T16 |
| 4.4 | T16 |
| 4.5 | T16 |
| 4.6 | T8, T16 |
| 4.7 | T16 |
| 4.8 | T16 |
| 4.9 | T16 |
| 4.10 | T4, T16 |
| 5.1 | T14, T17 |
| 5.2 | T17 |
| 5.3 | T8, T17 |
| 5.4 | T8, T17 |
| 5.5 | T6, T17 |
| 5.6 | T17 |
| 6.1 | T9, T17, T18 |
| 6.2 | T18 |
| 6.3 | T9, T18 |
| 6.4 | T9, T18 |
| 6.5 | T9 |
| 6.6 | T9, T18 |
| 7.1 | T13 |
| 7.2 | T13 |
| 7.3 | T13 |
| 7.4 | T6, T13 |
| 7.5 | T13 |
| 7.6 | T8, T13 |
| 7.7 | T9 |
| 8.1 | T8, T10 |
| 8.2 | T8, T10 |
| 8.3 | T4, T10 |
| 8.4 | T8, T10 |
| 8.5 | T15 |
| 8.6 | T8, T10 |
| 8.7 | T10 |
| 9.1 | T4 |
| 9.2 | T4 |
| 9.3 | T4 |
| 9.4 | T4 |
| 9.5 | T4, T16 |
| 9.6 | T4, T16 |
| 10.1 | T7 |
| 10.2 | T7 |
| 10.3 | T8 |
| 10.4 | T8 |
| 10.5 | T8, T20 |
| 11.1 | T2, T20 |
| 11.2 | T19 |
| 11.3 | T2, T20 |
| 11.4 | T2, T20 |

## Tasks

### T1 — Project scaffold and test toolchain

- **Status:** `[x]`
- **Traces to:** no criterion directly — it is what lets every later task run
- **Depends on:** none
- **Objective:** A Next.js App Router project in TypeScript where
  `npm run typecheck` and `npm test` both run and pass.

**TDD plan**

1. **Test (red):** `lib/domain/__tests__/toolchain.test.ts` imports a constant
   through the `@/` path alias and asserts its value. It fails because neither
   the alias nor the module exists.
2. **Implement (green):** scaffold Next.js (App Router, TypeScript, **no
   Tailwind**, `src/`-less layout); add Vitest with the jsdom environment,
   `@testing-library/react` and `@testing-library/jest-dom`; wire the `@/` alias
   in both `tsconfig.json` and the Vitest config; add the `dev`, `build`,
   `typecheck` and `test` scripts.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — Scaffolded by hand instead of `create-next-app`, so the dependency set is exactly what the design asks for and nothing else (no Tailwind, no ESLint preset we would then have to fight).
- `2026-09-03` — npm resolved Next 16, React 19.2, TypeScript 7, Vitest 5 and lucide-react 1.40 — all newer than the versions the design was written against. Nothing in the design depends on a version-specific API, so they were kept.
- `2026-09-03` — `"type": "module"` added to package.json to silence Vite's CommonJS-loading warning on `vitest.config.ts`.
**Outcome**

### T2 — Design tokens, fonts and the 390px shell

- **Status:** `[x]`
- **Traces to:** 11.1, 11.3, 11.4 — `app/globals.css`, `app/layout.tsx`,
  `app/page.tsx`
- **Depends on:** T1
- **Objective:** Every `.pen` token exists once as a CSS custom property, the
  two typefaces load, and the page is a 390px column centred on wider screens.

**TDD plan**

1. **Test (red):** a test reads `app/globals.css`, and asserts that all 18
   tokens from the `.pen` variable table are declared with exactly the documented
   values, and that no other hex literal appears in the file.
2. **Implement (green):** write the token block in `globals.css`; load `Inter`
   and `IBM Plex Mono` with `next/font/google` and expose them as
   `--font-ui` / `--font-num`; make `layout.tsx` paint `--bg`; make `page.tsx` a
   static shell that renders `BookScreen` through
   `dynamic(..., { ssr: false })`, inside a `max-width: 390px` centred column.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — `import.meta.url` is not a `file:` URL under the jsdom environment, so the stylesheet-reading tests resolve paths from `process.cwd()` instead. The assertion is unchanged; only how the file is located.
- `2026-09-03` — `page.tsx` carries `"use client"`. `next/dynamic` with `ssr: false` is rejected inside a Server Component in the App Router, and the design's whole point is that the book must not be server-rendered. The shell markup still renders on the server, so there is no white flash.
- `2026-09-03` — The two font families are loaded with `next/font/google` as `--font-inter` / `--font-plex-mono`, and `--font-ui` / `--font-num` reference them with real fallback stacks. Verified `npm run build` fetches both.
**Outcome**

### T3 — Domain types, the category table and date helpers

- **Status:** `[x]`
- **Traces to:** 2.3, 2.12, 4.3 — `lib/domain/types.ts`,
  `lib/domain/categories.ts`, `lib/domain/dates.ts`
- **Depends on:** T1
- **Objective:** The vocabulary of the domain exists: the five categories in
  their fixed order, and date helpers that never touch `Date` parsing.

**TDD plan**

1. **Test (red):** assert the category list has exactly five entries in the
   order `mercado, restaurantes, transporte, suscripciones, otros`, each with
   its Spanish label, lucide glyph and colour token; assert `elapsedDays`
   returns today's day-of-month for the current month, the full length for a
   past month, and 28 for February 2026.
2. **Implement (green):** the `Expense` / `ExpenseDraft` / `Category` types, the
   frozen category table, and `monthKeyOf`, `daysInMonth`, `elapsedDays`,
   `addMonths`, `previousMonth` operating on `YYYY-MM-DD` / `YYYY-MM` strings.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — `glyph` stays a plain lucide *name* string rather than an icon component, so `lib/domain/` pulls in no React and stays testable without a DOM.
- `2026-09-03` — `daysInMonth` is the one place a `Date` is constructed, and only via `Date.UTC(year, month, 0)` to read the length of a month. No expense date is ever parsed.
**Outcome**

### T4 — Peso, percentage and Spanish date formatting

- **Status:** `[x]`
- **Traces to:** 1.4, 1.9, 2.2, 2.7, 3.4, 4.10, 8.3, 9.1–9.6 — `lib/format.ts`
- **Depends on:** T3
- **Objective:** Every user-visible string derived from a number or a date is
  produced by one tested function.

**TDD plan**

1. **Test (red):** `formatCop(0) === "$0"`, `formatCop(1284500) === "$1.284.500"`;
   `formatPercent(9.04) === "9,0%"`; `formatSharePercent(0.384) === "38%"`;
   `formatDayStrip` for today, yesterday and an older date;
   `formatMonthTitle/Upper/Lower`; `parseAmountInput` stripping non-digits,
   refusing decimals and capping at 999999999.
2. **Implement (green):** the functions, with a Spanish month-name table rather
   than a locale lookup, so the output cannot vary with the runtime's ICU data.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — 9.6 is implemented by slicing the typed digits to nine, not by returning a previous value — 'ignore further digits' is literally what slicing does, and it keeps `parseAmountInput(raw)` single-argument. `design.md`'s error table was corrected to match.
- `2026-09-03` — Month names are a hardcoded Spanish table, not `Intl`. A locale lookup would make the output depend on the runtime's ICU data, and these strings are UI copy.
- `2026-09-03` — Added `previousDay` to `dates.ts`, which `formatDayStrip` needs to recognise 'AYER' across a month boundary.
- `2026-09-03` — Added `formatMonthNameUpper` ("SEPTIEMBRE") for the closing row of 1.9, and `formatAmountInput` for what the amount field displays while typing.
**Outcome**

### T5 — Month aggregates: total, daily average, comparison

- **Status:** `[x]`
- **Traces to:** 2.1, 2.3, 2.5, 2.9, 2.11 — `lib/domain/summary.ts`
- **Depends on:** T3
- **Objective:** The three header figures that describe the month as a whole are
  computed by pure functions.

**TDD plan**

1. **Test (red):** `monthTotal` over a fixture spanning two months;
   `dailyAverage` returning `{amount, days}` for a populated month and `null`
   for an empty one; `monthComparison` in the `"less"` and `"more"` directions,
   and `null` when either month is empty.
2. **Implement (green):** the three functions, each taking `today` as an
   argument rather than reading the clock.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — Dropped the unused `today` parameter from `monthComparison` — the comparison is between two whole months and never needs the current date. `design.md`'s signature was updated.
- `2026-09-03` — `dailyAverage` returns `null` when the month is empty *or* when no day of it has elapsed, so the future-month case cannot divide by zero.
**Outcome**

### T6 — Category breakdown, top category and day grouping

- **Status:** `[x]`
- **Traces to:** 1.2, 1.3, 1.5, 2.4, 2.6, 2.7, 2.8, 2.9, 2.10, 2.12, 5.5, 7.4 —
  `lib/domain/summary.ts`
- **Depends on:** T5
- **Objective:** The month becomes a list of "jornadas" and a set of category
  shares, with the filter applied at exactly one place.

**TDD plan**

1. **Test (red):** `categoryBreakdown` ordered by share descending, omitting
   absent categories, returning `[]` for an empty month; `topCategory`
   returning `null` for an empty month and breaking a tie by fixed category
   order; `groupByDay` ordering days descending and expenses within a day by
   `createdAt` descending, and honouring the category filter.
2. **Implement (green):** the three functions. Only `groupByDay` accepts the
   filter argument — that is criteria 7.4 / 7.5 expressed in the signatures.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — `categoryBreakdown` is the single source for `topCategory` — the top category is just the first slice, so the tie-break by fixed category order is written once.
**Outcome**

### T7 — Seed data for July, August and September 2026

- **Status:** `[x]`
- **Traces to:** 10.1, 10.2 — `lib/seed.ts`
- **Depends on:** T5, T6
- **Objective:** A realistic starting month that reproduces the mockup, plus an
  empty month that makes the empty state reachable without deleting anything.

**TDD plan**

1. **Test (red):** the seed contains expenses only in `2026-07`, `2026-08` and
   `2026-09`; `2026-07` is empty; `monthTotal` of `2026-08` is exactly
   `1412300`, the figure the mockup shows under `"MES ANTERIOR"`; `2026-09`
   contains the mockup's rows — `"Éxito Poblado"` 48500, `"Uber a la oficina"`
   12000, `"Café Velvet"` 18900, `"Netflix"` 26900, `"Crepes & Waffles"` 42300,
   `"Recarga Cívica"` 20000, `"La Mayorista"` 63400, `"Spotify Premium"` 16900.
2. **Implement (green):** the seed, dating the September rows relative to
   2026-09-03 so they fall on `"HOY"`, `"AYER"` and `"1 DE SEPTIEMBRE"` as the
   mockup shows, and padding August to reach its total.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — The mockup's September total of $1.284.500 cannot coexist with its own rows: the three drawn jornadas sum to $248.900, and with today at 2026-09-03 the month can only hold three days. The seed reproduces the eight drawn rows exactly and lets the total be what they actually add up to. The mockup's $1.284.500 and '27 días' are illustrative of a late-September day.
- `2026-09-03` — August reproduces the mockup's '$1.412.300' exactly, across 29 rows, because that figure is what September's 'MES ANTERIOR' and the comparison line are read against.
- `2026-09-03` — One August row is seeded with no description, so the 1.8 fallback has a real case in the running app and not only in tests.
- `2026-09-03` — Added `SEED_MONTH`: the book opens on the most recent month with data rather than on the current month. Nothing in the requirements fixes the initial month, and opening on an empty month would be a poor first impression.
**Outcome**

### T8 — Store: month, filter, sheet, register and edit

- **Status:** `[x]`
- **Traces to:** 1.1, 2.13, 4.6, 5.3, 5.4, 7.6, 8.1, 8.2, 8.4, 8.6, 10.3, 10.4,
  10.5 — `state/book-store.tsx`
- **Depends on:** T7
- **Objective:** One reducer owns the state, tested as a pure function with no
  React rendered.

**TDD plan**

1. **Test (red):** reducer cases — `setMonth` moves one month and resets the
   filter; `setMonth` cannot pass the month containing `today`; `openSheet` /
   `closeSheet` transitions; `register` appends an expense with a new id;
   `edit` updates in place; `edit` to a date in another month also moves
   `viewedMonth` there.
2. **Implement (green):** `BookState`, `BookAction`, the reducer, and the
   `BookProvider` / `useBook` context wiring, initialised from the seed with
   `today` resolved once in a lazy initialiser.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — `bookReducer` and `createInitialState` are exported separately from the provider, so every state transition is tested as a pure function with no React rendered.
- `2026-09-03` — `register` follows the same month-navigation rule as `edit` (5.4): if the draft is dated outside the viewed month, the book moves to where the expense landed. The requirements only state it for edits, but registering into an invisible month is the same defect.
- `2026-09-03` — `setMonth` refuses to move past the month containing today, so 8.4 holds even if a caller bypasses the disabled control. Editing an expense to a future date is the one path that can still move the book forward — following the expense (5.4) was judged more important than the guard.
- `2026-09-03` — Blank descriptions are trimmed to `undefined` in the reducer, so the 1.8 fallback is a single `||` at the render site and never a whitespace check.
**Outcome**

### T9 — Store: delete, undo and the 5-second finalisation

- **Status:** `[x]`
- **Traces to:** 2.13, 6.1, 6.3, 6.4, 6.5, 6.6, 7.7 — `state/book-store.tsx`
- **Depends on:** T8
- **Objective:** Deletion is immediate and reversible for five seconds, without
  a timer living inside the reducer.

**TDD plan**

1. **Test (red):** `delete` removes the expense and fills `pendingDeletion`;
   `undoDelete` restores it and — because ordering derives from `date` and
   `createdAt` — puts it back in its original position; `finalizeDelete` clears
   the buffer; a second `delete` while one is pending finalises the first;
   deleting the selected category's last expense resets the filter to `"todas"`;
   with fake timers, the provider dispatches `finalizeDelete` after 5000 ms.
2. **Implement (green):** the three actions plus the provider effect that owns
   the timer and clears it on unmount and on undo.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — `UNDO_WINDOW_MS` is exported and asserted to be 5000, so criterion 6.4's number is pinned by a test rather than buried in the component.
- `2026-09-03` — Undo re-appends the expense to the end of the array and lets `groupByDay` put it back — the test compares the whole grouped structure before and after, which proves 6.3 without storing an index.
- `2026-09-03` — 6.5 falls out of the reducer for free: `delete` overwrites `pendingDeletion`, which is exactly 'finalise the first, offer undo for the second'.
**Outcome**

### T10 — Month header and total with the comparison line

- **Status:** `[x]`
- **Traces to:** 2.1, 2.5, 2.11, 8.1, 8.2, 8.3, 8.4, 8.6, 8.7 — `MonthHeader`,
  `MonthTotal`
- **Depends on:** T4, T9
- **Objective:** The top of the screen: month navigation and the month total
  with its comparison, and no search control.

**TDD plan**

1. **Test (red):** renders `"Septiembre 2026"` and `"$1.284.500"`; the next
   control is disabled in the current month and enabled in a past one; tapping
   previous shows the earlier month; the comparison reads
   `"9,0% menos que en agosto"` with the downward glyph, and is absent when
   either month is empty; no element with an accessible search role exists.
2. **Implement (green):** both components plus their CSS modules, wired to the
   store.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — Read the exact type and spacing values out of the `.pen` rather than eyeballing the screenshot: the month title is 13.5px/600 at -0.1px tracking, the total is 44px/600 mono at -1.8px, the header padding is 56/24/24/24.
- `2026-09-03` — Found that the screen's own fill is `$surface` (white) and only the summary strip and day strips are `$bg` — `page.module.css` and the screen background were corrected accordingly.
- `2026-09-03` — The two month controls are real `<button>`s with `aria-label`s ("Mes anterior" / "Mes siguiente"), which is what lets 8.4 be asserted as `toBeDisabled()` instead of by class name.
**Outcome**

### T11 — Category breakdown bar and legend

- **Status:** `[x]`
- **Traces to:** 2.6, 2.7, 2.8, 2.10 — `CategoryBreakdown`
- **Depends on:** T6, T10
- **Objective:** The proportional bar and its three-item legend, including the
  collapsed empty-month form.

**TDD plan**

1. **Test (red):** renders one segment per present category, in share order,
   each carrying its category's colour token and a width proportional to its
   share; the legend lists the top three as `"Mercado 38%"`; an empty month
   renders a single `--divider` segment and no legend.
2. **Implement (green):** the component and its CSS module, driven entirely by
   `categoryBreakdown`'s output.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — Segments are sized with `flex-grow` set to the category's raw total. Proportionality then comes from flexbox itself — no percentage arithmetic in the component, and the 3px gaps stay fixed rather than eating into the shares.
**Outcome**

### T12 — Summary row of three metrics

- **Status:** `[x]`
- **Traces to:** 2.2, 2.3, 2.4, 2.9 — `SummaryRow`
- **Depends on:** T5, T6, T10
- **Objective:** `"MES ANTERIOR"`, `"PROMEDIO DIARIO"` and `"MÁS GASTADO"`,
  including their no-data form.

**TDD plan**

1. **Test (red):** renders `"$1.412.300"` / `"agosto"`, `"$47.600"` /
   `"27 días"`, `"$486.200"` / `"Mercado"`; with an empty month, the last two
   show `"—"` and `"sin datos"` while `"MES ANTERIOR"` still shows the previous
   month's real total.
2. **Implement (green):** the component and its CSS module, with the two
   hairline rules between the three cells.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — The mockup's illustrative figures ($47.600, '27 días') could not be asserted, because with today at 2026-09-03 September has three elapsed days. The tests assert what the seed actually produces — $82.967 over '3 días' — which is the same criterion checked against real data.
- `2026-09-03` — `"MES ANTERIOR"` keeps showing a real total even when it is $0, because 2.9's `"—"` treatment is scoped to the two derived metrics only.
**Outcome**

### T13 — Category filter chips

- **Status:** `[x]`
- **Traces to:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6 — `CategoryFilter`
- **Depends on:** T6, T12
- **Objective:** Filtering the list and the month total by a single category,
  without disturbing the three summary metrics.

**TDD plan**

1. **Test (red):** the row shows `"Todas"` plus only the categories present that
   month, with `"Todas"` selected by default; with more than four chips the
   surplus collapses into `"+2"` and activating it reveals the rest; selecting
   `"Mercado"` changes the list and `"TOTAL GASTADO"` but leaves
   `"MÁS GASTADO"` unchanged; changing month resets the selection.
2. **Implement (green):** the component, with the expansion flag as local state
   and the selection in the store.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — Chips follow the fixed category order, not the breakdown's share order. Share order was tried first and rejected: chips would reshuffle under the user's thumb as amounts change, and whichever category fell into the '+N' would keep moving.
- `2026-09-03` — Expansion is local component state that resets on a month change, via an effect keyed to the month — the store never learns about it.
- `2026-09-03` — The filtered month total is the sum of `groupByDay`'s subtotals rather than a second filtered aggregate, so the filter is still applied in exactly one place.
**Outcome**

### T14 — The book: jornadas, rows, footer and the register button

- **Status:** `[x]`
- **Traces to:** 1.2–1.10, 5.1, 7.4 — `Book`, `DayGroup`, `ExpenseRow`,
  `BookFooter`, `RegisterButton`
- **Depends on:** T6, T13
- **Objective:** The month reads end to end, and tapping a row is what will open
  edit mode.

**TDD plan**

1. **Test (red):** days render most recent first with strips `"HOY"`, `"AYER"`,
   `"1 DE SEPTIEMBRE"` and their subtotals; a row shows glyph, title, category
   and amount; a row without a description is titled with its category name; the
   footer reads `"TOTAL DE SEPTIEMBRE"` and the month total; activating a row
   dispatches `openSheet` in edit mode; nothing overflows a 390px container.
2. **Implement (green):** the four components plus the floating
   `"Registrar"` button, wired to the store.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — `CategoryGlyph` is the single place a lucide glyph *name* from the domain becomes a React component, so `lib/domain/` still imports no UI.
- `2026-09-03` — The floating button is a fixed, full-width dock containing a 390px row with the button right-aligned in it. Plain `position: fixed; right: 24px` would pin it to the viewport edge on a desktop window instead of to the book's column.
- `2026-09-03` — 1.10 is asserted through the mechanism that actually prevents overflow — `min-width: 0` plus ellipsis truncation on the description column — since jsdom cannot measure layout.
**Outcome**

### T15 — Empty month

- **Status:** `[x]`
- **Traces to:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.5 — `EmptyMonth`
- **Depends on:** T14
- **Objective:** A month with nothing in it invites the first entry instead of
  showing an empty table.

**TDD plan**

1. **Test (red):** navigating to July 2026 renders `"MOVIMIENTOS DEL MES"` with
   `"0"`, `"Aún no registras gastos este mes"`, the supporting line, three ruled
   lines, `"Registrar un gasto"` with `"TOMA MENOS DE 10 SEGUNDOS"`, and a
   footer reading `"JULIO 2026"` / `"$0"`; the day list is absent.
2. **Implement (green):** the component, and the branch in `BookScreen` that
   chooses it over `Book`.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — Emptiness is decided from the month's own total, not from the filtered view: filtering to a category with nothing in it is not an empty month, and 7.1 prevents that state anyway.
- `2026-09-03` — The floating register button is hidden in the empty state, because the mockup's empty frame replaces it with the full-width `Registrar un gasto` call to action. Two register buttons on one screen would be a bug, not a redundancy.
**Outcome**

### T16 — The sheet in registration mode

- **Status:** `[x]`
- **Traces to:** 2.13, 3.5, 4.1–4.10, 9.5, 9.6 — `ExpenseSheet`, `AmountField`,
  `CategoryChips`
- **Depends on:** T15
- **Objective:** The core promise: an expense recorded in an amount and two
  taps, with the book updating behind the sheet.

**TDD plan**

1. **Test (red):** activating `"Registrar"` opens the dialog with focus on a
   numeric-mode amount field and the book still in the document; confirm is
   disabled with no amount, still disabled with an amount but no category, and
   enabled once both exist; typing `48500` displays `"$48.500"`; a further digit
   past 999.999.999 is ignored; confirming closes the sheet, puts the row under
   `"HOY"` and moves `"TOTAL GASTADO"`; in a past month the default date is that
   month's first day; dismissing without confirming leaves the book untouched.
2. **Implement (green):** the `<dialog>`-based sheet in create mode with its
   five chips, optional description and date, and the disabled-confirm rule.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — jsdom 28 does not implement `HTMLDialogElement.showModal`, so a `<dialog>` in a test stays closed and its contents never enter the accessibility tree — every `ByRole` query inside the sheet silently found nothing while `ByLabelText` still worked. Patched `showModal`/`close` in `vitest.setup.ts` rather than in the component: it is a gap in the test environment, and real browsers use the native implementation.
- `2026-09-03` — The amount input is controlled through `formatAmountInput`, so the nine-digit cap and the thousands separators are enforced on every keystroke by the same tested function as the parser.
**Outcome**

### T17 — The sheet in edit mode, with Eliminar

- **Status:** `[x]`
- **Traces to:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1 — `ExpenseSheet`
- **Depends on:** T16
- **Objective:** The same sheet corrects an expense, moves it between days and
  months, or removes it.

**TDD plan**

1. **Test (red):** tapping a row opens the sheet pre-filled with that expense's
   four values and an `"Eliminar"` action; confirming an edited amount updates
   the row and the total in place; changing the day re-groups the row; changing
   to an August date navigates the book to August with the row present;
   dismissing leaves the expense untouched.
2. **Implement (green):** the edit branch of the sheet and its `onDelete` wiring
   into the store's `delete` action.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — TypeScript 7 would not narrow `state.sheet` through a property-access chain inside JSX; destructuring it into a local `sheetState` const first narrows correctly. The first attempt (an IIFE in JSX) passed the tests but failed `typecheck`, which is why both gates are run on every task.
- `2026-09-03` — The sheet is keyed by the expense id, so opening a different row remounts it with fresh field state instead of carrying the previous expense's values over.
**Outcome**

### T18 — Undo notice

- **Status:** `[x]`
- **Traces to:** 3.6, 6.1, 6.2, 6.3, 6.4, 6.6 — `UndoToast`
- **Depends on:** T17
- **Objective:** A deleted expense is gone from every figure at once, and
  recoverable for five seconds.

**TDD plan**

1. **Test (red):** deleting shows the notice while the row and its contribution
   to every figure disappear; undo restores the row in its original position and
   dismisses the notice; with fake timers, letting 5 s pass makes the deletion
   final and hides the notice; deleting the month's last expense shows the empty
   state, and undoing brings the book back.
2. **Implement (green):** the toast component, mounted by `BookScreen` whenever
   `pendingDeletion` is set.
3. **Verify:** `npm run typecheck && npm test`

**Decision log**

- `2026-09-03` — The fake-timer test uses `fireEvent` rather than `userEvent`: user-event's internal waits do not cooperate with Vitest's fake timers and the test timed out at 5 s. The test is about the clock, not about pointer fidelity, which the other tests already cover.
- `2026-09-03` — 6.3 is asserted by comparing the day's row titles before and after the undo, which proves the restored expense lands between 'Éxito Poblado' and 'Café Velvet' rather than merely reappearing.
**Outcome**

### T19 — Installable manifest and icons

- **Status:** `[x]`
- **Traces to:** 11.2 — `app/manifest.ts`, `app/icon.png`
- **Depends on:** T2
- **Objective:** The app installs to a phone's home screen with the product's
  own name, icon and colours.

**TDD plan**

1. **Test (red):** the manifest export declares a Spanish `name` and
   `short_name`, `display: "standalone"`, `start_url: "/"`, a `theme_color` and
   `background_color` taken from the token table, and 192px and 512px icons.
2. **Implement (green):** `app/manifest.ts` and the icon assets.
3. **Verify:** `npm run typecheck && npm test`, then install to a phone and
   confirm it opens standalone.

**Decision log**

- `2026-09-03` — The two icons are generated as PNGs by a small script rather than drawn by hand: an accent field with three white bars of decreasing width — the book's ruled lines. Nothing in the design called for artwork, and this stays inside the token palette.
- `2026-09-03` — `theme_color` and `background_color` are the literal value of the `--bg` token. A manifest cannot reference a CSS custom property, so the `no-stray-colours` test asserts every hex in TypeScript is a token value.
**Outcome**

### T20 — Visual pass against the mockup at 390px

- **Status:** `[x]`
- **Traces to:** 1.10, 10.5, 11.1, 11.3, 11.4 — the whole screen
- **Depends on:** T18, T19
- **Objective:** The built screens match frames `zKnc1` and `s2nLha`, and no
  colour outside the token table reached the code.

**TDD plan**

1. **Test (red):** a test greps the component stylesheets for hex literals and
   `rgb(` values and fails on any that is not a token reference; a second test
   greps the source for `fetch(`, `"use server"` and route handlers and fails on
   any hit.
2. **Implement (green):** replace whatever the greps find; then compare the
   running app at 390px side by side with the two `.pen` frames and correct
   spacing, sizes and weights until they match.
3. **Verify:** `npm run typecheck && npm test`, plus the side-by-side comparison
   and a check that a 1280px window shows the book centred at 390px.

**Decision log**

- `2026-09-03` — The backdrop was the only stray colour in the codebase (`rgb(21 23 27 / 38%)`); replaced with `color-mix(in srgb, var(--text-primary) 38%, transparent)`, which keeps 11.4 true.
- `2026-09-03` — **Found by opening the app, not by the tests: `app/page.tsx` never wrapped `BookScreen` in `BookProvider`.** Every component test used a helper that supplied the provider itself, so 155 tests passed against an application that threw on load. Fixed by introducing `BookApp`, which owns the provider and the screen together so the screen cannot be mounted without its store, plus a test that renders it bare — the test that would have caught this.
- `2026-09-03` — **Found visually: the 1px rule between rows was invisible.** It was a `<span>` inside a plain `<div>`, so it stayed inline and its height collapsed. Blockified, the wrapper `<div>` replaced with a `Fragment`, and pinned by a stylesheet assertion.
- `2026-09-03` — **Found visually: the bottom sheet hung from the top of the screen.** A `<dialog>` sizes itself to its content, so `justify-content: flex-end` had nothing to push against; the dialog is now stretched to the viewport with the sheet constrained to 390px inside it.
- `2026-09-03` — Removed a 15px margin above the book's rule that the mockup does not have.
- `2026-09-03` — The hydration warning seen in the browser comes from a browser extension writing `cz-shortcut-listen` onto `<body>`, not from the app.
- `2026-09-03` — `next dev` appends a `nextjs-agent-rules` block to the repo's CLAUDE.md on every run. Left in place — it is re-added if deleted — and reported to the user; `agentRules: false` in `next.config.ts` turns it off.
**Outcome**

## Open items

- **The seed is pinned to 2026-07 – 2026-09, as requirements 10.1 and 10.2
  state.** The book opens on September 2026 (`SEED_MONTH`) rather than on the
  current month, so it demos correctly today. Once the real date is past
  30 September 2026, September becomes a past month: the day strips stop
  reading `"HOY"` / `"AYER"`, `PROMEDIO DIARIO` divides by 30, and the
  forward chevron can walk into empty months. Seeding relative to the running
  clock instead would fix it, but that contradicts the approved requirement —
  it is a product decision, not an implementation one. — *blocks nothing today*
- **`next dev` appends a `nextjs-agent-rules` block to the repo's `CLAUDE.md`**
  on every run, and re-adds it if deleted. Set `agentRules: false` in
  `next.config.ts` to stop it. — *cosmetic; the project's own instructions are
  untouched above it*
- **`MÁS GASTADO` while a category filter is active** still shows the whole
  month, per criteria 7.4 / 7.5 as approved. Worth a look once someone has used
  the filter in anger. — *no code change pending*
