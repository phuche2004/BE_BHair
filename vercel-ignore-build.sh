#!/bin/bash

# Skip Android artifact branch
if [ "$VERCEL_GIT_COMMIT_REF" = "production" ]; then
  echo "Skipping Vercel build for production branch"
  exit 0
fi

# Skip fullstack branch
if [ "$VERCEL_GIT_COMMIT_REF" = "fullstack" ]; then
  echo "Skipping Vercel build for fullstack branch"
  exit 0
fi

# Only build Vercel from main
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "Skipping Vercel build for non-main branch"
  exit 0
fi

echo "Building Vercel from main branch"
exit 1
