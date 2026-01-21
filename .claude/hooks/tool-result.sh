#!/bin/bash
# After each tool result, check if should continue
# If task completed, fetch next task automatically
if echo "$TOOL_RESULT" | grep -q "task-master set-status.*done"; then
  echo "Task completed. Fetching next task..."
  echo "Continue auto-work workflow"
fi
