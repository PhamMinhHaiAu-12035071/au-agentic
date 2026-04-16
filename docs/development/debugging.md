**Purpose:** How to debug the CLI and tests locally.  
**Read this when:** A failure is unclear from test output alone.  
**Do not use for:** Production incident response (use [../deployment/incident-response.md](../deployment/incident-response.md) when applicable).  
**Related:** [testing.md](testing.md), [workflow.md](workflow.md), [../../packages/cli/src/index.ts](../../packages/cli/src/index.ts)  
**Update when:** Debug entrypoints, logging, or test harnesses change.

---

# Debugging

**Status:** Currently not applicable — use `bun run dev`, single-file `bun test`, and source maps as needed.

**Trigger:** This file should be filled when:
- You add structured logging, trace flags, or debug subcommands
- Common failure modes deserve a documented playbook

## Toolchain troubleshooting

### Turbo cache giving stale results

Symptoms: code changed but Turbo reports `cache hit` and skips the task.

Fix:

```bash
rm -rf .turbo node_modules/.cache
bunx turbo run <task> --force
```

If the issue recurs, the task's `inputs` glob in `turbo.json` is missing a relevant file. Add it.

### Biome reports thousands of "errors" on first run

Likely cause: `biome.json` ignore globs do not yet exclude generated files (e.g., `.turbo/`, `coverage/`, `dist/`).

Fix: confirm `files.ignore` in `biome.json` lists the generated directories.

### gitleaks blocking a legitimate change

If you are confident a flagged token is not a real secret, extend `.gitleaks.toml` allowlist with the most specific path/regex possible. Never add `--no-verify` to bypass.

### `bun run perf` shows FAIL on `gitleaks staged`

gitleaks must be on `PATH`. If `gitleaks version` does not print `8.x`, re-install per `docs/getting-started/local-setup.md`.
