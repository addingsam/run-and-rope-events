#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${1:-}"

if [[ -z "$REPO_URL" ]]; then
  echo "Usage: ./scripts/connect-github.sh https://github.com/USERNAME/run-and-rope-events.git"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Git is not available. Install Xcode Command Line Tools first:"
  echo "  xcode-select --install"
  exit 1
fi

git init
git add .
git commit -m "Initial commit: Next.js event directory scaffold"
git branch -M main
git remote add origin "$REPO_URL"
git push -u origin main

echo "Connected and pushed to $REPO_URL"
