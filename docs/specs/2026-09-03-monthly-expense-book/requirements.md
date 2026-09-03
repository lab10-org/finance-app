# Requirements — Monthly Expense Book (v1 prototype)

**Status:** Approved
**Date:** 2026-09-03
**Author:** Juan Sebastian Henao Parra

## Introduction

Finance App is a personal-finance product for recording and reading day-to-day
spending. Its value proposition is minimal friction: logging an expense must
take under 10 seconds, and one glance at the screen must answer "where did my
money go this month?".

Today there is nothing to use — only two design frames in `docs/mockups/v1.pen`,
both of them read-only views: the populated month book (`zKnc1`) and its empty
state (`s2nLha`). Nobody can register an expense, because the capture flow was
never designed; the mockup only shows the button that would open it.

This feature delivers the first usable version of the product: a navigable
prototype where a person can register an expense from a sheet that rises over
the book, see it land in the day's list, watch the month's figures recalculate,
correct it or delete it, filter the month by category, and move between months.
It is deliberately a prototype: everything lives in memory for the duration of
the session and resets on reload. That buys a full, honest test of the 10-second
promise and of the reading experience without committing yet to a storage
format, an account model, or a backend.

## Glossary

- **"el libro"** — the month view: the header figures plus the day-grouped list
  of expenses for one calendar month.
- **"jornada"** — one day group inside the book: a day strip (date label plus
  that day's subtotal) followed by that day's expense rows.
- **"la hoja"** — the bottom sheet that rises over the book to register a new
  expense or to edit an existing one. The same component serves both.
- **"comparativo"** — the line under the month total comparing this month's
  spending with the previous month's.
- **"reparto"** — the proportional bar plus legend showing each category's share
  of the month total.
- **Category** — one of exactly five fixed values: `"Mercado"`,
  `"Restaurantes"`, `"Transporte"`, `"Suscripciones"`, `"Otros"`.
- **Viewed month** — the calendar month the book is currently showing, which is
  not necessarily the current month.
- **Elapsed days** — for the current month, today's day-of-month; for any past
  month, the total number of days in that month.

## Requirements

### Requirement 1 — Reading the month book

**User story:** As a person tracking daily spending, I want every expense of a
month grouped by day on one screen, so that I can see where my money went
without doing any arithmetic myself.

**Acceptance criteria**

1.1 THE SYSTEM SHALL display exactly one calendar month at a time.
1.2 THE SYSTEM SHALL group the viewed month's expenses into "jornadas" by
    calendar day, ordered most recent day first.
1.3 THE SYSTEM SHALL order the expenses within a "jornada" most recently
    registered first.
1.4 THE SYSTEM SHALL label a "jornada" `"HOY"` when its date is today, `"AYER"`
    when its date is yesterday, and `"<D> DE <MONTH>"` in uppercase Spanish
    otherwise (e.g. `"1 DE SEPTIEMBRE"`).
1.5 THE SYSTEM SHALL display, on each day strip, the sum of that "jornada"'s
    expenses.
1.6 THE SYSTEM SHALL display, for each expense row, its category glyph, a title,
    its category name, and its amount.
1.7 WHERE an expense has a description THE SYSTEM SHALL use that description as
    the row's title.
1.8 IF an expense has no description THEN THE SYSTEM SHALL use its category name
    as the row's title.
1.9 THE SYSTEM SHALL close the book with a summary row labelled
    `"TOTAL DE <MONTH>"` showing the viewed month's total.
1.10 THE SYSTEM SHALL render the whole book without horizontal scrolling at a
     390px viewport width.

### Requirement 2 — Month summary figures

**User story:** As a person tracking daily spending, I want the month's key
numbers computed for me at the top of the book, so that one glance tells me how
this month is going compared with the last one.

**Acceptance criteria**

2.1 THE SYSTEM SHALL display under `"TOTAL GASTADO"` the sum of every expense in
    the viewed month.
2.2 THE SYSTEM SHALL display under `"MES ANTERIOR"` the previous month's total,
    annotated with that month's name in lowercase Spanish.
2.3 THE SYSTEM SHALL display under `"PROMEDIO DIARIO"` the viewed month's total
    divided by its elapsed days, annotated `"<N> días"`.
2.4 THE SYSTEM SHALL display under `"MÁS GASTADO"` the total of the
    highest-spending category of the viewed month, annotated with that
    category's name.
2.5 THE SYSTEM SHALL display in the "comparativo" the percentage difference
    between the viewed month's total and the previous month's, worded
    `"<P>% menos que en <month>"` or `"<P>% más que en <month>"`, with a
    downward glyph for less and an upward glyph for more.
2.6 THE SYSTEM SHALL render the "reparto" bar as one segment per category that
    has at least one expense, sized in proportion to that category's share of
    the month total and ordered from largest share to smallest.
2.7 THE SYSTEM SHALL list in the "reparto" legend the three highest-spending
    categories with their share rounded to a whole percent.
2.8 IF a category has no expenses in the viewed month THEN THE SYSTEM SHALL omit
    it from both the "reparto" bar and the legend.
2.9 IF the viewed month has no expenses THEN THE SYSTEM SHALL show `"—"` as the
    value and `"sin datos"` as the annotation for `"PROMEDIO DIARIO"` and
    `"MÁS GASTADO"`.
2.10 IF the viewed month has no expenses THEN THE SYSTEM SHALL collapse the
     "reparto" bar to a single neutral segment and hide the legend.
2.11 IF either the viewed month or the previous month has no expenses THEN THE
     SYSTEM SHALL hide the "comparativo" entirely.
2.12 IF two categories tie for highest spending THEN THE SYSTEM SHALL show the
     one that comes first in the fixed category order.
2.13 WHEN any expense is added, edited, deleted or restored THE SYSTEM SHALL
     recompute every figure in 2.1–2.11 before the next frame the user sees.

### Requirement 3 — Empty month

**User story:** As a person opening a month I have not recorded anything in, I
want the screen to invite me to start rather than show me an empty table, so
that the first entry feels like the obvious next step.

**Acceptance criteria**

3.1 IF the viewed month has no expenses THEN THE SYSTEM SHALL replace the
    day-grouped list with the empty state.
3.2 THE SYSTEM SHALL show in the empty state the heading
    `"MOVIMIENTOS DEL MES"` with the count `"0"`, the message
    `"Aún no registras gastos este mes"`, the supporting line
    `"Anota el primero y tu libro se irá llenando día por día."`, and three blank
    ruled lines.
3.3 THE SYSTEM SHALL show in the empty state a primary action labelled
    `"Registrar un gasto"` with the note `"TOMA MENOS DE 10 SEGUNDOS"`.
3.4 THE SYSTEM SHALL show in the empty state a footer with the viewed month in
    uppercase and the total `"$0"`.
3.5 WHEN the user registers the first expense of an empty month THE SYSTEM SHALL
    replace the empty state with the book showing that expense.
3.6 WHEN the user deletes the last remaining expense of a month THE SYSTEM SHALL
    show the empty state for that month.

### Requirement 4 — Registering an expense in under 10 seconds

**User story:** As a person who just paid for something, I want to record it in
two taps and a number, so that logging expenses stays a habit instead of a
chore.

**Acceptance criteria**

4.1 WHEN the user activates `"Registrar"` THE SYSTEM SHALL raise "la hoja" over
    the book, leaving the book visible behind it.
4.2 WHEN "la hoja" opens in registration mode THE SYSTEM SHALL place the input
    focus on the amount field with a numeric keypad.
4.3 THE SYSTEM SHALL offer exactly five category chips in "la hoja":
    `"Mercado"`, `"Restaurantes"`, `"Transporte"`, `"Suscripciones"`, `"Otros"`.
4.4 THE SYSTEM SHALL treat description and date as optional fields.
4.5 WHEN "la hoja" opens in registration mode THE SYSTEM SHALL default the date
    to today if the viewed month is the current month, and to the first day of
    the viewed month otherwise.
4.6 WHEN the user confirms an entry that has an amount and a category THE SYSTEM
    SHALL record the expense, close "la hoja", and show the new row inside its
    "jornada".
4.7 IF the amount is empty or zero THEN THE SYSTEM SHALL keep the confirm action
    disabled.
4.8 IF no category is selected THEN THE SYSTEM SHALL keep the confirm action
    disabled.
4.9 IF the user dismisses "la hoja" without confirming THEN THE SYSTEM SHALL
    discard the entered values and leave the book unchanged.
4.10 THE SYSTEM SHALL record an amount as a whole number of Colombian pesos,
     rejecting decimal input.

### Requirement 5 — Correcting an expense

**User story:** As a person who mistyped an amount or picked the wrong category,
I want to open the expense and fix it, so that a slip does not poison the
month's numbers.

**Acceptance criteria**

5.1 WHEN the user activates an expense row THE SYSTEM SHALL raise "la hoja" in
    edit mode, pre-filled with that expense's amount, category, description and
    date.
5.2 WHILE "la hoja" is in edit mode THE SYSTEM SHALL show a `"Eliminar"` action
    at its foot.
5.3 WHEN the user confirms an edit THE SYSTEM SHALL update that expense in place
    and close "la hoja".
5.4 IF an edit changes the date to a day outside the viewed month THEN THE
    SYSTEM SHALL move the expense to its new month and navigate the book to that
    month.
5.5 IF an edit changes the date to another day within the viewed month THEN THE
    SYSTEM SHALL move the row to that day's "jornada".
5.6 IF the user dismisses "la hoja" without confirming THEN THE SYSTEM SHALL
    leave the expense exactly as it was.

### Requirement 6 — Deleting with a way back

**User story:** As a person who deleted the wrong row, I want a moment to undo
it, so that a single mistaken tap does not cost me a record I cannot recover.

**Acceptance criteria**

6.1 WHEN the user activates `"Eliminar"` THE SYSTEM SHALL remove the expense
    immediately, close "la hoja", and show a notice offering to undo.
6.2 WHILE the undo notice is visible THE SYSTEM SHALL show every figure and list
    as if the deletion were final.
6.3 WHEN the user activates the undo action THE SYSTEM SHALL restore the expense
    to its original day and position and dismiss the notice.
6.4 IF the undo notice has been visible for 5 seconds without being activated
    THEN THE SYSTEM SHALL make the deletion final for the session.
6.5 IF a second expense is deleted while an undo notice is visible THEN THE
    SYSTEM SHALL finalize the first deletion and show the notice for the second.
6.6 IF the deleted expense was the last one of the month THEN THE SYSTEM SHALL
    show the empty state, and restore the book if the deletion is undone.

### Requirement 7 — Filtering the month by category

**User story:** As a person who suspects one category ate the month, I want to
isolate it, so that I can see exactly what it cost me and on what.

**Acceptance criteria**

7.1 THE SYSTEM SHALL show a filter row containing `"Todas"` followed by one chip
    per category that has at least one expense in the viewed month.
7.2 THE SYSTEM SHALL mark exactly one chip as selected at all times, defaulting
    to `"Todas"`.
7.3 IF more than four chips would be shown THEN THE SYSTEM SHALL collapse the
    surplus into a `"+<N>"` chip that reveals the remaining chips when
    activated.
7.4 WHILE a category chip is selected THE SYSTEM SHALL list only that category's
    expenses, and compute the day subtotals, the closing total and
    `"TOTAL GASTADO"` from that subset alone.
7.5 WHILE a category chip is selected THE SYSTEM SHALL keep `"MES ANTERIOR"`,
    `"PROMEDIO DIARIO"`, `"MÁS GASTADO"` and the "comparativo" describing the
    full month, unfiltered.
7.6 WHEN the viewed month changes THE SYSTEM SHALL reset the filter to
    `"Todas"`.
7.7 IF the selected category's last expense in the month is deleted THEN THE
    SYSTEM SHALL reset the filter to `"Todas"`.

### Requirement 8 — Moving between months

**User story:** As a person comparing this month with the last, I want to step
back and forth through months, so that I can see how my spending changed.

**Acceptance criteria**

8.1 WHEN the user activates the previous-month control THE SYSTEM SHALL show the
    book for the month before the viewed month.
8.2 WHEN the user activates the next-month control THE SYSTEM SHALL show the
    book for the month after the viewed month.
8.3 THE SYSTEM SHALL label the header with the viewed month and year in Spanish,
    capitalized (e.g. `"Septiembre 2026"`).
8.4 IF the viewed month is the current month THEN THE SYSTEM SHALL disable the
    next-month control.
8.5 IF the target month has no expenses THEN THE SYSTEM SHALL show the empty
    state for that month.
8.6 WHEN the viewed month changes THE SYSTEM SHALL recompute every summary
    figure for the new month.

8.7 THE SYSTEM SHALL NOT render a search control in the header, because search
    is out of scope for v1 and an inert control invites the reviewer to tap it.

### Requirement 9 — Colombian peso and Spanish formatting

**User story:** As a Colombian user, I want amounts and dates written the way I
write them, so that I can read the screen without translating anything in my
head.

**Acceptance criteria**

9.1 THE SYSTEM SHALL format every amount as `$` followed by the integer number
    of pesos with `.` as the thousands separator and no decimals (e.g.
    `"$1.284.500"`).
9.2 THE SYSTEM SHALL format a zero amount as `"$0"`.
9.3 THE SYSTEM SHALL format percentages with `,` as the decimal separator (e.g.
    `"9,0%"`).
9.4 THE SYSTEM SHALL write month names in Spanish.
9.5 WHILE the user types an amount THE SYSTEM SHALL accept digits only and
    display the value with thousands separators as it is typed.
9.6 IF the typed amount would exceed 999.999.999 pesos THEN THE SYSTEM SHALL
    ignore further digits.

### Requirement 10 — Prototype data lifetime

**User story:** As the person evaluating this prototype, I want it to start from
a realistic month every time, so that each demo begins from the same known
state and nothing I type is mistaken for saved data.

**Acceptance criteria**

10.1 WHEN the application loads THE SYSTEM SHALL populate the book with seeded
     expenses for July 2026, August 2026 and September 2026.
10.2 THE SYSTEM SHALL seed July 2026 with no expenses, so that the empty state
     is reachable without deleting anything.
10.3 THE SYSTEM SHALL hold every registration, edit and deletion in memory for
     the lifetime of the page only.
10.4 WHEN the page is reloaded THE SYSTEM SHALL return to the seeded state,
     discarding every change made in the previous session.
10.5 THE SYSTEM SHALL NOT transmit expense data to any server.

### Requirement 11 — Mobile shell

**User story:** As a person recording expenses on the street, I want the app on
my phone's home screen behaving like an app, so that opening it is not a trip
through the browser.

**Acceptance criteria**

11.1 THE SYSTEM SHALL lay out every screen for a 390px-wide viewport as the base
     case.
11.2 THE SYSTEM SHALL be installable to a phone's home screen with a name, icon
     and theme colour drawn from the design tokens.
11.3 IF the viewport is wider than 390px THEN THE SYSTEM SHALL centre the book in
     a column no wider than 390px.
11.4 THE SYSTEM SHALL use only the colour, typography, spacing and radius tokens
     defined in `docs/mockups/v1.pen`.

## Out of scope

- **Search** — the magnifying glass exists in the mockup, but with a handful of
  seeded expenses it earns nothing. See the open question about whether the icon
  stays visible.
- **A desktop layout** — the design is mobile-first at 390px; a real desktop
  view is a later extension, not a v1 concern (11.3 only prevents the phone
  layout from stretching).
- **Persistence of any kind** — no local storage, no database. Deliberate: see
  Requirement 10.
- **Accounts, login and sync** — single anonymous user, one device.
- **Income, budgets and balances** — this is an expense book, not a ledger.
- **Custom categories** — the five categories are fixed in v1.
- **Offline operation** — installable is not the same as offline-capable.
- **Recurring expenses, attachments, multi-currency, export.**

## Open questions

All four questions raised in the first draft were closed at the 2026-09-03
review. They are kept here with their resolutions, because the reasoning is the
part worth reading later.

- **Should the category filter also affect the "Resumen" row and the
  "comparativo"?** *Resolved: no.* The split in 7.4 / 7.5 stands as written —
  the list and `"TOTAL GASTADO"` follow the filter, the three summary metrics
  and the "comparativo" always describe the whole month. Filtering everything
  would leave `"MÁS GASTADO"` restating the selected category's own total.
- **Which glyph represents `"Otros"`?** *Resolved: `more-horizontal`,* the same
  lucide family the other four glyphs come from. Recorded in the category table
  in `design.md`.
- **Does the search icon stay on screen?** *Resolved: it is removed in v1.* See
  criterion 8.7. It comes back with search itself.
- **How long does the undo notice stay?** *Resolved: 5 seconds.* Fixed in
  criterion 6.4 so the behaviour is testable.
