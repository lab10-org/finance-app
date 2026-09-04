# Requirements — Supabase expense persistence

**Status:** In review
**Date:** 2026-09-04
**Author:** Juan Sebastian Henao Parra

## Introduction

The book knows who you are but still forgets everything you tell it. The v1
prototype (`docs/specs/2026-09-03-monthly-expense-book/`) holds expenses in
memory on purpose — requirements 10.3 and 10.4 of that spec say every
registration, edit and deletion is discarded on reload — and the auth feature
(`docs/specs/2026-09-04-supabase-auth/`) deliberately stopped short of moving
them anywhere. The result is an app that asks for your email and then hands you
the same thirty-seven invented expenses it hands everybody, and throws away the
real one you just typed.

This feature makes the book yours and makes it last. After it exists, an expense
recorded on Monday is still there on Friday, on the same phone or on a different
one; two people signing in on the same device see two different books; and the
month you are looking at is read from a database rather than reconstructed from
a seed file. What does not change is how any of it feels: registering still has
to be a sub-ten-second act, and the month header still has to be right the
instant the book appears, not a second later.

**This feature supersedes requirements 10.3 and 10.4 of the v1 prototype.** It
does not reopen anything else about the book: the five categories, the month
navigation, the day grouping, the derived header figures and the undo window all
keep the behavior they already have and the criteria that already describe them.
What is new is where the data lives, who it belongs to, and what the app does
while it is in transit or when the transit fails.

## Glossary

- **"el libro"** — the month view delivered by the v1 prototype: the day groups,
  the header figures and the category filter.
- **"la hoja"** — the sheet used to register and to edit an expense.
- **"la jornada"** — one day group inside the book.
- **The window** — the two calendar months the app needs in order to draw one
  screen: the month being viewed and the month before it. The previous month is
  not decoration; the "comparativo" in the header cannot be computed without it.
- **Optimistic write** — a change shown to the user as done before the database
  has confirmed it.
- **Provisional id** — the identifier an optimistic expense carries while it has
  no database identifier yet.
- **Soft deletion** — marking an expense as deleted while its row survives, so
  that reading skips it and undoing it restores it.
- **The seeded book** — the thirty-seven example expenses a brand-new account
  starts with, spread over the month it was created in and the month before.
- **Migration** — a versioned, committed SQL file that brings a database schema
  from one state to the next. The only sanctioned way this feature changes the
  schema.

## Requirements

### Requirement 1 — Expenses survive

**User story:** As a person tracking my spending, I want the expenses I record
to still be there tomorrow, so that the book is a record of my money instead of
a scratch pad.

**Acceptance criteria**

1.1 THE SYSTEM SHALL store every registered expense outside the browser, so that
    it survives a reload, a browser restart and a change of device.
1.2 WHEN a user who has recorded expenses opens the app again THE SYSTEM SHALL
    show those expenses, with the same amount, category, description and date
    they were recorded with.
1.3 THE SYSTEM SHALL preserve the order of expenses within a single "jornada"
    across a reload, so that a day's rows do not rearrange themselves between
    visits.
1.4 THE SYSTEM SHALL apply an edit durably, so that reopening the app shows the
    edited values and not the original ones.
1.5 THE SYSTEM SHALL apply a completed deletion durably, so that reopening the
    app does not show the deleted expense.
1.6 IF the user signs out and signs back in on the same device THEN THE SYSTEM
    SHALL show the same expenses, not an empty book.

### Requirement 2 — A book belongs to exactly one account

**User story:** As someone whose expenses are nobody else's business, I want my
book to be reachable only by me, so that using this app is not a disclosure.

**Acceptance criteria**

2.1 THE SYSTEM SHALL attach every expense to exactly one account at the moment
    it is created.
2.2 THE SYSTEM SHALL show a signed-in user only the expenses attached to their
    own account.
2.3 IF a request attempts to read, change or delete an expense attached to
    another account THEN THE SYSTEM SHALL refuse it, regardless of where the
    request comes from.
2.4 THE SYSTEM SHALL enforce that ownership in the database itself, so that a
    mistake in application code cannot expose one account's expenses to another.
2.5 IF there is no session THEN THE SYSTEM SHALL NOT produce any expense figure,
    including totals and averages.
2.6 WHEN a different account signs in on a device THE SYSTEM SHALL show that
    account's book with no trace of the previous account's expenses.

### Requirement 3 — The book opens with its data already on screen

**User story:** As someone checking where my money went, I want the book to be
complete the moment it appears, so that "un solo vistazo" is one look and not a
look followed by a wait.

**Acceptance criteria**

3.1 WHEN a signed-in user opens the app THE SYSTEM SHALL render the book already
    containing the current month's expenses, with no intermediate state in which
    the book is visible but empty.
3.2 WHEN the book first appears THE SYSTEM SHALL show the month total, the daily
    average, the biggest category, the breakdown bar and the "comparativo"
    already computed, with no figure appearing or changing after the first paint.
3.3 THE SYSTEM SHALL load the viewed month together with the month before it, so
    that the "comparativo" can be computed without a further read.
3.4 THE SYSTEM SHALL open the book on the month containing today's date.
3.5 IF the account has no expenses at all THEN THE SYSTEM SHALL show the empty
    state for the current month rather than an error or a spinner.
3.6 IF the expenses cannot be read THEN THE SYSTEM SHALL tell the user the book
    could not be loaded and offer a way to retry, rather than showing an empty
    book that misrepresents their spending as zero.

### Requirement 4 — Moving to a month that is not loaded

**User story:** As someone comparing this month with a few months back, I want to
navigate freely through my history, so that the book is worth keeping over time.

**Acceptance criteria**

4.1 WHEN the user navigates to a month that has not been read yet THE SYSTEM
    SHALL read that month and the month before it.
4.2 WHILE a month is being read THE SYSTEM SHALL indicate that the book is
    loading, and SHALL NOT present incomplete figures as if they were final.
4.3 WHEN the user returns to a month that has already been read THE SYSTEM SHALL
    show it without reading it again.
4.4 IF a month cannot be read THEN THE SYSTEM SHALL say so for that month and
    offer a retry, and SHALL leave the previously viewed month's data intact.
4.5 THE SYSTEM SHALL keep the existing rule that the book never moves past the
    month containing today.

### Requirement 5 — Registering stays instant

**User story:** As a person recording a purchase while standing at the counter, I
want the expense to be logged in under ten seconds, so that recording it does not
cost more than the purchase did.

**Acceptance criteria**

5.1 WHEN the user confirms a valid entry THE SYSTEM SHALL close "la hoja" and
    show the expense in its "jornada" immediately, without waiting for the
    database to confirm it.
5.2 WHEN an expense is shown before it has been confirmed THE SYSTEM SHALL
    include it in the month total, the daily average, the breakdown and the
    "comparativo", so that the header never disagrees with the list.
5.3 WHEN the database confirms the expense THE SYSTEM SHALL adopt the identifier
    the database assigned to it, without the expense moving, flickering or
    changing any value on screen.
5.4 IF the write fails THEN THE SYSTEM SHALL remove the expense from the book,
    tell the user it could not be saved, and offer them their entry back rather
    than discarding what they typed.
5.5 THE SYSTEM SHALL keep the existing rule that registering an expense moves the
    book to the month of that expense's date.
5.6 THE SYSTEM SHALL NOT record the same expense twice when the user confirms
    once.

### Requirement 6 — Editing and deleting reach the database

**User story:** As someone who mistyped an amount, I want my correction to stick,
so that the book stays true.

**Acceptance criteria**

6.1 WHEN the user confirms an edit THE SYSTEM SHALL show the updated expense
    immediately and persist the change.
6.2 IF an edit fails to persist THEN THE SYSTEM SHALL restore the expense's
    previous values in the book and tell the user the change was not saved.
6.3 WHEN the user deletes an expense THE SYSTEM SHALL remove it from the book
    immediately and keep it recoverable for the existing undo window.
6.4 WHEN the undo window expires without the user undoing THE SYSTEM SHALL mark
    the expense as deleted in the database.
6.5 WHEN the user undoes a deletion THE SYSTEM SHALL restore the expense to the
    exact position it held, with all of its values unchanged.
6.6 IF the user closes or reloads the app during the undo window THEN THE SYSTEM
    SHALL treat the deletion as final, so that what they saw disappear does not
    come back.
6.7 THE SYSTEM SHALL NOT show a deleted expense in any list, total or aggregate.
6.8 IF a deletion fails to persist THEN THE SYSTEM SHALL return the expense to
    the book and tell the user it was not deleted.

### Requirement 7 — An action taken on an unconfirmed expense is not lost

**User story:** As someone who registered an expense and immediately noticed the
amount was wrong, I want to be able to fix it right away, so that I do not have
to wait on something I cannot see.

**Acceptance criteria**

7.1 WHILE an expense is waiting for the database to confirm it THE SYSTEM SHALL
    keep it editable and deletable in the interface, or SHALL visibly indicate
    that it is not yet actionable.
7.2 WHEN the user edits or deletes an expense whose confirmation has not arrived
    THE SYSTEM SHALL apply that action to the correct expense once the
    confirmation arrives.
7.3 THE SYSTEM SHALL NOT apply such an action to a different expense, and SHALL
    NOT silently drop it.
7.4 IF such an action cannot be applied THEN THE SYSTEM SHALL tell the user and
    leave the book showing what is actually stored.

### Requirement 8 — A new account starts with a book worth looking at

**User story:** As someone opening this app for the first time, I want to see
what a full month looks like, so that I understand what the app does before I
have typed anything into it.

**Acceptance criteria**

8.1 WHEN an account is created THE SYSTEM SHALL give it the seeded book.
8.2 THE SYSTEM SHALL date the seeded expenses relative to the month the account
    was created in and the month before it, so that a new account always opens on
    a month that has data.
8.3 THE SYSTEM SHALL seed enough of the previous month for the "comparativo" to
    appear on the first screen.
8.4 THE SYSTEM SHALL make seeded expenses indistinguishable from expenses the
    user records: they can be edited, filtered and deleted like any other.
8.5 THE SYSTEM SHALL seed an account exactly once, so that signing in again does
    not multiply the example expenses.
8.6 IF seeding fails THEN THE SYSTEM SHALL still let the user into an empty book
    rather than blocking sign-in.

### Requirement 9 — The book catches up when it may be stale

**User story:** As someone who registered an expense on my phone this morning, I
want the tab I left open on my laptop to show it when I come back to it, so that
I do not act on a stale number.

**Acceptance criteria**

9.1 WHEN the app is opened THE SYSTEM SHALL read the current state of the window
    from the database.
9.2 WHEN the app returns to the foreground after being hidden THE SYSTEM SHALL
    re-read the window.
9.3 WHEN a re-read returns different data THE SYSTEM SHALL update the book and
    its header figures to match.
9.4 THE SYSTEM SHALL NOT discard a change the user made locally that has not yet
    been confirmed when it re-reads.
9.5 IF a re-read fails THEN THE SYSTEM SHALL keep showing the data it already
    has, rather than emptying the book.

### Requirement 10 — What an expense is made of

**User story:** As the person maintaining this app, I want the stored shape of an
expense to be explicit, so that a later feature does not have to guess what a
row means.

**Acceptance criteria**

10.1 THE SYSTEM SHALL store an expense's amount as an exact decimal quantity,
     with no rounding error introduced by storing or summing it.
10.2 THE SYSTEM SHALL store the currency of an amount alongside it, defaulting to
     `"COP"`.
10.3 THE SYSTEM SHALL record every expense in this version as `"COP"`, and SHALL
     keep presenting amounts as whole Colombian pesos exactly as the book does
     today.
10.4 THE SYSTEM SHALL reject an amount that is zero or negative.
10.5 THE SYSTEM SHALL store an absent description as absent, never as an empty or
     blank string.
10.6 THE SYSTEM SHALL store a date as a calendar date, so that no timezone can
     move an expense into a different day than the one the user chose.
10.7 THE SYSTEM SHALL record when each expense was created and when it was last
     changed.
10.8 THE SYSTEM SHALL give every expense an identifier that sorts in creation
     order.

### Requirement 11 — Categories are validated by the app, not the database

**User story:** As the person maintaining this app, I want the list of categories
to live in one place — the code — so that adding or renaming one does not require
a database change.

**Acceptance criteria**

11.1 THE SYSTEM SHALL NOT constrain the set of category values in the database.
11.2 THE SYSTEM SHALL only ever write one of the five known category values from
     the interface.
11.3 IF an expense is read whose category is not one of the five known values
     THEN THE SYSTEM SHALL present it under `"Otros"` rather than failing to
     render the book.
11.4 IF such an expense is read THEN THE SYSTEM SHALL still include its amount in
     the month total, so that the header stays truthful.

### Requirement 12 — The schema changes only through migrations

**User story:** As the developer of this app, I want every schema change to be a
committed file, so that a fresh clone reproduces the same database and nobody has
to remember what they clicked in a dashboard.

**Acceptance criteria**

12.1 THE SYSTEM SHALL define every table, index, function and access rule this
     feature needs in migration files kept under version control.
12.2 WHEN a developer resets the local database THE SYSTEM SHALL reproduce the
     full schema from those migrations alone, with no manual step.
12.3 THE SYSTEM SHALL NOT require any change to be made through a web dashboard
     for the app to work.
12.4 THE SYSTEM SHALL document how to apply the migrations to a local database
     alongside the existing local-stack instructions.

## Out of scope

- **Income, budgets and goals** — the book records spending only. Settled during
  brainstorming.
- **Shared books** — an expense belongs to one account; there are no invitations,
  no roles and no shared visibility. This is what lets ownership be a single
  rule.
- **Real multi-currency** — the currency is stored, but every expense in this
  version is `"COP"`, nothing in the interface offers a choice, and no total ever
  mixes currencies. Choosing a currency, converting between them and deciding
  what a mixed month shows is a separate feature.
- **Payment methods and attachments** — no cash/card distinction, no receipt
  photos.
- **Recurring expenses** — subscriptions are typed in each month like anything
  else.
- **Live sync across devices** — no realtime subscription. Requirement 9 is the
  whole of the freshness guarantee.
- **Offline use** — there is no write queue and no local cache to fall back on.
  Without a connection the app reports the failure; it does not pretend to work.
- **Changing the derived figures** — the month total, daily average, biggest
  category, breakdown and "comparativo" keep the definitions and the criteria
  they already have in the v1 spec. Nothing about them is recomputed in the
  database.
- **Purging soft-deleted rows** — see Open questions.

## Open questions

- **What happens to an expense that is edited or deleted before its write is
  confirmed?** Requirement 7 says the action must not be lost or misapplied, but
  not which of the two behaviors the user sees — the controls stay live and the
  action is applied on confirmation, or the row is visibly not-yet-actionable for
  that instant. — Product decision (user) — blocks the interaction design of 7.1.
- **Do soft-deleted rows ever get purged?** They accumulate forever unless
  something removes them. — Developer decision (user) — blocks whether this
  feature ships a retention rule or explicitly defers one.
- **Are accounts that already exist locally seeded?** Requirement 8 covers
  account creation; the developer's existing local accounts predate it and would
  open an empty book. — Developer decision (user) — blocks whether seeding is
  triggered only on creation or also on a first sign-in that finds no expenses.
- **Does a failed write get a retry the user can press, or only the message and
  their entry back?** 5.4, 6.2 and 6.8 require the book to stay truthful and the
  user to be told, and stop there. — Product decision (user) — blocks the error
  affordance in "la hoja" and in the book.
