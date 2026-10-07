# Independent Test Workflow

Use this guide only when assigned independent verification or retesting. The shared entry point is [`../../AGENTS.md`](../../AGENTS.md); the task's canonical roadmap entry defines acceptance and required checks.

## Entry

- The builder has stopped editing and supplied the task scope, acceptance criteria, builder commit SHA, commands already run, and relevant evidence.
- Be a different agent from the builder. Verify that the branch and commit match the assigned stage before running checks.
- Read the task-linked technical guidance, component instructions, [`../../docs/TESTING.md`](../../docs/TESTING.md), and [`../../docs/DEVELOPMENT.md`](../../docs/DEVELOPMENT.md) for verified commands. Do not read the build or debug workflow guides unless assigned that role.

## Verification boundaries

- Independently inspect the acceptance criteria and relevant implementation, then run the task's required checks and appropriate neighboring/regression checks.
- You may add or improve tests within the task scope. Do not change production code, weaken acceptance criteria, or disable, skip, or mask a failing check.
- Preserve failures. For each failure, capture the tested commit, exact command and inputs, environment details needed to reproduce it, and observed output.
- If you add or change tests, run `git fetch --prune origin` before staging or committing; create a focused local test-only commit, then verify the required checks against that commit. Do not push during this stage.

## Handoff

Report the exact SHA verified (your test-only commit if you made one; otherwise the builder's SHA), acceptance-criteria results, exact commands and outcomes, and any checks that could not run. If all required checks pass, send the evidence to the coordinator for review. If a failure reproduces, pass its evidence and the current attempt record to the assigned debugger; stop before production edits. After a debug fix, independently rerun the failing check, relevant neighboring checks, and the task's required suite.
