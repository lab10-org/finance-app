# Tasks — <Feature Name>

**Status:** <Not started | In progress | Done>
**Date:** <YYYY-MM-DD>
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

<Flat checklist. Titles must match the detailed entries below exactly, so the
two never drift apart.>

- [ ] T1 — <title>
- [ ] T2 — <title>
- [ ] T3 — <title>

## Requirements coverage

<The completeness check, read in reverse: from each acceptance criterion to the
task(s) that satisfy it. Every criterion in requirements.md must appear here
with at least one task. An empty cell is a gap — close it before implementing,
not in review.>

| Acceptance criterion | Task(s) |
|---|---|
| 1.1 | T1 |
| 1.2 | T2 |
| 1.3 | T2, T3 |
| <...> | <...> |

## Tasks

### T1 — <title>

- **Status:** `[ ]`
- **Traces to:** <acceptance criteria, e.g. 1.1, 1.2> — <design components>
- **Depends on:** <task ids, or "none">
- **Objective:** <one sentence: what capability exists once this task is done.>

**TDD plan**

1. **Test (red):** <the failing test to write, and what it asserts>
2. **Implement (green):** <the smallest change that makes it pass>
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

<Append-only, newest entries at the bottom. Starts empty; filled in during
execution.>

- `<YYYY-MM-DD>` — <decision or finding> — <why>

**Outcome**

<Filled in when the task closes: what was delivered, which tests were added, and
anything left pending.>

### T2 — <title>

- **Status:** `[ ]`
- **Traces to:** <...>
- **Depends on:** <...>
- **Objective:** <...>

**TDD plan**

1. **Test (red):** <...>
2. **Implement (green):** <...>
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

### T3 — <title>

- **Status:** `[ ]`
- **Traces to:** <...>
- **Depends on:** <...>
- **Objective:** <...>

**TDD plan**

1. **Test (red):** <...>
2. **Implement (green):** <...>
3. **Verify:** `npm run typecheck` and `npm test`

**Decision log**

**Outcome**

## Open items

<Anything discovered during execution that is not covered by a task above:
deferred work, follow-ups, questions raised by the implementation. Empty at the
start.>

- <item> — <who or what it blocks>
