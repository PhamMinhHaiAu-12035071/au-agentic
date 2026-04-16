#!/usr/bin/env bash
# Wraps every bun/turbo invocation with project-scope cache env vars.
# Resolves the main worktree (works from any linked worktree via
# git rev-parse --git-common-dir) so .cache/ always lives in the main
# worktree's tree. This makes cache shared across all subagent worktrees
# under .worktrees/.
set -euo pipefail
COMMON_GIT="$(git rev-parse --git-common-dir)"
MAIN_WORKTREE="$(cd "$(dirname "$COMMON_GIT")" && pwd)"
export BUN_INSTALL_CACHE_DIR="$MAIN_WORKTREE/.cache/bun-install"
export TURBO_CACHE_DIR="$MAIN_WORKTREE/.cache/turbo"
exec "$@"
