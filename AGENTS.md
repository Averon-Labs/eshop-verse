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
6. **Project documentation and canonical backlog** — `docs/`, especially [`docs/ROADMAP.md`](docs/ROADMAP.md) for planned Task IDs, dependencies, scope, and acceptance criteria
7. **Supplementary task context** — `.ai/tasks/` only when a roadmap task links to it
8. **AI-generated plans and notes** — `.ai/plans/`, `.ai/handoffs/`

> **AI conversation history is NEVER authoritative project state.**
> The repository is the source of truth. Always verify against the repository.

---

## Sequential Agent Workflow

Specialist agents work on one task **sequentially in the same task branch**. The coordinator assigns scope, acceptance criteria, and the current commit to each stage. Do not start the next stage while the previous agent is still editing.

1. **Build agent:** implement only the task scope and add tests for new behavior. Report changed files, assumptions, and exact checks run.
2. **Test agent:** independently run the checks named by the task and inspect acceptance criteria. It may add or improve tests within scope, but must not change production code or weaken/remove a failing check. Report exact commands and outcomes.
3. **Debug agent:** enter only for a reproducible failure. Reproduce it first, identify the root cause, make the smallest in-scope fix, and add a regression test. Do not edit unrelated behavior.
4. **Test agent:** verify the fix by rerunning the failing test, relevant neighboring tests, and the task's required suite. The coordinator reviews the final diff and evidence before marking the task complete.

Every agent must inspect the current git status, branch, recent commits, assigned Task entry in `docs/ROADMAP.md`, any linked supplementary context, and relevant component guidance before editing. Agents must respect the assigned file/scope boundary and preserve untracked or unrelated work.

### Debug Attempt Record

For each failed approach, record the commit or code state, hypothesis, exact command/input, observed result, and why the hypothesis was rejected or accepted. Do not rerun an identical command against unchanged code, inputs, and environment unless new evidence changes the hypothesis. After three distinct unsuccessful hypotheses, stop, report the reproducible failure and evidence, and ask the coordinator for a decision. Never claim success while a required check is failing.

The coordinator must pass the reproduction evidence and attempt record to the next agent; do not rely on implicit or unshared conversation history to prevent repeated attempts.

Normal build → test → debug → retest transitions within one task do not require a handoff file or intermediate push. Use the handoff procedure below only when work is blocked or being transferred outside this planned sequence.

---

## Planning Requirements

### Before Starting Any Task

1. **Read this file** (`AGENTS.md`) completely.
2. **Read the relevant component AGENTS.md** (`android/AGENTS.md`, `backend/AGENTS.md`, or `admin/AGENTS.md`).
3. **Inspect git status** — check for uncommitted changes, current branch, recent commits.
4. **Inspect existing code** — understand the current state before modifying.
5. **Read the assigned Task ID in `docs/ROADMAP.md`** and inspect any supplementary `.ai/tasks/` file explicitly linked by that entry.
6. **Follow Ponytail principles** — see [`.agents/skills/ponytail/SKILL.md`](.agents/skills/ponytail/SKILL.md) (minimal code, strict YAGNI, reuse existing libs/code).
7. For substantial work, plan from the roadmap entry before implementing; keep the plan in the task discussion unless durable extra context is genuinely needed.

### For Non-Trivial Features

- Select one existing Task ID from [`docs/ROADMAP.md`](docs/ROADMAP.md); do not assign a whole phase as one implementation task.
- The roadmap entry is the canonical task specification and contains scope, dependencies, acceptance criteria, and verification expectations. Do not copy it into a separate per-task file.
- If planned work is missing from the roadmap, add and review a Task entry there before implementation. Link a GitHub Issue if one exists.
- Create an optional `.ai/tasks/<TASK-ID>.md` or `.ai/plans/<TASK-ID>.md` only for substantial persistent context that cannot fit in the roadmap; link it from the Task entry and avoid duplicating acceptance criteria.

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
- Follow the risk-based test levels and independent verification flow in `docs/TESTING.md`.

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

Use this Gitflow-lite model:

- `main` contains only approved, completed releases. Never start a feature/task branch from it or merge a task branch directly into it.
- `develop` is the integration branch and the default base for task PRs. Create it once from the current `main` baseline; keep it after releases.
- Create one short-lived branch per roadmap Task ID from `develop`: `feature/<TASK-ID>-<description>`, `fix/<TASK-ID>-<description>`, `refactor/<TASK-ID>-<description>`, `docs/<TASK-ID>-<description>`, or `chore/<TASK-ID>-<description>`.
- All sequential agents for one Task share that task branch. After build/test/debug/retest and review pass, merge its PR into `develop`; delete the task branch after merge. Do not wait until the phase ends to clean already-merged branches.
- When a phase/release is complete, run the release checks on `develop`. Promote a release only through a reviewed `develop` → `main` PR; tag the released commit. Never delete `develop`.
- If the repository has not yet established `develop`, the coordinator creates it once from `main`; do not create competing integration branches.

Branch names:

```
main                                  # Released versions only
develop                               # Shared integration branch
feature/<TASK-ID>-<description>       # Feature Task from develop
fix/<TASK-ID>-<description>           # Bug-fix Task from develop
refactor/<TASK-ID>-<description>      # Refactoring Task from develop
chore/<TASK-ID>-<description>         # Maintenance Task from develop
docs/<TASK-ID>-<description>          # Documentation Task from develop
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
- Include the Task ID in the commit or PR title when applicable; reference a GitHub Issue if one exists.

### Pull Requests

- Task branches target `develop`; only release PRs from `develop` target `main`.
- All changes to `develop` and `main` go through Pull Requests; no direct task commits to either branch.
- PRs must have a clear description of what changed and why.
- PRs must reference the roadmap Task ID; link a GitHub Issue when one exists.
- PRs must pass all CI checks before merging.
- PRs require at least one human review for non-trivial changes.
- Use the PR template at `.github/pull_request_template.md`.
- Delete short-lived task branches after their PR merges; retain `develop` and `main`.

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
- Changes to `main` or `develop` branch protection rules

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
- Use `docs/ROADMAP.md` as the canonical phase/task backlog and acceptance source.
- Use `.ai/tasks/<TASK-ID>.md` or `.ai/plans/<TASK-ID>.md` only for linked supplementary context that would otherwise be lost or make the roadmap unwieldy.
- Use `.ai/reviews/<PR-ID>.md` for code review notes.
- **Do not create files in `.ai/` unless they contain genuinely useful persistent information.**
- **Do not use `.ai/` as a replacement for GitHub Issues or PRs.**

---

## Definition of Done

A code task is complete when:

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

For a documentation-only task, mark code/test checks as not applicable with a reason; review links, consistency, and scope instead.
