# Architecture Decision Records (ADRs)

## Purpose

ADRs document significant architectural and technical decisions for the project. They provide context for why decisions were made and help future contributors understand the rationale.

---

## When to Write an ADR

- Choosing a framework, library, or tool
- Defining a data model or schema
- Establishing a pattern or convention
- Making a trade-off between approaches
- Any decision that would be costly to reverse

---

## ADR Template

Create a new file: `ADR-NNN-short-title.md`

```markdown
# ADR-NNN: Short Title

## Status

PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED by ADR-XXX

## Date

YYYY-MM-DD

## Context

What is the issue or question that prompted this decision?

## Options Considered

### Option A: ...
- Pros: ...
- Cons: ...

### Option B: ...
- Pros: ...
- Cons: ...

## Decision

What was decided and why.

## Consequences

- What becomes easier or harder as a result.
- What follow-up actions are needed.
```

---

## Numbering

- Use sequential numbers: ADR-001, ADR-002, etc.
- Never reuse numbers, even for deprecated decisions.

---

## Index

All ADRs are indexed in [docs/DECISIONS.md](../DECISIONS.md).
