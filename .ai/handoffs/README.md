# .ai/handoffs/ — Agent Handoff Documentation

## Purpose

This directory contains handoff files created when an agent cannot complete a task. The handoff file provides context for the next agent or human who will continue the work.

## Naming Convention

```
<TASK-ID>.md
```

## Template

```markdown
# Handoff: <TASK-ID> — <Title>

## Branch
- `<branch-name>`

## Status
- What was completed:
  - ...
- What remains:
  - ...

## Known Issues
- ...

## Relevant Files
- ...

## Notes
- ...
```

## Guidelines

- Always commit and push work before creating a handoff.
- Include the branch name so the next contributor can find the work.
- Be specific about what was completed and what remains.
- Remove handoff files once the task is fully completed.
