# Requirements — Supabase Auth sign-in

**Status:** In review
**Date:** 2026-09-04
**Author:** Juan Sebastian Henao Parra

## Introduction

Today the expense book has no idea who is using it. The v1 prototype
(`docs/specs/2026-09-03-monthly-expense-book/`) is deliberately anonymous and
in-memory: anyone who opens the page gets the same seeded month, and everything
they type disappears on reload. That was the right trade for testing the
10-second promise, but it is the end of the road for a product about *your*
money — there is nothing to attach a person's expenses to, and no way to give
someone the same book on their phone tomorrow.

This feature introduces the account. After it exists, opening the app asks who
you are before it shows anything, signing in requires only an email address and
a one-time code, and the session survives closing the app and reopening it —
including from the installed home-screen icon. It runs entirely on the
developer's machine: the whole authentication stack comes up locally with the
Supabase CLI, and the sign-in emails are captured locally too, so the flow can
be exercised end to end without a cloud project, an SMTP provider, or a real
inbox.

**This feature is authentication only.** Expenses do not move into the database
here. Requirements 10.3 and 10.4 of the v1 prototype stay in force: the book is
still held in memory and still resets on reload. What changes is that the reload
now lands a *known user* in front of the book, which is the seam a later feature
needs in order to persist expenses per account. Choosing to persist the book,
and the row-level rules that go with it, is a separate spec.

## Glossary

- **"la entrada"** — the sign-in screen: the only thing a person without a
  session can see. It has two steps, the email step and the code step.
- **"el código"** — the six-digit, single-use, time-limited code emailed to the
  address the person typed. Entering it correctly is what creates the session.
- **"la sesión"** — the credential that proves, on both the server and the
  client, which account is using the app right now.
- **"el libro"** — the month view delivered by the v1 prototype. Unchanged by
  this feature except that it now sits behind "la entrada".
- **Local stack** — the set of Supabase services run on the developer's machine
  by the Supabase CLI, including the local mail catcher that receives every
  outgoing email instead of a real mail server.

## Requirements

### Requirement 1 — The whole auth stack runs on the developer's machine

**User story:** As the developer of this app, I want authentication to run
entirely on my machine, so that I can build and test sign-in without creating a
cloud project, paying for anything, or sending real email.

**Acceptance criteria**

1.1 THE SYSTEM SHALL keep every piece of Supabase configuration it needs under
    version control, so that a fresh clone reproduces the same local stack.
1.2 WHEN a developer runs the documented start command THE SYSTEM SHALL bring up
    a local stack that serves authentication, with no cloud project and no
    manual configuration in a web dashboard.
1.3 THE SYSTEM SHALL deliver every sign-in email to a local mail catcher on the
    developer's machine, so that a full sign-in can be completed without leaving
    it.
1.4 THE SYSTEM SHALL read the address and the browser-safe key of its Supabase
    instance from environment variables, never from values committed to the
    repository.
1.5 THE SYSTEM SHALL commit an example environment file naming every variable
    the app needs, carrying the local defaults.
1.6 THE SYSTEM SHALL NOT expose any Supabase secret or privileged key to the
    browser bundle.
1.7 THE SYSTEM SHALL document, in the repository, the commands to start, stop and
    reset the local stack, and where to read the captured emails.
1.8 IF a required environment variable is missing when the app starts THEN THE
    SYSTEM SHALL fail with a message naming the missing variable, rather than
    failing later as an unexplained authentication error.

### Requirement 2 — Asking for a code

**User story:** As a person opening the app for the first time, I want to sign in
by typing only my email, so that I do not have to invent or remember a password.

**Acceptance criteria**

2.1 WHEN a person without a session opens the app THE SYSTEM SHALL show "la
    entrada" on its email step, with the email field focused and the email
    keyboard presented.
2.2 WHEN the person submits a syntactically valid email address THE SYSTEM SHALL
    send a single-use code to that address and advance to the code step.
2.3 IF the submitted address is empty or not a valid email address THEN THE
    SYSTEM SHALL keep the person on the email step and show an inline message in
    Spanish, without contacting the server.
2.4 THE SYSTEM SHALL respond identically whether or not the address already has
    an account, so that "la entrada" cannot be used to discover who is
    registered.
2.5 WHEN a code is requested for an address with no account THE SYSTEM SHALL
    create the account on first successful sign-in, with no separate sign-up
    flow.
2.6 WHILE a code request is in flight THE SYSTEM SHALL disable the submit control
    so that one impatient double-tap cannot send two codes.
2.7 IF the auth service refuses the request because codes have been requested too
    often THEN THE SYSTEM SHALL say so in Spanish, state how long to wait, and
    keep the typed address on screen.

### Requirement 3 — Entering the code

**User story:** As a person who just received a code, I want to type it and be
in, so that signing in stays a single short interruption.

**Acceptance criteria**

3.1 WHEN the code step opens THE SYSTEM SHALL show the address the code was sent
    to, and offer a way back to the email step to correct it.
3.2 THE SYSTEM SHALL accept a six-digit numeric code and SHALL present that field
    with the numeric keypad.
3.3 WHEN the person submits a correct, unexpired code THE SYSTEM SHALL establish
    a session and show "el libro".
3.4 IF the submitted code is wrong THEN THE SYSTEM SHALL keep the person on the
    code step, clear the field, and show a Spanish message inviting another try.
3.5 IF the submitted code has expired THEN THE SYSTEM SHALL say so in Spanish and
    offer to send a new one.
3.6 WHEN the person asks for a new code THE SYSTEM SHALL send one and SHALL
    refuse a further request until a stated cooldown has passed.
3.7 THE SYSTEM SHALL NOT reveal, in any message, whether a failed attempt failed
    because of the code or because of the address.

### Requirement 4 — The book is behind the account

**User story:** As the owner of this book, I want my expenses to be unreachable
without signing in, so that the app is a private place and not a public page.

**Acceptance criteria**

4.1 WHILE there is no valid session THE SYSTEM SHALL show "la entrada" for every
    route of the app.
4.2 WHILE there is no valid session THE SYSTEM SHALL NOT render "el libro" nor
    any expense figure, not even briefly.
4.3 WHEN a person with a valid session opens the app THE SYSTEM SHALL show "el
    libro" directly, with no visible flash of "la entrada" first.
4.4 THE SYSTEM SHALL determine whether a session exists before it paints either
    screen, so that neither screen appears and is then replaced.
4.5 THE SYSTEM SHALL make the signed-in account's identity available to the rest
    of the application, so that a later feature can attach data to it.

### Requirement 5 — Staying signed in

**User story:** As someone who records expenses several times a day, I want to
sign in once and stay in, so that logging a coffee never turns into a login.

**Acceptance criteria**

5.1 WHEN the page is reloaded with a valid session THE SYSTEM SHALL keep the
    person signed in.
5.2 WHEN the app is closed and reopened, including from the installed
    home-screen icon, THE SYSTEM SHALL keep the person signed in until the
    session expires.
5.3 WHILE a session is approaching expiry THE SYSTEM SHALL renew it without
    interrupting whatever the person is doing.
5.4 THE SYSTEM SHALL present the same session to the server-rendered and the
    client-rendered parts of the app, so that both agree on who is signed in.
5.5 IF the session has expired or been revoked THEN THE SYSTEM SHALL return the
    person to "la entrada".
5.6 IF the session ends while "el libro" is on screen THEN THE SYSTEM SHALL
    remove "el libro" from view rather than leaving stale figures visible.

### Requirement 6 — Signing out

**User story:** As someone handing my phone to a friend, I want to sign out, so
that my spending is not one tap away from whoever is holding it.

**Acceptance criteria**

6.1 WHILE signed in THE SYSTEM SHALL offer a `"Cerrar sesión"` control reachable
    from "el libro", and SHALL show the signed-in address alongside it.
6.2 WHEN the person confirms signing out THE SYSTEM SHALL end the session and
    show "la entrada".
6.3 WHEN a session ends THE SYSTEM SHALL discard the in-memory book state, so
    that the next person to sign in on that device does not see the previous
    one's screen.
6.4 IF signing out fails against the server THEN THE SYSTEM SHALL still discard
    the local session and show "la entrada", because failing closed is the safe
    direction.

### Requirement 7 — "La entrada" looks like the rest of the app

**User story:** As a Colombian user on a phone, I want the sign-in screen to look
and read like the book it guards, so that it feels like the same product.

**Acceptance criteria**

7.1 THE SYSTEM SHALL lay out "la entrada" for a 390px-wide viewport as the base
    case, and SHALL centre it in a column no wider than 390px on wider screens.
7.2 THE SYSTEM SHALL use only the colour, typography, spacing and radius tokens
    defined in `docs/mockups/v1.pen`.
7.3 THE SYSTEM SHALL render the six-digit code in the numeric font token, and the
    rest of "la entrada" in the UI font token.
7.4 THE SYSTEM SHALL write every word of "la entrada" in Colombian Spanish.
7.5 WHILE a request is in flight THE SYSTEM SHALL show the busy state on the
    control the person activated, rather than replacing the screen with a
    full-page loader.
7.6 IF an error must be shown THEN THE SYSTEM SHALL show it inline next to what
    caused it, in Spanish, with no technical detail and no untranslated text
    from the auth provider.

### Requirement 8 — When the auth service cannot be reached

**User story:** As a person whose connection just dropped, I want to be told what
happened, so that I am not staring at a screen that silently does nothing.

**Acceptance criteria**

8.1 IF the app cannot reach the auth service THEN THE SYSTEM SHALL show a Spanish
    message saying the service is unavailable and offer to retry, rather than
    failing silently or surfacing an unhandled error.
8.2 IF a request to the auth service does not answer within a stated timeout THEN
    THE SYSTEM SHALL stop waiting and follow 8.1.
8.3 WHERE the app is running in development, IF the auth service cannot be
    reached THEN THE SYSTEM SHALL name the stopped local stack as the likely
    cause.
8.4 IF a request fails THEN THE SYSTEM SHALL leave the person on the step they
    were on, preserving what they had typed.

## Out of scope

- **Persisting expenses in the database** — deliberately deferred. After this
  feature the book still lives in memory and still resets on reload; only the
  account is real. This is the single largest exclusion, and the reason the spec
  is small.
- **Row-level security policies for expense data** — there is no expense data in
  the database yet to protect. Those belong with the persistence spec, written
  against the tables they guard.
- **Seeding data into the local database** — nothing to seed while expenses are
  not stored. `SEED_EXPENSES` stays in `lib/seed.ts` exactly as it is.
- **Passwords, and social or phone sign-in** — one method, chosen for having the
  fewest failure modes to specify. Adding a second is a later decision.
- **Anonymous sessions and account linking** — considered and rejected for this
  round: it doubles the state model to save one screen.
- **A separate sign-up flow** — the first successful sign-in creates the account
  (2.5).
- **Profiles: display name, avatar, preferences** — nothing in the product needs
  them yet.
- **Managing sessions across devices** — no device list, no "cerrar sesión en
  todos lados".
- **Account deletion and data export** — real obligations, but not on the path to
  a working sign-in.
- **A hosted Supabase project, deployment, custom SMTP and email design** — this
  feature targets the local stack only.
- **Signing in without a connection** — a code has to be requested from
  somewhere.

## Open questions

- **A six-digit code, or a magic link?** — *Decided as a code; needs the author's
  confirmation.* Both are the same Supabase mechanism and the choice is
  reversible, but it is a real fork and it shapes Requirement 3 entirely. The
  code was chosen because the app is mobile-first and installable: a link tapped
  inside a mail app opens in that app's in-app browser, which lands the session
  in a browser the person was not using, leaving them still signed out where they
  started. A code is typed into the tab that is already open, so the session
  lands where it was asked for — and during development it is read straight out
  of the local mail catcher. Flip this at the review and Requirement 3 gets
  rewritten around a callback instead. — **Author** — blocks Requirement 3 and
  the design.
- **There is no mockup for "la entrada".** `docs/mockups/v1.pen` holds two
  frames, both of them the book (`zKnc1`, `s2nLha`). Either a frame gets drawn
  before implementation, or the screen is derived from the tokens and reviewed in
  the browser. — **Author** — blocks the visual half of Requirement 7.
- **Where does `"Cerrar sesión"` live?** The book header currently holds only the
  month stepper; v1 removed the search icon (criterion 8.7 of the prototype
  spec), which leaves exactly one free slot on the right of the header. Using it
  is the obvious answer, but it is a design decision on a screen that was already
  reviewed. — **Author** — blocks criterion 6.1.
- **How long should a session last before it forces a fresh sign-in?** Supabase's
  default is a long-lived refresh token, which suits a personal expense app. A
  shorter ceiling is a security choice nobody has made yet. — **Author** — blocks
  criterion 5.2 being testable against a number.
