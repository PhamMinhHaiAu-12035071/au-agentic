#!/usr/bin/env bash
# Wraps `bun test` so:
#  1. Coverage worker fragments (coverage/.lcov.info.*.tmp) are cleaned
#     before AND after the run, even if bun test crashes or is interrupted.
#  2. bun test always runs from the main worktree root so it picks up the
#     root bunfig.toml (coverage reporters, thresholds, coverageDir).
#     Bun does not traverse upward for bunfig.toml; running from a package
#     directory silently disables coverage config.
#
# Usage: scripts/run-bun-test.sh [args...]
# Args forwarded to bun test. Relative path args are rewritten to absolute
# so they keep referring to the same files after the cd.
set -uo pipefail

COMMON_GIT="$(git rev-parse --git-common-dir)"
MAIN_WORKTREE="$(cd "$(dirname "$COMMON_GIT")" && pwd)"
COV_DIR="$MAIN_WORKTREE/coverage"
PACKAGE_DIR="$(pwd)"

# Rewrite relative-path args (that exist under the invoking package dir)
# into absolute paths. Flag args (starting with '-') pass through untouched.
ARGS=()
for arg in "$@"; do
  if [[ "$arg" != -* && -e "$PACKAGE_DIR/$arg" ]]; then
    ARGS+=("$PACKAGE_DIR/$arg")
  else
    ARGS+=("$arg")
  fi
done

clean() {
  shopt -s nullglob 2>/dev/null || true
  rm -f "$COV_DIR"/.lcov.info.*.tmp 2>/dev/null || true
}

clean
trap clean EXIT INT TERM

cd "$MAIN_WORKTREE"
bun test "${ARGS[@]}"
