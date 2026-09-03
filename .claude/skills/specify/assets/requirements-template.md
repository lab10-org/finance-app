# Requirements — <Feature Name>

**Status:** <Draft | In review | Approved>
**Date:** <YYYY-MM-DD>
**Author:** <name>

## Introduction

<What problem does this feature solve, who has it, and what value does solving
it deliver? Two or three paragraphs, in business terms: what the user can do
after this exists that they cannot do today, and why that matters. Keep the
technical "how" out of this document — it belongs in design.md.>

## Glossary

<Optional. Define domain terms that are used with a specific meaning in this
document, so the design and the tests use them the same way. Quote the terms
exactly as the domain uses them. Delete this section if there is nothing to
define.>

- **<Term>** — <definition>
- **<Term>** — <definition>

## Requirements

### Requirement 1 — <short title>

**User story:** As a <role>, I want <capability>, so that <benefit>.

**Acceptance criteria**

1.1 THE SYSTEM SHALL <behavior that always holds — an invariant>
1.2 WHEN <trigger> THE SYSTEM SHALL <observable response>
1.3 WHILE <state> THE SYSTEM SHALL <sustained behavior during that state>
1.4 IF <error or edge condition> THEN THE SYSTEM SHALL <response>
1.5 WHERE <optional feature is present> THE SYSTEM SHALL <behavior>

<The five criteria above show the five EARS patterns. Use the pattern that fits
each behavior — not all five in every requirement. One behavior per criterion,
observable outcomes only, and at least one IF/THEN per requirement that can
fail.>

### Requirement 2 — <short title>

**User story:** As a <role>, I want <capability>, so that <benefit>.

**Acceptance criteria**

2.1 WHEN <trigger> THE SYSTEM SHALL <observable response>
2.2 IF <error or edge condition> THEN THE SYSTEM SHALL <response>

## Out of scope

<What this feature explicitly does NOT include, and — where it helps — one line
on why. This section is what stops scope creep: an unstated exclusion gets
re-litigated in every review, and eventually someone builds it.>

- <Excluded item> — <why, or "later">
- <Excluded item>

## Open questions

<Everything still undecided that affects the behavior. Do not resolve these by
guessing: an invented answer written as a requirement is indistinguishable from
an agreed one. Each entry: the question, who can answer it, and what it blocks.>

- <Question> — <who decides> — <what it blocks>
