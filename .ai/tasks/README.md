# .ai/tasks/ — Task Specifications

## Purpose

This directory contains task-specific context files that help AI agents understand and execute tasks.

## Naming Convention

```
<TASK-ID>.md
```

Examples:
- `AUTH-001.md` — Authentication implementation task
- `CART-003.md` — Cart feature task

## Template

```markdown
# <TASK-ID>: <Title>

## GitHub Issue
- Issue: #<number> (if applicable)

## Requirements
- ...

## Scope
- In scope: ...
- Out of scope: ...

## Acceptance Criteria
- [ ] ...

## Validation
- Required commands: ...
- Required agent sequence: build → test → debug only on failure → test again
- Expected evidence: exact commands, tested commit, results

## Context
- Relevant files: ...
- Dependencies: ...
- Related decisions: ...

## Notes
- ...
```

## Guidelines

- Reference GitHub Issues rather than duplicating them.
- Only create task files for complex tasks that need additional context.
- Remove or archive completed task files.
- Keep acceptance criteria observable and testable; do not leave product decisions implicit in agent prompts.
- Apply the sequential agent workflow and debug attempt record in the root [`AGENTS.md`](../../AGENTS.md).
