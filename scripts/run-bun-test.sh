#!/usr/bin/env bash
# Wraps `bun test` so coverage worker fragments (coverage/.lcov.info.*.tmp)
# get cleaned both before and after the run — even if bun test is killed,
# crashes, or a worker leaks a fragment. Guarantees coverage/ never grows
# unbounded on a developer's machine.
#
# Usage: scripts/run-bun-test.sh [args...] — args are forwarded to bun test.
# Must be invoked from the repo root so the coverage/ path resolves.
set -uo pipefail

COMMON_GIT="$(git rev-parse --git-common-dir)"
MAIN_WORKTREE="$(cd "$(dirname "$COMMON_GIT")" && pwd)"
COV_DIR="$MAIN_WORKTREE/coverage"

clean() {
  # Bash 4+: nullglob suppresses pattern-with-no-match errors.
  shopt -s nullglob 2>/dev/null || true
  rm -f "$COV_DIR"/.lcov.info.*.tmp 2>/dev/null || true
}

clean
trap clean EXIT INT TERM

bun test "$@"
