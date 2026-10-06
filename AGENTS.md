# AGENTS.md — Repository-Wide Agent Instructions

> This file is the **primary instruction set** for all AI coding agents working in this repository.
> It is provider-neutral and applies equally to Claude Code, OpenAI Codex, Google Gemini/Antigravity, GitHub Copilot, and any other compatible coding agent.

---

## Project Purpose

This repository contains **EShop Verse**, a production-oriented e-commerce platform consisting of:

- **Android Customer Application** — Java, XML, Material 3, MVVM, Repository Pattern
- **RESTful Backend** — PHP, MySQL
- **Admin Dashboard** — Web-based administration interface
- **Database** — MySQL relational database

The platform is developed collaboratively by human developers and AI coding agents.

---

## Source of Truth (Priority Order)

1. **Explicit human requirements** — direct instructions from project owners
2. **Source code** — the actual implementation
3. **Automated tests** — verified behavior
4. **Git history** — commit log and branch state
5. **Architecture Decision Records** — `docs/decisions/`
6. **Project documentation** — `docs/`
7. **Task specifications** — `.ai/tasks/`
8. **AI-generated plans and notes** — `.ai/plans/`, `.ai/handoffs/`

> **AI conversation history is NEVER authoritative project state.**
> The repository is the source of truth. Always verify against the repository.

---

## Multi-Agent Principles

- This repository may be used by **multiple AI agents simultaneously**.
- Agents must not assume they are the only contributor.
- Agents must not assume their conversation history reflects the current repository state.
- Agents must **inspect the repository** (files, git status, recent commits) before making changes.
- Agents must work within their assigned scope and avoid touching files outside their task boundary.
- All agent instructions are in this file and component-specific `AGENTS.md` files.

---

## Planning Requirements

### Before Starting Any Task

1. **Read this file** (`AGENTS.md`) completely.
2. **Read the relevant component AGENTS.md** (`android/AGENTS.md`, `backend/AGENTS.md`, or `admin/AGENTS.md`).
3. **Inspect git status** — check for uncommitted changes, current branch, recent commits.
4. **Inspect existing code** — understand the current state before modifying.
5. **Check for related `.ai/tasks/` files** — see if a task specification exists.
6. **Create a plan** before implementing non-trivial changes.

### For Non-Trivial Features

- Create a task file: `.ai/tasks/<TASK-ID>.md`
- Create a plan file: `.ai/plans/<TASK-ID>.md`
- Reference the relevant GitHub Issue if one exists.

---

## Safe Editing Rules

- **Never modify `main` directly** for feature work. Create a branch.
- **Inspect before editing** — always read a file before modifying it.
- **Avoid concurrent file edits** — do not modify files that other agents are likely editing.
- **Preserve existing comments and documentation** unless explicitly instructed to change them.
- **Do not overwrite architectural decisions silently** — if you disagree with an ADR, document your concern; do not ignore it.
- **Do not delete files** unless explicitly instructed.
- **Do not rewrite files entirely** when a targeted edit suffices.

---

## Architecture Rules

- Follow the architecture documented in `docs/ARCHITECTURE.md`.
- Respect component boundaries:
  - `android/` — Android customer application
  - `backend/` — PHP REST API
  - `admin/` — Admin dashboard
- Communication between components happens **only through the REST API**.
- The API contract is defined in `docs/API_CONTRACT.md`.
- Do not introduce cross-component dependencies outside the API boundary.
- Consult `docs/decisions/` before making architectural changes.
- New architectural decisions must be proposed as ADRs in `docs/decisions/`.

---

## Testing Rules

- **All new code must include tests** unless explicitly marked as a prototype.
- **Do not disable existing tests** to make your changes pass.
- **Do not skip tests** in CI configuration.
- **Do not mark tests as expected failures** without documenting the reason.
- Follow the testing strategy in `docs/TESTING.md`.
- Test naming convention: `test_<unit>_<scenario>_<expected>` or equivalent for the language.

---

## Security Rules

- **Never commit secrets**, API keys, passwords, or credentials.
- **Never commit `.env` files** with real values.
- **Never disable security checks** to make a task pass.
- **Never log sensitive data** (passwords, tokens, PII).
- Use environment variables or secure vaults for configuration.
- Follow the security guidelines in `docs/SECURITY.md`.
- Validate all user input on the backend.
- Use parameterized queries — never concatenate SQL.

---

## Dependency Rules

- **Do not add dependencies without justification.**
- Prefer standard library solutions when reasonable.
- Document why a dependency is needed in the commit message or PR description.
- Pin dependency versions explicitly.
- Check dependencies for known vulnerabilities before adding.
- Do not add dependencies that duplicate existing functionality.

---

## Git Rules

### Branches

```
main                   # Stable, protected. Never commit directly.
feature/<description>  # New features
fix/<description>      # Bug fixes
refactor/<description> # Code refactoring
chore/<description>    # Maintenance, tooling, config
docs/<description>     # Documentation changes
```

### Commit Conventions

Use conventional commit prefixes:

```
feat:     New feature
fix:      Bug fix
refactor: Code refactoring (no behavior change)
test:     Adding or modifying tests
docs:     Documentation changes
chore:    Maintenance, tooling, config
build:    Build system changes
ci:       CI/CD changes
```

**Rules:**
- Keep commits focused and logically reversible.
- One logical change per commit.
- Write clear, descriptive commit messages.
- Reference GitHub Issues when applicable: `feat: add login endpoint (#12)`.

### Pull Requests

- All changes to `main` go through Pull Requests.
- PRs must have a clear description of what changed and why.
- PRs must reference the relevant GitHub Issue.
- PRs must pass all CI checks before merging.
- PRs require at least one human review for non-trivial changes.
- Use the PR template at `.github/pull_request_template.md`.

---

## Human Approval Requirements

The following require explicit human approval before merging:

- Architectural changes (new ADRs)
- Database schema changes
- API contract changes
- Security-related changes
- Dependency additions or major version upgrades
- CI/CD pipeline changes
- Changes to `AGENTS.md` or component AGENTS files
- Changes to `main` branch protection rules

---

## Agent Handoff Rules

When an agent cannot complete a task or is handing off to another agent:

1. **Commit all work in progress** on the feature branch.
2. **Create a handoff file**: `.ai/handoffs/<TASK-ID>.md` containing:
   - Current status
   - What was completed
   - What remains
   - Known issues or blockers
   - Relevant file paths
   - Branch name
3. **Push the branch** so the next agent can access it.
4. **Do not leave uncommitted changes** in the working directory.

---

## Context Management

- Use `.ai/state/PROJECT_STATE.md` for high-level project status (updated periodically, not after every change).
- Use `.ai/tasks/<TASK-ID>.md` for task-specific context.
- Use `.ai/plans/<TASK-ID>.md` for implementation plans.
- Use `.ai/reviews/<PR-ID>.md` for code review notes.
- **Do not create files in `.ai/` unless they contain genuinely useful persistent information.**
- **Do not use `.ai/` as a replacement for GitHub Issues or PRs.**

---

## Definition of Done

A task is complete when:

- [ ] Code is implemented and follows project conventions.
- [ ] Tests are written and passing.
- [ ] No existing tests are broken.
- [ ] Code has been self-reviewed for obvious issues.
- [ ] Documentation is updated if behavior changed.
- [ ] API contract is updated if endpoints changed.
- [ ] Commit messages follow conventions.
- [ ] Branch is pushed and PR is created (or ready to create).
- [ ] No secrets, credentials, or sensitive data are committed.
- [ ] No linting errors or warnings are introduced.
