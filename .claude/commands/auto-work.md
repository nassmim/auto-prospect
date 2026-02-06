Auto Work Mode

Autonomous task execution: fetch next task, implement it, commit, repeat until no tasks remain.

## Workflow

1. **Get Next Task**
   - Run `task-master next` to fetch the next pending task
   - If no tasks available, stop

2. **Implement Task**
   - Use `feature-dev` plugin for feature tasks
   - Use `frontend-design` plugin for UI tasks
   - Use `code-simplifier` after implementation
   - Use `explanatory-output-style` to explain complex logic and reasoning
   - Follow all code standards from CLAUDE.md

3. **Commit Changes**
   - Stage all changes: `git add .`
   - Commit with task reference: `git commit -m "task <id>: <concise description>"`

4. **Mark Complete**
   - Update task status: `task-master set-status --id=<id> --status=done`

5. **Loop**
   - Repeat from step 1 until no pending tasks

## Rules

- Only add insights for non-obvious logic (no comments for simple operations like map/filter)
- Use plugins automatically without asking
- Always commit after each task completion
- Stop if errors occur or tests fail
- Never skip testing when tests exist
