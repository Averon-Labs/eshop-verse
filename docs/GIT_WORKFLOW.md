# Git Workflow Rules

## Component-Specific Git Responsibilities

### Android Component

**Human Developer Responsibility:**
- All git operations for Android work are performed by the human developer
- This includes:
  - `git fetch`
  - `git branch` creation and switching
  - `git add .`
  - `git commit`
  - `git pull`
  - `git push`

**AI Agent Responsibility:**
- Implement the assigned Android task
- Write/modify code and tests
- Provide commit message text when work is complete
- Wait for human developer to perform git operations

**Workflow:**
1. Human developer fetches and creates/switches to the appropriate branch
2. Human developer assigns the Android task to the AI agent
3. AI agent implements the task (code, tests, documentation)
4. AI agent signals completion and provides suggested commit message
5. Human developer reviews changes
6. Human developer stages, commits, pulls, and pushes

**Exceptions:**
- If the human developer explicitly requests the AI agent to perform git operations for a specific Android task, the AI agent may do so
- The default remains: human handles all Android git operations

### Backend Component

**AI Agent Responsibility:**
- All git operations for Backend work
- Full implementation workflow including:
  - Branch creation
  - Code implementation
  - Testing
  - Staging (`git add`)
  - Committing (`git commit`)
  - Pushing (`git push`)

### Admin Component

**AI Agent Responsibility:**
- All git operations for Admin work
- Full implementation workflow including:
  - Branch creation
  - Code implementation
  - Testing
  - Staging (`git add`)
  - Committing (`git commit`)
  - Pushing (`git push`)

## Summary

| Component | Code Implementation | Git Operations |
|-----------|-------------------|----------------|
| Android   | AI Agent          | Human Developer (default) |
| Backend   | AI Agent          | AI Agent |
| Admin     | AI Agent          | AI Agent |

---

*This workflow ensures clear responsibility boundaries and allows the human developer to maintain direct control over Android source control operations while delegating backend and admin operations to AI agents.*
