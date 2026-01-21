#!/bin/bash
# Auto-start task implementation on session start (opt-in)
# To enable: touch .claude/.auto-work-enabled
# To disable: rm .claude/.auto-work-enabled

if [ -f .claude/.auto-work-enabled ]; then
  echo "Starting auto-work mode..."
  cat .claude/commands/auto-work.md
fi
