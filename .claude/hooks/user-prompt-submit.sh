#!/bin/bash
# Auto-compact at 70% to prevent overflow
if [ "$CONTEXT_PERCENTAGE" -gt 70 ]; then
  echo "/compact"
fi
