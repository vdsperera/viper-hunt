# AI Dev Pipeline

A professional AI-assisted development setup using 8 specialised agents across Claude.ai and Cursor.

## Folder structure

```
.
├── .cursorrules                    # Global architecture context — Cursor reads this on every request
├── .cursor/
│   └── rules/
│       ├── developer.mdc           # Agent 5 coding standards (auto-applies to src/**)
│       └── tests.mdc               # Agent 8 test standards (auto-applies to *.test.*)
├── prompts/                        # Source of truth for all agent system prompts
│   ├── 01-requirements-analyst.md
│   ├── 02-user-story-writer.md
│   ├── 03-architect.md
│   ├── 04-task-planner.md
│   ├── 05-developer.md
│   ├── 06-code-reviewer.md
│   ├── 07-security-reviewer.md
│   └── 08-test-generator.md
└── docs/                           # Living project documents (agent outputs)
    ├── requirements.md             # Agent 1 output
    ├── user-stories.md             # Agent 2 output
    ├── architecture.md             # Agent 3 output
    └── tasks.md                    # Agent 4 output — your task backlog
```

---

## Setup

### 1. Cursor (one-time per project)

Cursor reads `.cursorrules` and `.cursor/rules/*.mdc` automatically.

1. Copy this entire folder into your project root
2. Fill in `.cursorrules` with your architecture context (paste Agent 3 output here)
3. Cursor now has your architecture and coding standards on every request — nothing else needed

### 2. Claude.ai Projects (one-time, reusable across projects)

Create one Project per agent. The projects are reusable — you don't recreate them per project.

| Agent | Claude Project name | System prompt source |
|-------|--------------------|--------------------|
| 1 | Requirements Analyst | `prompts/01-requirements-analyst.md` |
| 2 | User Story Writer | `prompts/02-user-story-writer.md` |
| 3 | Architect | `prompts/03-architect.md` |
| 4 | Task Planner | `prompts/04-task-planner.md` |
| 6 | Code Reviewer | `prompts/06-code-reviewer.md` |
| 7 | Security Reviewer | `prompts/07-security-reviewer.md` |
| 8 | Test Generator | `prompts/08-test-generator.md` |

**Steps:**
1. Go to [claude.ai](https://claude.ai) → Projects → New Project
2. Name it e.g. `Agent 1 — Requirements Analyst`
3. Open Project Instructions → paste the contents of the matching `prompts/*.md` file
4. Done — every conversation in this project behaves as that agent automatically

---

## Workflow

### Starting a new project (run once)

```
Your idea
    ↓ paste into Agent 1 (Claude web)
requirements.md
    ↓ paste into Agent 2 (Claude web)
user-stories.md
    ↓ paste into Agent 3 (Claude web)
architecture.md  →  also paste into .cursorrules
    ↓ paste into Agent 4 (Claude web)
tasks.md  ← your backlog
```

### Each task (repeat per task)

```
Pick TASK-NNN from tasks.md
    ↓
Cursor Agent mode: "Implement TASK-NNN. Context in .cursorrules."
    ↓ Cursor writes files
Copy the generated code
    ↓ paste into Agent 6 (Claude web)
Code review findings
    ↓ paste into Cursor: "Fix these findings"
    ↓ (if touches auth/payments/PII)
Paste fixed code into Agent 7 (Claude web)
Security findings → Cursor fixes
    ↓
Paste code into Agent 8 (Claude web)
Generated tests → paste into Cursor: "Create these test files and run them"
    ↓
Mark TASK-NNN done in tasks.md
```

---

## When to use each tool

| Situation | Use |
|-----------|-----|
| Vague idea, not sure what to build | Agent 1 (Claude web) |
| Have requirements, need stories | Agent 2 (Claude web) |
| Need to design the system | Agent 3 (Claude web) |
| Need to break design into tasks | Agent 4 (Claude web) |
| Implementing a task | Cursor Agent mode |
| Code review | Agent 6 (Claude web) |
| Auth, payments, or PII code | Agent 7 (Claude web) |
| Need tests written | Agent 8 (Claude web) |
| Quick simple change | Cursor directly, skip agents |

---

## Updating prompts

Prompts are files — improve them like code.

1. Edit the relevant file in `prompts/`
2. Commit the change with a message explaining why: `improve: tighten input validation rules in developer agent`
3. Update the matching Claude Project Instructions by pasting the new version
4. For `.mdc` files, Cursor picks up the change automatically on the next request

---

## Tips

- **Keep `.cursorrules` updated** — paste the latest architecture doc here whenever components change
- **One task per Cursor session** — don't pile multiple tasks into one Agent conversation
- **Save agent outputs to `docs/`** — they become context for later agents
- **The review agents are optional for simple tasks** — use them when the code touches security, shared state, or complex business logic
