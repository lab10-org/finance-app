# Tasks — Supabase Auth sign-in

**Status:** In progress
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

## Status legend

| Mark | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done and verified |
| `[!]` | Blocked — see the task's Decision log |

## Task overview

- [x] T1 — The local Supabase stack, under version control
- [x] T2 — The environment contract and the Supabase clients
- [x] T3 — Re-scope the v1 network guard to expense data
- [ ] T4 — Auth failures and their Spanish messages
- [ ] T5 — The `AuthClient` seam over Supabase
- [ ] T6 — The "la entrada" state machine
- [ ] T7 — "La entrada": the email step
- [ ] T8 — "La entrada": the code step
- [ ] T9 — "La entrada": layout, tokens and copy at 390px
- [ ] T10 — The route decision and `proxy.ts`
- [ ] T11 — The server session and the gated routes
- [ ] T12 — Session context and the session guard
- [ ] T13 — `"Cerrar sesión"` in the book header
- [ ] T14 — Document the local stack and run the manual pass

## Requirements coverage

| Acceptance criterion | Task(s) |
|---|---|
| 1.1 | T1 |
| 1.2 | T1, T14 |
| 1.3 | T1, T14 |
| 1.4 | T2 |
| 1.5 | T2 |
| 1.6 | T2, T3 |
| 1.7 | T14 |
| 1.8 | T2 |
| 2.1 | T7, T11 |
| 2.2 | T5, T7 |
| 2.3 | T6, T7 |
| 2.4 | T5, T14 |
| 2.5 | T1, T5, T14 |
| 2.6 | T6, T7 |
| 2.7 | T4, T6, T8 |
| 3.1 | T8 |
| 3.2 | T1, T8 |
| 3.3 | T5, T8, T11 |
| 3.4 | T6, T8 |
| 3.5 | T6, T8 |
| 3.6 | T1, T6, T8 |
| 3.7 | T4, T8 |
| 4.1 | T10 |
| 4.2 | T10, T11 |
| 4.3 | T10, T11 |
| 4.4 | T11 |
| 4.5 | T11, T12 |
| 5.1 | T10, T11 |
| 5.2 | T1, T14 |
| 5.3 | T10 |
| 5.4 | T2, T10 |
| 5.5 | T10, T12 |
| 5.6 | T12 |
| 6.1 | T13 |
| 6.2 | T13 |
| 6.3 | T12, T13 |
| 6.4 | T5, T13 |
| 7.1 | T9 |
| 7.2 | T3, T9 |
| 7.3 | T8, T9 |
| 7.4 | T7, T8, T9 |
| 7.5 | T7, T8 |
| 7.6 | T4, T7, T8 |
| 8.1 | T4, T5 |
| 8.2 | T4, T5 |
| 8.3 | T4 |
| 8.4 | T6 |

## Tasks

### T1 — The local Supabase stack, under version control

- **Status:** `[x]`
- **Traces to:** 1.1, 1.2, 1.3, 2.5, 3.2, 3.6, 5.2 — `supabase/config.toml`,
  `supabase/templates/magic_link.html`, `lib/auth/config.ts`
- **Depends on:** none
- **Objective:** a fresh clone can run `supabase start` and get an auth service
  that emails a six-digit code to a local catcher, with every number the UI will
  quote fixed in a committed file.

**TDD plan**

1. **Test (red):** add `lib/auth/__tests__/config.test.ts`. It reads
   `supabase/config.toml` from `process.cwd()` and asserts:
   `[auth.email] otp_length` equals `CODE_LENGTH` (6); `otp_expiry` equals
   `CODE_TTL_SECONDS` (600); `max_frequency` equals `"60s"` and matches
   `RESEND_COOLDOWN_SECONDS`; `[auth] enable_signup` and
   `[auth.email] enable_signup` are both `true`; `[local_smtp] enabled` is
   `true` with `port = 54324`; and
   `[auth.email.template.magic_link].content_path` names a file that exists and
   contains `{{ .Token }}`. Parse with a small regex helper — do not add a TOML
   dependency for one test. It fails: neither `supabase/` nor
   `lib/auth/config.ts` exists.
2. **Implement (green):** run `supabase init` at the repository root. Edit the
   generated `supabase/config.toml` to set the keys listed in the *Data models*
   section of `design.md`, leaving `jwt_expiry`, `enable_refresh_token_rotation`
   and the refresh-token lifetime at their defaults (5.2). Add
   `supabase/templates/magic_link.html` — Spanish, printing `{{ .Token }}` as
   the code and no link. Add `lib/auth/config.ts` with the four constants.
   Commit `supabase/` (the CLI's generated `.gitignore` inside it already
   excludes the volume data).
3. **Verify:** `npm run typecheck` and `npm test`. Bringing the stack up is
   **manual and deferred to T14**, because it needs the Docker daemon running
   and pulls several gigabytes of images: `supabase start`, then confirm the
   printed API URL is `http://127.0.0.1:54321` and Mailpit answers at
   `http://127.0.0.1:54324`.

**Decision log**

- The CLI 2.110 defaults confirmed the planner's correction to the brief:
  `[local_smtp]` already ships `enabled = true` and `port = 54324`, and
  `site_url` is already `http://127.0.0.1:3000`, so neither needed touching.
  Only `max_frequency` (`"1s"` → `"60s"`) and `otp_expiry` (`3600` → `600`)
  were changed, plus the new `[auth.email.template.magic_link]` section.
- The template test strips HTML comments before asserting the absence of
  `{{ .ConfirmationURL }}`. The first version failed on the template's own
  prose explaining why the link is gone — the assertion is about what GoTrue
  renders, not about what the file documents.

**Outcome**

Done. `supabase/config.toml`, `supabase/templates/magic_link.html` and
`lib/auth/config.ts` are committed; `supabase/.gitignore` generated by the CLI
already excludes the volume data. 8 new tests, suite at 165 passing.
Bringing the stack up remains deferred to T14.

### T2 — The environment contract and the Supabase clients

- **Status:** `[x]`
- **Traces to:** 1.4, 1.5, 1.6, 1.8, 5.4 — `lib/supabase/env.ts`,
  `lib/supabase/browser.ts`, `lib/supabase/server.ts`, `.env.example`
- **Depends on:** T1
- **Objective:** the app can build a Supabase client on either side of the
  render boundary, both reading the same cookies, and refuses to start with a
  clear message when a variable is missing.

**TDD plan**

1. **Test (red):** add `lib/supabase/__tests__/env.test.ts` — `readSupabaseEnv`
   returns both values from a complete source; throws `MissingEnvError` naming
   `NEXT_PUBLIC_SUPABASE_URL` when only that is absent, and naming
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` when only that is; treats `""` as absent. Add
   `lib/supabase/__tests__/no-secret-keys.test.ts` — a source scan over `app`,
   `components`, `lib`, `state` finds no `SERVICE_ROLE`, `SECRET_KEY` or
   `JWT_SECRET` identifier, and `.env.example` exists and declares only
   `NEXT_PUBLIC_`-prefixed variables.
2. **Implement (green):** `npm install @supabase/ssr @supabase/supabase-js`.
   Write `lib/supabase/env.ts` reading the two variables as **literal**
   `process.env.NEXT_PUBLIC_*` member expressions. Write
   `lib/supabase/browser.ts` (`createBrowserClient`) and `lib/supabase/server.ts`
   with both factories from `design.md`, using the `getAll` / `setAll` cookie
   adapter and the `try/catch` no-op `setAll` for the `next/headers` variant.
   Add `.env.example` with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY=` carrying a comment pointing at
   `supabase status`. `.gitignore` already excludes `.env*.local`; confirm, do
   not duplicate.
3. **Verify:** `npm run typecheck` and `npm test`.

**Decision log**

- Installed `@supabase/ssr@0.12.6` and `@supabase/supabase-js@2.115.0`.
- `readSupabaseEnv` treats whitespace-only as absent, not just `""`. The
  assumption the planner flagged about the variable name held: no rename was
  needed, though the actual value can only be confirmed once `supabase status`
  runs in T14.
- The internal helper was renamed from `require` to `requireVar`; the first
  version shadowed Node's global.

**Outcome**

Done. `lib/supabase/env.ts`, `browser.ts`, `server.ts` and `.env.example` are in
place, with 14 new tests. `.gitignore` already excluded `.env*.local`, so
nothing was duplicated.

### T3 — Re-scope the v1 network guard to expense data

- **Status:** `[x]`
- **Traces to:** 1.6, 7.2 — `app/__tests__/no-stray-colours.test.ts`
- **Depends on:** T2
- **Objective:** the guard that encodes v1's criterion 10.5 asserts something
  that is still true, instead of passing by accident.

**TDD plan**

1. **Test (red):** in `app/__tests__/no-stray-colours.test.ts`, rename the
   second describe block from `"no network surface at all (10.5)"` to
   `"no expense data leaves the device (10.5)"` and narrow its file set to
   `components/book`, `components/sheet`, `state` and `lib/domain` plus
   `lib/seed.ts`, explicitly exempting `lib/supabase`, `lib/auth` and
   `components/entrada`. Add a new assertion that fails today: the exempted
   directories are the *only* places a Supabase import may appear, and no file
   under the scanned set imports from `@supabase/*` or `@/lib/supabase`. Leave
   the three colour assertions of the first describe block untouched — they are
   what enforces 7.2 for the screens T7–T9 add.
2. **Implement (green):** implement the exemption list and the new import
   assertion; add a comment above the block recording that this feature
   introduced an auth network surface and that 10.5 now means expense data
   only.
3. **Verify:** `npm run typecheck` and `npm test` — every v1 test must still
   pass, including the colour assertions.

**Decision log**

- The design predicted the old guard would keep passing "by accident". It did
  not: after T2 it failed on `"persists nothing in the browser"`, matching the
  word `localStorage` inside a *comment* in `lib/supabase/browser.ts` explaining
  why the session uses cookies instead. That the guard cannot tell prose from
  code is a sharper argument for re-scoping it than the one the design gave.
- The third assertion — Supabase imports only from the exempt directories —
  constrains T12: `SessionGuard`'s real `subscribe` cannot import the Supabase
  client from `components/book`. The adapter will live in `lib/auth/` and
  `BookApp` will import that instead, which keeps the whitelist honest rather
  than widening it.

**Outcome**

Done. The block is now `"no expense data leaves the device (10.5)"`, scanning
`components/book`, `components/sheet`, `state`, `lib/domain` and `lib/seed.ts`,
with `lib/supabase`, `lib/auth` and `components/entrada` exempt by name. The
three colour assertions were left untouched and still cover `components/entrada`
for free. Suite at 180 passing.

### T4 — Auth failures and their Spanish messages

- **Status:** `[ ]`
- **Traces to:** 2.7, 3.4, 3.5, 3.7, 7.4, 7.6, 8.1, 8.2, 8.3 —
  `lib/auth/errors.ts`, `lib/auth/validate-email.ts`, `lib/auth/types.ts`
- **Depends on:** T1
- **Objective:** every way the auth service can fail has exactly one Spanish
  sentence, and no provider text can reach the screen.

**TDD plan**

1. **Test (red):** add `lib/auth/__tests__/errors.test.ts` — `toAuthFailure`
   maps an object shaped like a 429 `AuthApiError` to `rate-limited`, a
   `TypeError("Failed to fetch")` to `unreachable`, a `TimeoutError` to
   `timeout`, an error whose message is `"Token has expired or is invalid"` to
   `code-unverified`, and `{}` to `unknown`. `describeFailure` returns a
   non-empty Spanish string for every `kind` (drive it from an exhaustive array
   so a new kind fails the test), includes `"supabase start"` only when
   `isDevelopment` is true, mentions `RESEND_COOLDOWN_SECONDS` for
   `rate-limited`, and never mentions an address for any kind. Add
   `lib/auth/__tests__/validate-email.test.ts` for the accept/reject table in
   `design.md`.
2. **Implement (green):** write `lib/auth/types.ts` (`SessionUser`),
   `lib/auth/errors.ts` and `lib/auth/validate-email.ts`. Use the copy from the
   *Error handling* table of `design.md` verbatim.
3. **Verify:** `npm run typecheck` and `npm test`.

**Decision log**

**Outcome**

### T5 — The `AuthClient` seam over Supabase

- **Status:** `[ ]`
- **Traces to:** 2.2, 2.4, 2.5, 3.3, 6.4, 8.1, 8.2 — `lib/auth/auth-client.ts`
- **Depends on:** T2, T4
- **Objective:** the three auth operations exist as a `Result`-returning
  interface that never throws, with a timeout, so every screen above it can be
  tested with a fake.

**TDD plan**

1. **Test (red):** add `lib/auth/__tests__/auth-client.test.ts` driving
   `createSupabaseAuthClient` over an injected stub Supabase client:
   `requestCode` calls `signInWithOtp` with `{ email, options: {
   shouldCreateUser: true } }` and returns `{ ok: true }`; `verifyCode` calls
   `verifyOtp` with `{ email, token, type: "email" }` and maps the returned user
   to `SessionUser`; a rejection becomes `{ ok: false, failure }` rather than a
   throw; `signOut` retries with `{ scope: "local" }` when the first call
   rejects and still reports `ok: true`. Add `withTimeout` tests: a promise that
   never settles rejects after `AUTH_TIMEOUT_MS` under fake timers, and a fast
   promise passes through.
2. **Implement (green):** write `lib/auth/auth-client.ts`. Give
   `createSupabaseAuthClient` an optional client parameter defaulting to
   `createSupabaseBrowserClient()`, so the test injects without `vi.mock`. Wrap
   every call in `withTimeout` and `toAuthFailure`.
3. **Verify:** `npm run typecheck` and `npm test`.

**Decision log**

**Outcome**

### T6 — The "la entrada" state machine

- **Status:** `[ ]`
- **Traces to:** 2.3, 2.6, 2.7, 3.1, 3.4, 3.5, 3.6, 8.4 —
  `lib/auth/entrada-machine.ts`
- **Depends on:** T4
- **Objective:** every transition of the two-step screen is decided by a pure
  reducer, including the two rules the provider cannot give us: which failure is
  an expiry, and when a resend is allowed.

**TDD plan**

1. **Test (red):** add `lib/auth/__tests__/entrada-machine.test.ts` —
   `submitEmail` with an invalid address sets `failure` and leaves `status`
   `"idle"` and `step` `"email"`; with a valid one sets `status` `"sending"`;
   a second `submitEmail` while `"sending"` is ignored (2.6); `codeSent` moves
   to `"code"` and records `codeSentAt`; `failed` never changes `step` and never
   clears `email`, for every failure kind (8.4); `failed` with a
   `code-unverified` refines to `code-rejected` before the TTL and to
   `code-expired` after it, clearing `code` only in the former case; `resend` is
   ignored while `cooldownRemaining > 0`; `backToEmail` returns to `"email"`
   keeping the address; `editCode` drops non-digits and truncates at
   `CODE_LENGTH`. Table-test `cooldownRemaining` and `codeHasExpired` at 0, 59,
   60, 599 and 601 seconds.
2. **Implement (green):** write `lib/auth/entrada-machine.ts` with the state,
   actions and two selectors from `design.md`. The reducer takes `now` on the
   actions that need it so it stays pure.
3. **Verify:** `npm run typecheck` and `npm test`.

**Decision log**

**Outcome**

### T7 — "La entrada": the email step

- **Status:** `[ ]`
- **Traces to:** 2.1, 2.2, 2.3, 2.6, 7.4, 7.5, 7.6 —
  `components/entrada/Entrada.tsx`, `components/entrada/EmailStep.tsx`
- **Depends on:** T5, T6
- **Objective:** a person can type an address and get to the code step, and
  cannot send two codes with one impatient double-tap.

**TDD plan**

1. **Test (red):** add `components/entrada/__tests__/email-step.test.tsx`
   rendering `<Entrada client={fake} onSignedIn={spy} now={() => t} />` with a
   hand-written fake `AuthClient` — the email input is focused on mount and
   carries `type="email"` and `inputMode="email"` (2.1); submitting
   `"juanse@lab10.ai"` calls `fake.requestCode` once and advances to the code
   step (2.2); submitting `""` and `"no-es-correo"` shows the inline Spanish
   message and never calls the fake (2.3); while a deferred `requestCode` is in
   flight the submit control is disabled and reads `"Enviando…"`, and a second
   click does not call the fake again (2.6, 7.5).
2. **Implement (green):** write `components/entrada/Entrada.tsx` (the reducer,
   the effects that call the client, `describeFailure` for the inline message)
   and `components/entrada/EmailStep.tsx`. Styling is T9; use the CSS Module
   file with structural classes only for now.
3. **Verify:** `npm run typecheck` and `npm test`.

**Decision log**

**Outcome**

### T8 — "La entrada": the code step

- **Status:** `[ ]`
- **Traces to:** 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 7.3, 7.4, 7.5, 7.6 —
  `components/entrada/CodeStep.tsx`
- **Depends on:** T7
- **Objective:** a person can type the six digits and be in, and every way that
  can fail says the right thing in Spanish without revealing which half was
  wrong.

**TDD plan**

1. **Test (red):** add `components/entrada/__tests__/code-step.test.tsx` — the
   step shows the address the code went to and a `"Cambiar correo"` control that
   returns to the email step with the address preserved (3.1); the code input
   carries `inputMode="numeric"`, `maxLength={6}` and the `.num` class (3.2,
   7.3); a correct code calls `onSignedIn` once (3.3); a rejected code within
   the TTL clears the field and shows the retry message (3.4); the same failure
   past the TTL shows the expiry message and enables the resend (3.5); the
   resend control is disabled with a countdown label right after a send and
   enabled once the injected clock passes `RESEND_COOLDOWN_SECONDS` (3.6); a
   `rate-limited` failure states the wait in Spanish and keeps the screen (2.7);
   no message anywhere contains the address or the word `"correo"` on a code
   failure (3.7).
2. **Implement (green):** write `components/entrada/CodeStep.tsx` and wire the
   verify, resend and back paths in `Entrada.tsx`.
3. **Verify:** `npm run typecheck` and `npm test`.

**Decision log**

**Outcome**

### T9 — "La entrada": layout, tokens and copy at 390px

- **Status:** `[ ]`
- **Traces to:** 7.1, 7.2, 7.3, 7.4 — `components/entrada/Entrada.module.css`
- **Depends on:** T7, T8
- **Objective:** the sign-in screen reads as the same product as the book at
  390px, using nothing but the token table.

**TDD plan**

1. **Test (red):** add `components/entrada/__tests__/entrada-layout.test.ts`
   reading `Entrada.module.css` and asserting the column is
   `max-width: 390px` with `margin-inline: auto` (7.1), that the code field
   rule uses `var(--font-num)` (7.3), and that the file declares no raw hex —
   the last one is also covered globally by
   `app/__tests__/no-stray-colours.test.ts`, which now walks
   `components/entrada` for free (7.2). Add an assertion over the rendered
   entrada that every visible string is in the Spanish copy table (7.4).
2. **Implement (green):** write the stylesheet against `app/globals.css` tokens
   only — `--bg`, `--surface`, `--border`, `--text-primary`,
   `--text-secondary`, `--accent`, `--screen-pad`, `--radius-card`. Derive any
   tone with `color-mix`, as `ExpenseSheet.module.css` already does; introduce
   no new hex. Review at 390px in the browser with `npm run dev`.
3. **Verify:** `npm run typecheck` and `npm test`, plus a visual check at 390px
   and at 1280px under `npm run dev`.

**Decision log**

**Outcome**

### T10 — The route decision and `proxy.ts`

- **Status:** `[ ]`
- **Traces to:** 4.1, 4.2, 4.3, 5.1, 5.3, 5.4, 5.5 —
  `lib/auth/route-decision.ts`, `proxy.ts`
- **Depends on:** T2
- **Objective:** every request is refreshed and routed before it renders, from a
  decision that is itself a tested pure function.

**TDD plan**

1. **Test (red):** add `lib/auth/__tests__/route-decision.test.ts` covering the
   matrix — no session on `/`, `/entrada`, `/cualquier-otra`, `/manifest.json`;
   session on the same set. No session anywhere but `/entrada` redirects to
   `/entrada` (4.1); a session on `/entrada` redirects to `/` (4.3); everything
   else continues. Add a test asserting `proxy.ts` exists at the repository
   root, exports a function named `proxy` and a `config.matcher`, and — this is
   the Next 16 trap — that the file contains no `runtime` export and no
   `"middleware"` identifier.
2. **Implement (green):** write `lib/auth/route-decision.ts`, then `proxy.ts` at
   the repository root: create `NextResponse.next({ request })`, build the proxy
   client against it, `await supabase.auth.getClaims()`, call `decideRoute`, and
   on a redirect **copy `response.cookies.getAll()` onto the redirect response**
   before returning it. Export `config.matcher` as in `design.md`.
3. **Verify:** `npm run typecheck` and `npm test`. Confirm the file is picked up
   with `npm run build` — Next logs the proxy in its route table, and would warn
   about a deprecated `middleware.ts`.

**Decision log**

**Outcome**

### T11 — The server session and the gated routes

- **Status:** `[ ]`
- **Traces to:** 2.1, 3.3, 4.2, 4.3, 4.4, 4.5, 5.1 — `lib/auth/session.ts`,
  `app/page.tsx`, `app/entrada/page.tsx`, `components/book/BookMount.tsx`,
  `components/entrada/EntradaMount.tsx`
- **Depends on:** T9, T10
- **Objective:** `/` never produces a byte of the book without a session, and
  `/entrada` never renders for someone who already has one.

**TDD plan**

1. **Test (red):** add `app/__tests__/route-gate.test.ts` — a source-level test,
   because a Server Component with `next/headers` cannot be rendered under
   jsdom. Assert that `app/page.tsx` has no `"use client"` directive, awaits
   `requireSessionUser`, and contains no `dynamic(` call; that
   `components/book/BookMount.tsx` does have `"use client"` and holds the
   `dynamic(..., { ssr: false })` import (4.4); and that
   `app/entrada/page.tsx` calls `getSessionUser` and `redirect`. Add
   `lib/auth/__tests__/session.test.ts` over an injected Supabase stub —
   `getSessionUser` returns `{ id, email }` from claims, `null` when there are
   none, and falls back to `getUser()` when the claims carry no `email` (4.5).
2. **Implement (green):** write `lib/auth/session.ts` with `server-only` and
   React `cache`. Rewrite `app/page.tsx` as an async Server Component calling
   `requireSessionUser()`. Move the `dynamic(..., { ssr: false })` call into the
   new `components/book/BookMount.tsx`, passing `user` through. Add
   `app/entrada/page.tsx` and `components/entrada/EntradaMount.tsx`, which
   builds the real `AuthClient` and navigates on `onSignedIn`.
3. **Verify:** `npm run typecheck` and `npm test`, plus `npm run build` to
   confirm `/` is a dynamic route and no `ssr: false` error is raised from a
   Server Component.

**Decision log**

**Outcome**

### T12 — Session context and the session guard

- **Status:** `[ ]`
- **Traces to:** 4.5, 5.5, 5.6, 6.3 — `state/session-context.tsx`,
  `components/book/SessionGuard.tsx`, `components/book/BookApp.tsx`
- **Depends on:** T11
- **Objective:** the signed-in identity is available to the book, and the book
  leaves the screen the moment the session does.

**TDD plan**

1. **Test (red):** add `state/__tests__/session-context.test.tsx` —
   `useSession()` returns the value inside a provider and `null` outside one,
   without throwing (4.5). Add
   `components/__tests__/session-guard.test.tsx` — `SessionGuard` renders its
   children, and once the injected `subscribe` callback fires, the children are
   gone from the DOM and `onSessionEnded` has been called exactly once (5.5,
   5.6); unmounting calls the returned unsubscribe. Add a test that `BookApp`
   rendered with `user.id = "a"`, edited, then re-rendered with `user.id = "b"`
   shows the seeded month rather than the edit (6.3).
2. **Implement (green):** write `state/session-context.tsx` and
   `components/book/SessionGuard.tsx`. Rewrite `components/book/BookApp.tsx` to
   take `user`, build the `AuthClient` once with `useMemo`, provide
   `{ user, signOut }`, wrap in `SessionGuard` whose real `subscribe` adapts
   `supabase.auth.onAuthStateChange`, and key `BookProvider` by `user.id`.
3. **Verify:** `npm run typecheck` and `npm test`.

**Decision log**

**Outcome**

### T13 — `"Cerrar sesión"` in the book header

- **Status:** `[ ]`
- **Traces to:** 6.1, 6.2, 6.3, 6.4 — `components/book/AccountControl.tsx`,
  `components/book/ConfirmSignOut.tsx`, `components/book/MonthHeader.tsx`,
  `components/book/BookScreen.tsx`
- **Depends on:** T12
- **Objective:** a person can hand over their phone and get out of their book in
  two taps, and it works even when the server does not.

**TDD plan**

1. **Test (red):** add `components/__tests__/sign-out.test.tsx` rendering
   `BookScreen` inside a `SessionProvider` with a fake `signOut` — the header
   shows the signed-in address and a `"Cerrar sesión"` control (6.1); activating
   it opens the confirmation showing the full address; `"Sí, cerrar sesión"`
   calls `signOut` once (6.2); `"Cancelar"` closes it without calling anything;
   a `signOut` that rejects still results in `onSessionEnded` being reached
   (6.4). Assert the existing `month-header.test.tsx` still passes untouched —
   `MonthHeader`'s `action` prop is optional and `useSession()` returns `null`
   there.
2. **Implement (green):** add the optional `action` slot to `MonthHeader`, write
   `AccountControl` (truncated address + button, one row) and `ConfirmSignOut`
   (native `<dialog>` with `showModal()`, following `ExpenseSheet`), and pass
   `<AccountControl />` from `BookScreen`. `signOut` in the session value calls
   the client and then navigates to `/entrada` regardless of the result.
3. **Verify:** `npm run typecheck` and `npm test`.

**Decision log**

**Outcome**

### T14 — Document the local stack and run the manual pass

- **Status:** `[ ]`
- **Traces to:** 1.2, 1.3, 1.7, 2.4, 2.5, 3.3, 5.2 — `README.md`
- **Depends on:** T13
- **Objective:** a developer who has just cloned the repository can get from
  nothing to signed in by following one file, and the six criteria this test
  harness cannot reach have been checked once by hand.

**TDD plan**

1. **Test (red):** add `app/__tests__/readme.test.ts` asserting `README.md`
   exists and names `supabase start`, `supabase stop`, `supabase db reset`,
   `http://127.0.0.1:54324` and `.env.example` — a thin test, but it is what
   stops 1.7 from rotting silently.
2. **Implement (green):** write `README.md` with a "Stack local de Supabase"
   section: prerequisites (Docker running, Supabase CLI), the start / stop /
   reset commands, how to copy `.env.example` to `.env.local` and fill the anon
   key from `supabase status`, and where to read the captured emails.
3. **Verify:** `npm run typecheck` and `npm test`, then the **manual pass**,
   which needs the Docker daemon running and the stack up. Record each result in
   the Outcome below:
   - `supabase start` succeeds from a clean checkout with no dashboard step — 1.2
   - `npm run dev`, request a code, and read it in Mailpit at
     `http://127.0.0.1:54324`; it is six digits and there is no link — 1.3
   - the code signs in an address that had no account, and a second sign-in with
     the same address behaves identically — 2.4, 2.5, 3.3
   - install to the home screen, close, reopen the next day: still signed
     in — 5.2
   - `supabase stop` and `supabase db reset` behave as the README says — 1.7

**Decision log**

**Outcome**

## Open items

- Nothing yet. Anything discovered during execution that no task above covers —
  deferred work, follow-ups, questions raised by the implementation — is
  recorded here as it is found.
