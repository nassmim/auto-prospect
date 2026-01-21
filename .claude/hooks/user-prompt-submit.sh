#!/bin/bash
# Auto-compact at 90% to prevent freeze
if [ "$CONTEXT_PERCENTAGE" -gt 90 ]; then
  echo "/compact"
fi
