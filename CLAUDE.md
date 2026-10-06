# CLAUDE.md — Claude Code Project Instructions

> This file provides Claude Code-specific instructions for this repository.
> It is a **thin adapter** — the primary instructions are in `AGENTS.md`.

---

## Primary Instructions

**Read `AGENTS.md` first.** It contains all repository-wide rules, conventions, and workflows that apply to every AI agent, including Claude.

---

## Key Documentation

Before starting work, familiarize yourself with:

- `AGENTS.md` — Repository-wide agent instructions (READ FIRST)
- `docs/ARCHITECTURE.md` — System architecture
- `docs/API_CONTRACT.md` — API integration boundary
- `docs/TESTING.md` — Testing strategy
- `docs/SECURITY.md` — Security guidelines
- `docs/DEVELOPMENT.md` — Development workflow

For component-specific rules:

- `android/AGENTS.md` — Android app conventions
- `backend/AGENTS.md` — Backend API conventions
- `admin/AGENTS.md` — Admin dashboard conventions

---

## Claude-Specific Guidelines

1. **Inspect before modifying** — Always read existing code and git status before making changes.
2. **Incremental progress** — Make small, focused changes. Commit frequently.
3. **Validate before declaring done** — Run tests, check for errors, verify the change works.
4. **Stay in scope** — Only modify files relevant to your current task.
5. **Respect existing patterns** — Follow the conventions already established in the codebase.
6. **Create branches** — Never commit directly to `main`.
7. **Document handoffs** — If you cannot complete a task, create a handoff file in `.ai/handoffs/`.

---

## Task Workflow

1. Read `AGENTS.md`.
2. Check git status and recent commits.
3. Read the relevant component `AGENTS.md`.
4. Understand the current state of the code.
5. Plan your approach.
6. Implement incrementally.
7. Test your changes.
8. Commit with conventional commit messages.
9. Verify Definition of Done (see `AGENTS.md`).
