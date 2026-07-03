#!/bin/bash

# Skip deployment for production branch (artifacts only)
if [ "$VERCEL_GIT_COMMIT_REF" = "production" ]; then
  echo "🚫 Skipping build for production branch (artifacts only)"
  exit 0
fi

# Only build on main branch
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "🚫 Skipping build for non-main branch"
  exit 0
fi

echo "✅ Building main branch"
exit 1
