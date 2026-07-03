#!/bin/bash

# Skip deployment for production branch (artifacts only)
if [ "$VERCEL_GIT_COMMIT_REF" = "production" ]; then
  echo "🚫 Skipping build for production branch (artifacts only)"
  exit 0
fi

# Skip main branch (no longer used for deployment)
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "🚫 Skipping build for main branch (use fullstack branch)"
  exit 0
fi

# Only build on fullstack branch
if [ "$VERCEL_GIT_COMMIT_REF" != "fullstack" ]; then
  echo "🚫 Skipping build for non-fullstack branch"
  exit 0
fi

echo "✅ Building fullstack branch"
exit 1
