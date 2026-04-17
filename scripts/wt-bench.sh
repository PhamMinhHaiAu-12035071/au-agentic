#!/usr/bin/env bash
# Helper for worktree-scoped benchmarking.
# Maintains a persistent .worktrees/.bench worktree so tests measure
# realistic AI subagent re-invocation cost (cache hit), not one-time
# worktree setup cost. cold-cycle measures the truly-cold path.
set -euo pipefail

COMMON_GIT="$(git rev-parse --git-common-dir)"
MAIN_WORKTREE="$(cd "$(dirname "$COMMON_GIT")" && pwd)"
BENCH_WT="$MAIN_WORKTREE/.worktrees/.bench"

case "${1:-help}" in
  setup)
    [[ -d "$BENCH_WT" ]] || git worktree add --detach "$BENCH_WT" HEAD
    ;;
  install)
    cd "$BENCH_WT" && bun run setup >/dev/null 2>&1
    ;;
  verify)
    cd "$BENCH_WT" && bun run verify >/dev/null 2>&1
    ;;
  loop)
    cd "$BENCH_WT" && bun run setup >/dev/null 2>&1 && bun run verify >/dev/null 2>&1
    ;;
  cold-cycle)
    UNIQ="$MAIN_WORKTREE/.worktrees/.cold-$$"
    git worktree add --detach "$UNIQ" HEAD >/dev/null 2>&1
    trap 'git worktree remove --force "$UNIQ" 2>/dev/null || true' EXIT
    cd "$UNIQ"
    bun run setup >/dev/null 2>&1
    bun run verify >/dev/null 2>&1
    ;;
  teardown)
    git worktree remove --force "$BENCH_WT" 2>/dev/null || true
    ;;
  help|*)
    echo "Usage: $0 {setup|install|verify|loop|cold-cycle|teardown}" >&2
    exit 1
    ;;
esac
