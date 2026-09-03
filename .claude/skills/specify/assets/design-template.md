# Design — <Feature Name>

**Status:** <Draft | In review | Approved>
**Date:** <YYYY-MM-DD>
**Requirements:** ./requirements.md

## Overview

<In a few paragraphs: the approach taken, and the shape of the solution at a
glance. A reader who knows the requirements should finish this section able to
predict roughly what the rest of the document says.>

## Architecture

<How the pieces fit together and where this feature sits in the app. Include a
diagram — Mermaid or ASCII — showing the components and the direction of the
data between them.>

```mermaid
<diagram: components and the flow between them>
```

<Then, in prose: the boundaries (what belongs to this feature and what it only
talks to), and any constraint from the existing codebase that shaped the
structure.>

## Components and interfaces

### <ComponentName>

- **Responsibility:** <one sentence — what this component owns. If it needs
  "and", consider splitting it.>
- **Interface:**

```ts
<concrete signatures — types, function or component props, exported API>
```

- **Traces to:** <acceptance criteria this component exists to satisfy, e.g.
  1.2, 1.4>

### <ComponentName>

- **Responsibility:** <...>
- **Interface:**

```ts
<...>
```

- **Traces to:** <...>

## Data models

<The types or schema this feature introduces or changes.>

```ts
<type / interface / schema definitions>
```

**Validation rules and invariants**

<What must always be true of this data, and what is rejected at the boundary.
Each rule should trace to an acceptance criterion — a validation rule with no
requirement behind it is a product decision being made here by accident.>

- <Rule> — traces to <criterion>
- <Invariant> — traces to <criterion>

## Data flow

<One or two end-to-end scenarios, step by step, showing how the acceptance
criteria are actually satisfied: what the user does, which component handles it,
what is stored or computed, and what comes back. Concrete steps, not a summary —
this is where a design that doesn't quite work becomes visible.>

### Scenario: <name — e.g. the happy path of Requirement 1>

1. <step> → <component> → <result>
2. <step> → <component> → <result>
3. <observable outcome — satisfies criteria <1.1, 1.2>>

### Scenario: <name — e.g. an error path>

1. <step>
2. <observable outcome — satisfies criterion <1.4>>

## Error handling

<One row per failure condition. Every IF/THEN criterion in requirements.md must
appear here; anything here without a related requirement is an error case the
requirements missed — go back and add it.>

| Condition | Handling | Related requirement |
|---|---|---|
| <what goes wrong> | <what the system does, and what the user sees> | <criterion, e.g. 1.4> |
| <what goes wrong> | <...> | <...> |

## Testing strategy

<Every acceptance criterion must be traceable to at least one test below. A
criterion with no test is a criterion nobody will notice breaking.>

**Unit**

- <what is tested, at what level> — covers <criteria>

**Edge cases**

- <boundary, empty, malformed, out-of-range input> — covers <criteria>

**Integration**

- <end-to-end path through the components> — covers <criteria>

## Design decisions and trade-offs

<Record the reasoning, not just the outcome: six months from now the question
will be "why not the other thing", and only this section answers it.>

### <Decision — the choice made>

- **Rationale:** <why this one, in terms of the requirements and constraints>
- **Alternative considered:** <what was rejected, and what it would have cost>

### <Decision — the choice made>

- **Rationale:** <...>
- **Alternative considered:** <...>
