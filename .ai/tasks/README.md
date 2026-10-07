# Supplementary Task Context

Project phase gates, shared tasks, and the Task ID index live in [`../../docs/ROADMAP.md`](../../docs/ROADMAP.md). Component task scope, dependencies, acceptance criteria, and verification expectations live in [`../../docs/ANDROID_ROADMAP.md`](../../docs/ANDROID_ROADMAP.md), [`../../docs/BACKEND_ROADMAP.md`](../../docs/BACKEND_ROADMAP.md), and [`../../docs/ADMIN_ROADMAP.md`](../../docs/ADMIN_ROADMAP.md). Assign work by roadmap/phase/step or Task ID; do not create duplicate task files for ordinary roadmap work.

Create `.ai/tasks/<TASK-ID>.md` only when a task needs substantial persistent context that does not belong in the roadmap, such as a long investigation record or external technical constraints. Link it from the relevant roadmap entry, keep only the supplementary information here, and do not copy the task's acceptance criteria. Link GitHub Issues rather than treating this directory as an issue tracker.

Apply the sequential build → independent test → debug only for reproduced failure → independent retest workflow and the no-identical-retry rule in the root [`AGENTS.md`](../../AGENTS.md). Use a handoff record only when the work is blocked or transferred, as described there.
