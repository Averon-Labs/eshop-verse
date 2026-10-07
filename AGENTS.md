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
6. **Project documentation and canonical backlog** — `docs/ROADMAP.md` for project phase gates and shared tasks, plus the relevant component roadmap (`docs/ANDROID_ROADMAP.md`, `docs/BACKEND_ROADMAP.md`, or `docs/ADMIN_ROADMAP.md`) for that component's canonical Task entries, dependencies, scope, and acceptance criteria
7. **Supplementary task context** — `.ai/tasks/` only when a roadmap task links to it
8. **AI-generated plans and notes** — `.ai/plans/`, `.ai/handoffs/`

> **AI conversation history is NEVER authoritative project state.**
> The repository is the source of truth. Always verify against the repository.

---

## Sequential Agent Workflow

Specialist agents work one at a time on the same task branch. Unless the owner narrows the request, assigning a roadmap step or Task ID covers the full workflow through a PR ready for human review. The coordinator assigns each stage its scope, acceptance criteria, and current commit; do not start another stage while an agent is editing. Each stage that edits creates a focused local commit before handoff so the next stage has a stable snapshot; normal stage transitions do not push.

Each specialist reads only the workflow guide for its assigned role, in addition to the shared and task-relevant guidance:

1. **Builder:** [`.agents/workflows/build.md`](.agents/workflows/build.md) — implement the task and add tests for changed behavior.
2. **Independent tester:** [`.agents/workflows/test.md`](.agents/workflows/test.md) — independently verify the builder's commit; it must be a different agent from the builder.
3. **Debugger:** [`.agents/workflows/debug.md`](.agents/workflows/debug.md) — a third, distinct agent, used only after a failure is reproduced.
4. **Independent retest:** the tester or another independent tester verifies a debug fix. The coordinator reviews evidence and the final diff before completion.

Every agent must inspect the current git status, branch, recent commits, assigned Task entry in its canonical component roadmap (or `docs/ROADMAP.md` for a shared task), any linked supplementary context, and relevant component guidance before editing. Agents must respect the assigned file/scope boundary and preserve untracked or unrelated work.

Debuggers must keep an attempt record and must not repeat a failed approach without new evidence; follow the limits and evidence format in the debug guide. The coordinator passes that record between stages. A tester commits any test-only additions and reports the exact SHA verified; if it makes no changes, it reports the builder's SHA. Normal build → test → debug → retest transitions need no handoff file or intermediate push; use the handoff procedure below only when work is blocked or transferred outside this sequence. After independent verification and coordinator review, the coordinator publishes the task branch and prepares a PR; never merge automatically.

---

## Planning Requirements

### Before Starting Any Task

1. **Read this file** (`AGENTS.md`) completely.
2. **Read the relevant component AGENTS.md** (`android/AGENTS.md`, `backend/AGENTS.md`, or `admin/AGENTS.md`).
3. **Inspect git status** — check for uncommitted changes, current branch, recent commits.
4. **Inspect existing code** — understand the current state before modifying.
5. **Read the assigned Step and canonical Task entry** in the matching component roadmap, or `docs/ROADMAP.md` for cross-component work; inspect any supplementary `.ai/tasks/` file explicitly linked by that entry.
6. **Follow Ponytail principles** — see [`.agents/skills/ponytail/SKILL.md`](.agents/skills/ponytail/SKILL.md) (minimal code, strict YAGNI, reuse existing libs/code).
7. For substantial work, plan from the roadmap entry before implementing; keep the plan in the task discussion unless durable extra context is genuinely needed.

### Step Assignment and Clarification

- Identify work by roadmap name, phase, and step (for example, `Android Roadmap — Phase 1 — Step 1`) or by stable Task ID. Step numbering restarts at 1 in every phase. If the owner names a phase and step without identifying a roadmap, ask which component they mean.
- Read the canonical task, its dependencies, applicable component instructions, and every authoritative project document that governs the task's scope: the task-linked documents and any applicable product, architecture/ADR, API/database, design, security, and testing guidance. Inspect source, tests, and current configuration to resolve decisions already answered by repository evidence; do not bulk-read unrelated component documents or ask the owner to repeat a documented decision.
- If scope, acceptance criteria, product behavior, architecture, API/schema/security behavior, or a consequential library/dependency choice is materially missing or contradictory, ask a focused question. State the unresolved decision, give a recommendation and tradeoff when useful, and pause only the dependent work. Once the owner answers, continue the task without asking for another start or plan confirmation.
- If the task and authoritative evidence fully specify the work, proceed without an approval question or a redundant plan-confirmation turn. For example, Android image loading is already specified as Glide in `android/AGENTS.md`; do not ask whether to use Glide or Picasso.
- Do not silently guess at material requirements or mark uncertainty as resolved. If dependencies are incomplete, report the exact blocking Task ID and do not expand the assigned scope to bypass it.
- Run `git fetch --prune origin` before creating a task branch and again before staging, committing, or pushing. This refreshes local remote-tracking refs, including remote branch deletions. Create new work from the latest `origin/develop`; before publishing, compare local and fetched refs, fast-forward a clean local `develop` when safe, and incorporate newer `origin/develop` and same-task-branch commits into the task branch without rewriting published commits. Delete a local task branch only after verifying its PR merged and the worktree is clean. Preserve unrelated local work, never force-push shared branches, and stop to report conflicts or divergence you cannot safely resolve.
- Never merge a PR automatically.

### For Non-Trivial Features

- Select one existing Task ID from the applicable component roadmap or [`docs/ROADMAP.md`](docs/ROADMAP.md) for a shared task; do not assign a whole phase as one implementation task.
- The Task entry is canonical in exactly one roadmap and contains scope, dependencies, acceptance criteria, and verification expectations. `docs/ROADMAP.md` indexes component tasks and owns cross-component tasks; do not copy criteria into another roadmap or per-task file.
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

### Android Visual Design

- All customer-app screens use the shared Material 3 XML/View system in `docs/DESIGN_SYSTEM.md`; do not mix unrelated visual styles between screens.
- Use the single app theme and shared color, typography, spacing, shape, elevation, and component tokens. Define or change tokens centrally and update the design-system document when approved.
- Prefer Material 3 components and established screen patterns for app bars, navigation, product cards, forms, actions, dialogs, and loading/empty/error/success states. Avoid ad hoc colors, dimensions, typography, custom controls, or one-off interaction patterns.
- Keep layouts responsive and accessible: minimum 48dp touch targets, scalable text, semantic labels, keyboard/focus support, and verified contrast.
- Before adding a new screen pattern or changing the visual language, check the design system and existing screens; extend shared patterns rather than creating a parallel style.

### Admin Web Visual Design

- Follow the shared tokens in `docs/DESIGN_SYSTEM.md` and page-level behavior/layout in `docs/SCREEN_SPECIFICATIONS.md` for every dashboard page.
- Reuse the same coral/neutral palette, Lato typography, spacing, shapes, status semantics, and responsive principles as the customer app. Use web navigation and tables appropriate to desktop; do not copy Android's bottom navigation into the dashboard.
- Keep dashboard pages limited to the first-release scope. Analytics, customer administration, notifications, transaction history, CMS, and wishlist are deferred unless a new product Task changes that scope.
- Ensure keyboard operation, persistent labels, visible focus, non-color-only status, and readable table/card behavior at supported narrow widths.

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

### Branch Synchronization Before Commit and Push

Every agent must refresh and inspect remote state before staging/committing work and again before pushing. Do not assume local refs or conversation history reflect GitHub.

1. Run `git fetch --prune origin` and `git remote set-head origin -a`, then inspect `git status --short --branch`, `git branch -vv`, and the relevant remote refs. This updates remote-tracking refs, prunes refs for deleted remote branches, and refreshes the local `origin/HEAD` pointer; it does not update local branches or delete local branches.
2. Keep local integration branches current only by fast-forward: create a missing local `develop` with `git switch --track -c develop origin/develop`; update an existing clean `develop` or `main` with `git pull --ff-only origin <branch>`. Never commit or push directly from them. Create each new task branch from the latest `origin/develop`. For an existing shared task branch, if the working tree is clean and its upstream advanced, fast-forward with `git pull --ff-only` before editing. Never pull/rebase over uncommitted work; preserve it and reconcile deliberately.
3. Before staging/committing, fetch again and check whether the task branch's upstream moved. If it did, preserve the work in progress, fast-forward from the upstream, restore the work, resolve any conflicts, then review the diff and stage only task-scoped files. Do not include unrelated user changes.
4. Before pushing, fetch and confirm the current branch and upstream. If GitHub deleted that task branch, check whether its commits are already in `origin/develop`: if merged, do not recreate or push it; if not merged, stop and ask the coordinator before restoring/recreating the branch. If the remote branch advanced, integrate its commits explicitly before retrying the push.
5. After a task PR merges, run `git fetch --prune origin`. Delete its local branch only after confirming it is merged and is not the current branch, using `git branch -d <branch>`. Never use `git reset --hard` or force-push as routine synchronization or cleanup.

If fetch, fast-forward, or push fails, capture the exact output, inspect divergence and branch protection, and resolve the cause; do not repeat an unchanged command without new evidence.

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

When a task is blocked or work must be transferred outside the planned sequential role workflow, use this procedure. It does not apply to normal build → test → debug → retest transitions; those use local commits without a handoff file or push, as described above:

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
- Use `docs/ROADMAP.md` for project phase gates, shared tasks, and the Task ID index; use the applicable component roadmap for canonical component Task entries and acceptance criteria.
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
