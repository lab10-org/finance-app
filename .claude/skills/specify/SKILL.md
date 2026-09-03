---
name: specify
description: >-
  Requirements-First feature specification. Produces three reviewable documents,
  in order: `requirements.md` (numbered EARS acceptance criteria) → `design.md`
  (technical architecture) → `tasks.md` (an ordered TDD task list that doubles as
  the execution log) — each one written only after the user has approved the
  previous one. Use this WHENEVER the user wants to define, spec, plan, or scope a
  new feature. English trigger phrases: "spec this out", "write requirements",
  "before we build", "scope this feature", "write the spec first". Spanish trigger
  phrases: "escribir el spec", "definir la feature", "escribamos los requisitos",
  "antes de construir", "formalicemos esto antes de implementar". It also fires
  when the user never says the word "spec" but is describing a feature they want
  written down and agreed on before anyone implements it.
---

# Specify — Requirements-First

Formalize a feature in reviewable documents **before** writing code. The scope of
this skill is three artifacts:

1. **`requirements.md`** — *what* the system must do, as numbered acceptance
   criteria in EARS notation.
2. **`design.md`** — *how* it will be built: architecture, components, data
   models, error handling, testing strategy.
3. **`tasks.md`** — the design decomposed into small, verifiable tasks. It is an
   ordered checklist *and* the execution log of the implementation.

The first two define *what* and *how*; the third turns the design into work that
can be verified one step at a time.

**Why requirements come first.** Pinning down the behavior before the design
keeps the design honest: every technical decision has to trace back to a
requirement, instead of the requirements being reverse-engineered afterwards to
justify whatever got built. A design written on top of unstated behavior always
looks reasonable — it just answers a question nobody agreed on.

## Language — write the specs in English

**The three documents are written entirely in English** — headings, prose, user
stories, EARS keywords — **even when the user speaks another language.** Specs
are long-lived, shared engineering artifacts: one language makes them
consistent, searchable and portable across tools, teammates and future readers,
and it keeps the EARS keywords (SHALL, WHEN, IF/THEN, WHILE, WHERE) unambiguous.

Two exceptions:

- **Domain terms and identifiers the user gave you are quoted verbatim** —
  category names, field names, product names, UI copy, sample data. Translating
  an identifier breaks traceability: the spec would say "Other" while the code,
  the database and the mockups say `"Otros"`, and nobody can grep across them.
- **You still talk to the user in their language.** Questions, the request for
  approval, summaries and any explanation in chat go in the language the user
  writes to you in (Spanish, in this project). Only the *files* are in English.

## Where the files go

One folder per feature, dated so folders sort chronologically and never collide:

```
docs/specs/<YYYY-MM-DD>-<feature-slug>/
├── requirements.md
├── design.md
└── tasks.md
```

- `<YYYY-MM-DD>` is **today's date**. Do not invent it: read it from the
  environment (the session context states today's date) or, if it is not
  available, ask the user. A guessed date silently misorders the whole folder
  listing, which is the only thing this naming scheme buys you.
- `<feature-slug>` is short kebab-case (two to four words), naming the feature,
  not its implementation. Examples for this project:
  `docs/specs/2026-09-03-quick-expense-entry/` and
  `docs/specs/2026-09-03-monthly-category-breakdown/`.

## The workflow — and the approval gate

The documents are produced in order, with a **hard stop for human approval
between phases**. This is not ceremony, it is economics: requirements are the
cheapest thing in the stack to change, and every later decision is stacked on
top of them. Fixing the behavior now costs a paragraph; fixing it after a design
— or a task list — has been built on the wrong behavior means throwing away the
design and the task list too.

### Coming from `/brainstorming`?

When the previous phase already produced an **approved** decision or design,
that decision is resolved input. Reuse its architecture, components, data flow,
error handling and testing decisions instead of interrogating the user again.
The work here is to *formalize* what was decided, not to reopen it — re-asking
settled questions wastes the user's time and quietly invites the answers to
drift from what was agreed.

### Phase 1 — Requirements (steps 1-3)

1. **Understand enough to write.** If the idea is vague, ask a few sharp
   questions *first*: who the user is, what triggers the feature, what success
   looks like, and what the failure cases are. Few and pointed beats a
   questionnaire — each question should be one whose answer would change what
   you write.
   **Do not invent requirements to fill the silence.** An invented requirement
   is indistinguishable from an agreed one once it is on the page, so it never
   gets challenged. Anything you don't know goes into *Open questions*.
2. **Write `requirements.md`.** Copy `assets/requirements-template.md` into the
   feature folder and fill it in using EARS notation (see below). Number every
   requirement and every criterion.
3. **Stop and ask for review.** Present the requirements, say explicitly that
   the design comes next and that you are waiting for a go-ahead or changes.
   **Do not create `design.md` yet.** Iterate on the requirements until the user
   approves them.

### Phase 2 — Design (steps 4-6)

4. **Only after explicit approval**, copy `assets/design-template.md` into the
   feature folder as `design.md`.
5. **Trace everything.** Every component, data model and error path must trace
   to a numbered acceptance criterion. If the design uncovers a gap in the
   requirements — a case nobody specified — **go back and update
   `requirements.md`**, and tell the user. Designing over the hole in silence
   buries a product decision inside a technical document, where no reviewer is
   looking for it.
6. **Present and stop until approval** before decomposing anything into tasks.

### Phase 3 — Tasks (steps 7-10)

7. **Only after the design is approved**, copy `assets/tasks-template.md` into
   the feature folder as `tasks.md`.
8. **Fill it in here**, following the contract below.
9. **Present it for approval.** Then implementation runs one task at a time,
   top to bottom.
10. **Keep the three documents synchronized.** If implementation proves the
    design wrong, update `design.md` and record it in the Decision log of the
    affected task — an out-of-date design is worse than no design, because it is
    still trusted.

**The `tasks.md` contract:**

- **One TDD cycle per task** — red → green → verify — sized so a task can be
  finished and verified in one sitting. A task too big to verify is a task whose
  failure you find late.
- **Every task is traced** to the design components it builds and the
  requirement criteria it satisfies.
- **A `Requirements coverage` table** where *every* acceptance criterion maps to
  at least one task. A criterion with no task is a gap: close it before
  implementing, because it is much cheaper to notice here than in review.
- **`Decision log` and `Outcome` start empty.** They are filled in *during*
  execution, and that is exactly what makes the file a log instead of a
  checklist: the reasoning behind a non-obvious choice is worth more later than
  the checkmark.
- If requirements or design change afterwards, **re-converge `tasks.md`** —
  re-derive it from the updated documents instead of patching the old list by
  hand and hoping the coverage table still holds.

## EARS notation for acceptance criteria

EARS (Easy Approach to Requirements Syntax) makes each criterion unambiguous and
**testable**: every SHALL is a check you can write a test against. Use the
pattern that fits the behavior — do not force everything into WHEN/THEN, because
a state-driven or invariant behavior written as an event loses the very thing
that makes it correct.

| Pattern | Template | Use for |
|---|---|---|
| Ubiquitous | THE SYSTEM SHALL `<behavior>` | An invariant that always holds |
| Event-driven | WHEN `<trigger>` THE SYSTEM SHALL `<behavior>` | A response to an event or user action |
| State-driven | WHILE `<state>` THE SYSTEM SHALL `<behavior>` | Sustained behavior during a state |
| Unwanted / error | IF `<condition>` THEN THE SYSTEM SHALL `<response>` | Error handling, edge cases |
| Optional | WHERE `<feature is present>` THE SYSTEM SHALL `<behavior>` | Optional or configurable features |

Four quality rules:

1. **One behavior per criterion.** Split "validates and saves and notifies" into
   three criteria — a compound criterion can only be half-passed, and a half-passed
   criterion has no meaningful test.
2. **Observable outcomes only.** State what the system does, not how it is
   implemented internally. "Stores the expense in IndexedDB" is a design
   decision; "the expense appears in today's list after reload" is a requirement
   that survives changing the storage.
3. **Number everything** — Requirement 1 → criteria 1.1, 1.2, … — so the design,
   the tests and the review can cite an exact criterion instead of paraphrasing
   it.
4. **Cover the unhappy path.** For every WHEN, ask what happens IF the input is
   bad, missing or out of range. A spec with only happy paths hands every error
   decision to whoever writes the code, at the moment they are least equipped to
   make it.

### Worked example

User says: *"Quiero registrar un gasto en menos de 10 segundos: monto y
categoría y listo. Si no elijo categoría, que caiga en «Otros»."*

```markdown
### Requirement 1 — Quick expense entry

**User story:** As a person tracking daily spending, I want to record an expense
in under 10 seconds, so that logging expenses stays a habit instead of a chore.

**Acceptance criteria**

1.1 WHEN the user opens the quick-entry sheet THE SYSTEM SHALL focus the amount
    field with the numeric keypad open.
1.2 WHEN the user confirms an entry with an amount and a category THE SYSTEM
    SHALL save the expense dated today and show it at the top of the day's list.
1.3 IF the user confirms an entry without choosing a category THEN THE SYSTEM
    SHALL save the expense under the category "Otros".
```

Note that `"Otros"` is quoted verbatim: it is a domain identifier the user gave,
and translating it would break the trace between the spec, the UI copy and the
code.

## Templates

- `assets/requirements-template.md` — introduction, glossary, numbered
  requirements with user stories and EARS criteria, out of scope, open questions.
- `assets/design-template.md` — overview, architecture, components and
  interfaces, data models, data flow, error handling, testing strategy, design
  decisions.
- `assets/tasks-template.md` — purpose, how to use, status legend, task
  overview, requirements coverage, detailed tasks with TDD plan, decision log and
  outcome.

**Copy them into the feature folder** rather than writing from scratch: the
templates carry the section order and the prompts that make a spec reviewable,
and rewriting them from memory is how sections quietly disappear. Delete the
`<...>` placeholders as you fill each section — a placeholder left in a document
that says "Approved" is a lie about what was reviewed.

Remove a section only if it genuinely does not apply, **never to save effort**:
an empty *Error handling* or *Open questions* section almost always means nobody
thought about the unhappy path, not that there isn't one.
