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

## Acceptance Criteria
- [ ] ...

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
