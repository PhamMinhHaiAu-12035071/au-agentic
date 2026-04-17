# Cursor Agent Bench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/cursor-agent-bench/` — Bun workspace package spawning Cursor CLI (`cursor-agent`) to benchmark superpowers skills with scripted multi-turn fixtures, 2-mode run (smoke / `--matrix`), L1 eval (exit-code + assertions), commit-able markdown tracker + gitignored JSONL raw. V1 covers one skill (`interview`).

**Architecture:** Standalone package (`"private": true`), CLI entry dispatches `smoke` / `matrix` mode to runner. Runner spawns `cursor-agent --print --model <id> [--resume <sid>] "<prompt>"` per turn, captures stdout/stderr/exitCode, applies L1 matchers from fixture, appends JSONL + re-renders markdown tracker. Preflight checks Cursor CLI presence + OAuth session before any spawn. No CI integration (DEC-013). Not in `bun run verify` (DEC-010).

**Tech Stack:** Bun 1.3.10+, TypeScript (strict, `noUncheckedIndexedAccess`), `Bun.spawn` API, Biome lint+format, `bun test` for framework self-tests. No new runtime deps.

**Spec:** [docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md](../specs/2026-04-17-cursor-agent-bench-design.md)

**Verification before claiming done:** `bun run verify` (lint + typecheck + test) from repo root. Framework self-tests use mocked `Bun.spawn`; real Cursor CLI smoke test is opt-in (`bun run skill:bench:smoke-real`), not in verify chain.

---

## File Structure (locked upfront)

**New files — package source (`packages/cursor-agent-bench/`):**
- `package.json` — `"private": true`, scripts, imports field, no deps
- `tsconfig.json` — extend root, include src + tests
- `README.md` — usage, setup, how to add fixture, auth note
- `cursor-bench.config.ts` — exported config (models, timeouts, paths, per-fixture deadline)
- `src/index.ts` — CLI entry (parse flags, dispatch)
- `src/config-define.ts` — `defineConfig` helper + types
- `src/preflight.ts` — `cursor-agent` binary + `status`/`whoami` command check (DEC-018)
- `src/fixture.ts` — fixture loader + validator
- `src/runner.ts` — multi-turn spawn loop with retry, per-turn timeout, per-fixture deadline 20min (DEC-017)
- `src/eval/l1.ts` — assertion matchers (includes, notIncludes, regex, exitCode)
- `src/spawn-cursor-agent.ts` — real Bun.spawn adapter
- `src/metadata.ts` — collect git SHA + skill checksum + env (bun/cursor-agent/platform) — DEC-021/022/023
- `src/truncate.ts` — truncate output + dump-on-fail helper (DEC-022, C11)
- `src/report/aggregate.ts` — compute pass_rate, mean/p50/p95 latency, per-model ranking (DEC-020)
- `src/report/markdown.ts` — render 3-section tracker (Summary inc. metadata, Per-Fixture×Model, Per-Model Ranking)
- `src/report/jsonl.ts` — append JSONL records (embed metadata + truncation fields)
- `src/cli-parse.ts` — CLI flag parser
- `src/types.ts` — shared types (Fixture, TurnResult, BenchResult, AggregateReport)
- `fixtures/interview-phase1.ts` — first fixture for `interview` skill (C3 text regex assertions per DEC-016)

**New files — tests (`packages/cursor-agent-bench/src/__tests__/`):**
- `eval-l1.test.ts` — matcher unit tests
- `fixture.test.ts` — fixture validator tests
- `preflight.test.ts` — session check tests (mocked fs)
- `runner.test.ts` — spawn loop + retry with mocked Bun.spawn
- `report-markdown.test.ts` — tracker rendering snapshot
- `report-jsonl.test.ts` — JSONL append format
- `config-define.test.ts` — config schema validation
- `cli-parse.test.ts` — flag parsing, exit codes
- `report-aggregate.test.ts` — pass_rate, p50/p95, ranking correctness
- `metadata.test.ts` — git/skill/env collection with DI (mock spawn/fs)
- `truncate.test.ts` — truncation boundary + dump file path format
- `__fixtures__/stub-cursor-agent.sh` — integration stub for cursor-agent

**New files — docs:**
- `docs/adr/0010-cursor-cli-system-prereq.md` — document DEC-001 exception
- `docs/superpowers/bench/.gitkeep` — commit-able tracker dir placeholder
- `docs/superpowers/bench/README.md` — explain tracker format, how to read

**Modified files — root config:**
- `package.json` (root) — add `skill:bench`, `skill:bench:smoke-real` scripts
- `.gitignore` — add `coverage/cursor-bench/`
- `tsconfig.json` — no change (workspace inherits)
- `turbo.json` — **no change** (bench is standalone, not in Turbo pipeline)
- `scripts/benchmark.ts` — add entry `{ name: "bun test (cursor-agent-bench unit)", targetMs: 200, ceilingMs: 500 }` (DEC-019, C7)
- `.github/pull_request_template.md` — add "Ran `bun run skill:bench` if skill changed" checkbox (create if missing)

**Modified files — docs:**
- `README.md` — add "Skill benchmarking" section or link
- `docs/ai/routing.md` — add task type "Skill quality validation?"
- `docs/development/testing-policy.md` — add "Skill benchmarking" section
- `docs/ai/dependency-scope-policy.md` — link ADR-0010 for Cursor CLI exception

---

## Phase 0 — Package Scaffolding

### Task 0.1: Create package skeleton

**Files:**
- Create: `packages/cursor-agent-bench/package.json`
- Create: `packages/cursor-agent-bench/tsconfig.json`
- Create: `packages/cursor-agent-bench/README.md`

- [ ] **Step 0.1.1: Write `package.json`**

Create `packages/cursor-agent-bench/package.json`:

```json
{
  "name": "@au-agentic/cursor-agent-bench",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "imports": {
    "#src/*": "./src/*.ts",
    "#fixtures/*": "./fixtures/*.ts"
  },
  "scripts": {
    "bench": "bun run src/index.ts",
    "bench:smoke-real": "bun run src/index.ts --real",
    "test": "../../scripts/run-bun-test.sh --concurrent src/__tests__/",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint ."
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 0.1.2: Write `tsconfig.json`**

Create `packages/cursor-agent-bench/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src/**/*.ts", "fixtures/**/*.ts", "cursor-bench.config.ts"]
}
```

- [ ] **Step 0.1.3: Write minimal `README.md`**

Create `packages/cursor-agent-bench/README.md`:

```markdown
# @au-agentic/cursor-agent-bench

Skill benchmarking framework for au-agentic. Spawns Cursor CLI (`cursor-agent`) with scripted multi-turn fixtures and validates skill quality across multiple LLM models.

## Prerequisites

- Bun 1.3.10+
- Cursor CLI installed (`curl https://cursor.com/install -fsSL | bash`)
- OAuth logged in: `cursor-agent login`

See [ADR-0010](../../docs/adr/0010-cursor-cli-system-prereq.md) for why Cursor CLI is a system prerequisite.

## Usage

```bash
# Smoke: default model × 1 run (fast iter)
bun run skill:bench

# Full matrix: 7 models × 3 runs (release gate)
bun run skill:bench --matrix

# Single fixture + specific model
bun run skill:bench --fixture interview-phase1 --model claude-4.5-sonnet --runs 3
```

## Output

- **Markdown tracker (commit):** `docs/superpowers/bench/<skill>.md`
- **JSONL raw (gitignored):** `coverage/cursor-bench/<timestamp>-<skill>.jsonl`

## Adding a fixture

Create `fixtures/<id>.ts` following `Fixture` type from `src/types.ts`.
```

- [ ] **Step 0.1.4: Run `bun run setup` to register workspace**

Run:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic && bun run setup
```

Expected: `bun install` resolves, `packages/cursor-agent-bench` linked as workspace.

- [ ] **Step 0.1.5: Commit**

```bash
git add packages/cursor-agent-bench/package.json packages/cursor-agent-bench/tsconfig.json packages/cursor-agent-bench/README.md bun.lock
git commit -m "feat(bench): scaffold cursor-agent-bench workspace package"
```

---

### Task 0.2: Update `.gitignore` + root scripts

**Files:**
- Modify: `.gitignore`
- Modify: `package.json` (root)

- [ ] **Step 0.2.1: Add bench JSONL dir to `.gitignore`**

Append to `.gitignore`:

```
# cursor-agent-bench raw artifacts (JSONL per run)
coverage/cursor-bench/
```

- [ ] **Step 0.2.2: Add root scripts to `package.json`**

In root `package.json` `"scripts"` object, add after existing `sync:upstream-patterns` line:

```json
    "skill:bench": "bun --filter @au-agentic/cursor-agent-bench bench",
    "skill:bench:smoke-real": "bun --filter @au-agentic/cursor-agent-bench bench:smoke-real"
```

- [ ] **Step 0.2.3: Verify scripts resolve**

Run:
```bash
bun run skill:bench --help 2>&1 | head -5
```

Expected: Either help text (if `src/index.ts` exists with `--help`) OR `Cannot find module src/index.ts` — both prove script routing works. Phase 1 creates the entry.

- [ ] **Step 0.2.4: Commit**

```bash
git add .gitignore package.json
git commit -m "chore(bench): wire root scripts + gitignore JSONL artifacts"
```

---

## Phase 1 — Types + Config

### Task 1.1: Define shared types

**Files:**
- Create: `packages/cursor-agent-bench/src/types.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/types.compile.test.ts`

- [ ] **Step 1.1.1: Write `types.ts`**

Create `packages/cursor-agent-bench/src/types.ts`:

```ts
export type AssertionKind = "includes" | "regex" | "exitCode" | "notIncludes";

export interface Assertion {
  kind: AssertionKind;
  pattern: string | RegExp | number;
  description?: string;
}

export interface Turn {
  prompt: string;
  assertions: Assertion[];
  timeoutMs?: number;
}

export interface Fixture {
  id: string;
  skill: string;
  description: string;
  maxTurns?: number;
  turns: Turn[];
}

export interface AssertionResult {
  kind: AssertionKind;
  description?: string;
  ok: boolean;
  reason?: string;
}

export type FailReason = "assertion" | "turn-timeout" | "budget-exceeded" | "spawn-error";

export interface EnvInfo {
  bun: string;
  cursorAgent: string;
  platform: string;
}

export interface ReproMetadata {
  commit: string;        // git rev-parse --short HEAD (8 char)
  skillChecksum: string; // sha256 first 8 char of skill SKILL.md
  env: EnvInfo;
}

export interface TurnResult {
  skill: string;
  fixture: string;
  model: string;
  runIndex: number;
  turn: number;
  input: string;
  output: string;           // truncated at 8192 char (DEC-022)
  outputTruncated: boolean;
  originalLen: number;
  outputDumpPath?: string;  // set only when turn fails (C11)
  durationMs: number;
  exitCode: number;
  pass: boolean;
  assertions: AssertionResult[];
  retried: boolean;
  timedOut: boolean;
  reason?: FailReason;
  commit: string;           // DEC-021 embed per-record
  skillChecksum: string;
  env: EnvInfo;
}

export interface BenchResult {
  startedAt: string;
  finishedAt: string;
  mode: "smoke" | "matrix";
  models: string[];
  fixtureIds: string[];
  runs: number;
  turns: TurnResult[];
  passCount: number;
  totalCount: number;
  wallClockMs: number;
  metadata: ReproMetadata;  // DEC-021/023
}

export interface CellStats {
  fixture: string;
  model: string;
  passCount: number;
  totalCount: number;
  passRate: number;           // 0..1
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  turnMean: number;
  retries: number;
  timeouts: number;
  budgetExceeded: number;
}

export interface ModelRanking {
  rank: number;
  model: string;
  passCount: number;
  totalCount: number;
  passRate: number;
  meanMs: number;
}

export interface AggregateReport {
  summary: {
    mode: "smoke" | "matrix";
    models: string[];
    fixtures: string[];
    runsPerCell: number;
    overallPass: number;
    overallTotal: number;
    overallPassRate: number;
    wallClockMs: number;
    totalRetries: number;
    totalTimeouts: number;
    totalBudgetExceeded: number;
    metadata: ReproMetadata;  // DEC-021/023
  };
  cells: CellStats[];
  ranking: ModelRanking[];
}

export interface BenchConfig {
  models: string[];
  defaultModel: string;
  defaultRuns: number;
  matrixRuns: number;
  perTurnTimeoutMs: number;
  perFixtureDeadlineMs: number;   // DEC-017 (20 min)
  maxTurns: number;
  retry: { max: number; delayMs: number };
  trackerDir: string;
  jsonlDir: string;
  fixturesDir: string;
}
```

- [ ] **Step 1.1.2: Write compile-only test**

Create `packages/cursor-agent-bench/src/__tests__/types.compile.test.ts`:

```ts
import { test, expect } from "bun:test";
import type { Fixture, BenchResult, BenchConfig } from "#src/types";

test("Fixture type accepts minimal shape", () => {
  const f: Fixture = {
    id: "x",
    skill: "y",
    description: "z",
    turns: [{ prompt: "p", assertions: [] }],
  };
  expect(f.id).toBe("x");
});

test("BenchResult discriminates mode", () => {
  const r: BenchResult = {
    startedAt: "2026-04-17",
    finishedAt: "2026-04-17",
    mode: "smoke",
    models: ["m"],
    fixtureIds: ["f"],
    runs: 1,
    turns: [],
    passCount: 0,
    totalCount: 0,
  };
  expect(r.mode).toBe("smoke");
});

test("BenchConfig requires retry shape", () => {
  const c: BenchConfig = {
    models: ["a"],
    defaultModel: "a",
    defaultRuns: 1,
    matrixRuns: 3,
    perTurnTimeoutMs: 120_000,
    maxTurns: 20,
    retry: { max: 1, delayMs: 2_000 },
    trackerDir: "t",
    jsonlDir: "j",
    fixturesDir: "f",
  };
  expect(c.retry.max).toBe(1);
});
```

- [ ] **Step 1.1.3: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/types.compile.test.ts
```

Expected: 3 pass, 0 fail.

- [ ] **Step 1.1.4: Commit**

```bash
git add packages/cursor-agent-bench/src/types.ts packages/cursor-agent-bench/src/__tests__/types.compile.test.ts
git commit -m "feat(bench): define shared types for fixtures, results, config"
```

---

### Task 1.2: Config defineConfig helper

**Files:**
- Create: `packages/cursor-agent-bench/src/config-define.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/config-define.test.ts`

- [ ] **Step 1.2.1: Write failing test first**

Create `packages/cursor-agent-bench/src/__tests__/config-define.test.ts`:

```ts
import { test, expect } from "bun:test";
import { defineConfig } from "#src/config-define";

test("defineConfig returns input unchanged when valid", () => {
  const cfg = defineConfig({
    models: ["m1", "m2"],
    defaultModel: "m1",
    defaultRuns: 1,
    matrixRuns: 3,
    perTurnTimeoutMs: 120_000,
    perFixtureDeadlineMs: 1_200_000,
    maxTurns: 20,
    retry: { max: 1, delayMs: 2_000 },
    trackerDir: "./tracker",
    jsonlDir: "./jsonl",
    fixturesDir: "./fixtures",
  });
  expect(cfg.models).toEqual(["m1", "m2"]);
  expect(cfg.defaultModel).toBe("m1");
});

test("defineConfig throws when defaultModel not in models[]", () => {
  expect(() =>
    defineConfig({
      models: ["m1"],
      defaultModel: "m2",
      defaultRuns: 1,
      matrixRuns: 3,
      perTurnTimeoutMs: 120_000,
      perFixtureDeadlineMs: 1_200_000,
      maxTurns: 20,
      retry: { max: 1, delayMs: 2_000 },
      trackerDir: "./t",
      jsonlDir: "./j",
      fixturesDir: "./f",
    }),
  ).toThrow(/defaultModel/);
});

test("defineConfig throws when models[] is empty", () => {
  expect(() =>
    defineConfig({
      models: [],
      defaultModel: "m1",
      defaultRuns: 1,
      matrixRuns: 3,
      perTurnTimeoutMs: 120_000,
      perFixtureDeadlineMs: 1_200_000,
      maxTurns: 20,
      retry: { max: 1, delayMs: 2_000 },
      trackerDir: "./t",
      jsonlDir: "./j",
      fixturesDir: "./f",
    }),
  ).toThrow(/models.+empty/);
});
```

- [ ] **Step 1.2.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/config-define.test.ts
```

Expected: FAIL — `Cannot find module #src/config-define`.

- [ ] **Step 1.2.3: Implement `config-define.ts`**

Create `packages/cursor-agent-bench/src/config-define.ts`:

```ts
import type { BenchConfig } from "#src/types";

export function defineConfig(input: BenchConfig): BenchConfig {
  if (input.models.length === 0) {
    throw new Error("cursor-bench.config: models[] must not be empty");
  }
  if (!input.models.includes(input.defaultModel)) {
    throw new Error(
      `cursor-bench.config: defaultModel "${input.defaultModel}" not in models[]`,
    );
  }
  return input;
}
```

- [ ] **Step 1.2.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/config-define.test.ts
```

Expected: 3 pass, 0 fail.

- [ ] **Step 1.2.5: Write root `cursor-bench.config.ts`**

Create `packages/cursor-agent-bench/cursor-bench.config.ts`:

```ts
import { defineConfig } from "#src/config-define";

export default defineConfig({
  models: [
    "composer-2-fast",
    "claude-4.5-sonnet",
    "gemini-3-flash",
    "gpt-5.4-mini-medium",
    "grok-4-20",
    "claude-4-sonnet-thinking",
    "grok-4-20-thinking",
  ],
  defaultModel: "composer-2-fast",
  defaultRuns: 1,
  matrixRuns: 3,
  perTurnTimeoutMs: 120_000,
  perFixtureDeadlineMs: 1_200_000,
  maxTurns: 20,
  retry: { max: 1, delayMs: 2_000 },
  trackerDir: "../../docs/superpowers/bench",
  jsonlDir: "../../coverage/cursor-bench",
  fixturesDir: "./fixtures",
});
```

- [ ] **Step 1.2.6: Commit**

```bash
git add packages/cursor-agent-bench/src/config-define.ts packages/cursor-agent-bench/cursor-bench.config.ts packages/cursor-agent-bench/src/__tests__/config-define.test.ts
git commit -m "feat(bench): defineConfig helper with validation + root config file"
```

---

### Task 1.3: Metadata collector (DEC-021, DEC-023 — C10 + C12)

**Files:**
- Create: `packages/cursor-agent-bench/src/metadata.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/metadata.test.ts`

- [ ] **Step 1.3.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/metadata.test.ts`:

```ts
import { test, expect } from "bun:test";
import { collectMetadata, shortSha256 } from "#src/metadata";

test("shortSha256 returns 8-char lowercase hex", () => {
  const h = shortSha256("hello world");
  expect(h).toMatch(/^[0-9a-f]{8}$/);
  expect(h).toBe("b94d27b9");
});

test("collectMetadata assembles commit + checksum + env via DI", async () => {
  const meta = await collectMetadata({
    readSkillFile: async () => "SKILL content",
    readGitSha: async () => "a1b2c3d4",
    readBunVersion: async () => "1.3.10",
    readCursorAgentVersion: async () => "2.4.1",
    readPlatform: async () => "darwin 24.6",
  });
  expect(meta.commit).toBe("a1b2c3d4");
  expect(meta.skillChecksum).toMatch(/^[0-9a-f]{8}$/);
  expect(meta.env.bun).toBe("1.3.10");
  expect(meta.env.cursorAgent).toBe("2.4.1");
  expect(meta.env.platform).toBe("darwin 24.6");
});

test("collectMetadata uses commit='unknown' when git spawn fails", async () => {
  const meta = await collectMetadata({
    readSkillFile: async () => "x",
    readGitSha: async () => null,
    readBunVersion: async () => "1.3.10",
    readCursorAgentVersion: async () => "2.4.1",
    readPlatform: async () => "darwin 24.6",
  });
  expect(meta.commit).toBe("unknown");
});

test("collectMetadata uses cursorAgent='unknown' when CLI spawn fails", async () => {
  const meta = await collectMetadata({
    readSkillFile: async () => "x",
    readGitSha: async () => "a1b2c3d4",
    readBunVersion: async () => "1.3.10",
    readCursorAgentVersion: async () => null,
    readPlatform: async () => "darwin 24.6",
  });
  expect(meta.env.cursorAgent).toBe("unknown");
});
```

- [ ] **Step 1.3.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/metadata.test.ts
```

Expected: FAIL — `Cannot find module #src/metadata`.

- [ ] **Step 1.3.3: Implement metadata collector**

Create `packages/cursor-agent-bench/src/metadata.ts`:

```ts
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { platform, release } from "node:os";
import type { ReproMetadata } from "#src/types";

export function shortSha256(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 8);
}

export interface MetadataDeps {
  readSkillFile: () => Promise<string>;
  readGitSha: () => Promise<string | null>;
  readBunVersion: () => Promise<string>;
  readCursorAgentVersion: () => Promise<string | null>;
  readPlatform: () => Promise<string>;
}

async function trySpawnStdout(cmd: string[]): Promise<string | null> {
  try {
    const p = Bun.spawnSync({ cmd, stdout: "pipe", stderr: "pipe" });
    if (p.exitCode !== 0) return null;
    const out = p.stdout.toString().trim();
    return out || null;
  } catch {
    return null;
  }
}

export function defaultDeps(skillPath: string): MetadataDeps {
  return {
    readSkillFile: () => readFile(skillPath, "utf8"),
    readGitSha: () => trySpawnStdout(["git", "rev-parse", "--short=8", "HEAD"]),
    readBunVersion: async () => Bun.version,
    readCursorAgentVersion: async () => {
      const out = await trySpawnStdout(["cursor-agent", "--version"]);
      if (!out) return null;
      // Take first token (strip "cursor-agent " prefix if present)
      const parts = out.split(/\s+/);
      return parts[parts.length - 1] ?? null;
    },
    readPlatform: async () => `${platform()} ${release()}`,
  };
}

export async function collectMetadata(deps: MetadataDeps): Promise<ReproMetadata> {
  const [skill, commit, bunV, cursorV, plat] = await Promise.all([
    deps.readSkillFile(),
    deps.readGitSha(),
    deps.readBunVersion(),
    deps.readCursorAgentVersion(),
    deps.readPlatform(),
  ]);
  return {
    commit: commit ?? "unknown",
    skillChecksum: shortSha256(skill),
    env: {
      bun: bunV,
      cursorAgent: cursorV ?? "unknown",
      platform: plat,
    },
  };
}
```

- [ ] **Step 1.3.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/metadata.test.ts
```

Expected: 4 pass, 0 fail.

- [ ] **Step 1.3.5: Commit**

```bash
git add packages/cursor-agent-bench/src/metadata.ts packages/cursor-agent-bench/src/__tests__/metadata.test.ts
git commit -m "feat(bench): metadata collector (git SHA + skill checksum + env)"
```

---

### Task 1.4: Output truncate + dump helper (DEC-022, C11)

**Files:**
- Create: `packages/cursor-agent-bench/src/truncate.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/truncate.test.ts`

- [ ] **Step 1.4.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/truncate.test.ts`:

```ts
import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { truncateOutput, dumpPathFor, writeDump, TRUNCATE_LIMIT } from "#src/truncate";

test("TRUNCATE_LIMIT is 8192 (8KB)", () => {
  expect(TRUNCATE_LIMIT).toBe(8192);
});

test("truncateOutput leaves short string unchanged", () => {
  const { output, outputTruncated, originalLen } = truncateOutput("hello");
  expect(output).toBe("hello");
  expect(outputTruncated).toBe(false);
  expect(originalLen).toBe(5);
});

test("truncateOutput cuts at 8192 chars and flags truncation", () => {
  const input = "x".repeat(10_000);
  const r = truncateOutput(input);
  expect(r.output.length).toBe(8192);
  expect(r.outputTruncated).toBe(true);
  expect(r.originalLen).toBe(10_000);
});

test("dumpPathFor produces deterministic path format", () => {
  const p = dumpPathFor({
    dir: "/tmp/dump",
    startedAt: new Date("2026-04-17T10:42:00Z"),
    skill: "interview",
    fixture: "interview-phase1",
    model: "gemini-3-flash",
    runIndex: 2,
    turn: 3,
  });
  expect(p).toMatch(
    /2026-04-17T10-42-00.+interview-fixture-interview-phase1-m-gemini-3-flash-r2-t3\.txt$/,
  );
});

let dir = "";
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "bench-dump-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("writeDump writes full output to file and returns path", async () => {
  const path = await writeDump({
    dir,
    startedAt: new Date("2026-04-17T10:42:00Z"),
    skill: "s",
    fixture: "f",
    model: "m",
    runIndex: 0,
    turn: 0,
    output: "FULL LLM OUTPUT",
  });
  const content = await readFile(path, "utf8");
  expect(content).toBe("FULL LLM OUTPUT");
});
```

- [ ] **Step 1.4.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/truncate.test.ts
```

Expected: FAIL — `Cannot find module #src/truncate`.

- [ ] **Step 1.4.3: Implement truncate + dump**

Create `packages/cursor-agent-bench/src/truncate.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const TRUNCATE_LIMIT = 8192;

export interface TruncateResult {
  output: string;
  outputTruncated: boolean;
  originalLen: number;
}

export function truncateOutput(raw: string): TruncateResult {
  if (raw.length <= TRUNCATE_LIMIT) {
    return { output: raw, outputTruncated: false, originalLen: raw.length };
  }
  return {
    output: raw.slice(0, TRUNCATE_LIMIT),
    outputTruncated: true,
    originalLen: raw.length,
  };
}

export interface DumpContext {
  dir: string;
  startedAt: Date;
  skill: string;
  fixture: string;
  model: string;
  runIndex: number;
  turn: number;
}

function timestamp(d: Date): string {
  return d.toISOString().replace(/[:]/g, "-").replace(/\..+/, "");
}

export function dumpPathFor(ctx: DumpContext): string {
  const safeModel = ctx.model.replace(/[^A-Za-z0-9._-]/g, "_");
  const filename = `${timestamp(ctx.startedAt)}-${ctx.skill}-fixture-${ctx.fixture}-m-${safeModel}-r${ctx.runIndex}-t${ctx.turn}.txt`;
  return join(ctx.dir, filename);
}

export async function writeDump(
  ctx: DumpContext & { output: string },
): Promise<string> {
  const p = dumpPathFor(ctx);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, ctx.output, "utf8");
  return p;
}
```

- [ ] **Step 1.4.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/truncate.test.ts
```

Expected: 5 pass, 0 fail.

- [ ] **Step 1.4.5: Commit**

```bash
git add packages/cursor-agent-bench/src/truncate.ts packages/cursor-agent-bench/src/__tests__/truncate.test.ts
git commit -m "feat(bench): output truncate (8KB) + dump-on-fail helper"
```

---

## Phase 2 — Eval L1 Matchers

### Task 2.1: Implement assertion matchers

**Files:**
- Create: `packages/cursor-agent-bench/src/eval/l1.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/eval-l1.test.ts`

- [ ] **Step 2.1.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/eval-l1.test.ts`:

```ts
import { test, expect } from "bun:test";
import { evalAssertion } from "#src/eval/l1";

test("includes matcher passes when pattern in output", () => {
  const r = evalAssertion(
    { kind: "includes", pattern: "hello" },
    { output: "hello world", exitCode: 0 },
  );
  expect(r.ok).toBe(true);
});

test("includes matcher fails when pattern absent", () => {
  const r = evalAssertion(
    { kind: "includes", pattern: "xyz" },
    { output: "hello world", exitCode: 0 },
  );
  expect(r.ok).toBe(false);
  expect(r.reason).toMatch(/not found/i);
});

test("notIncludes matcher passes when pattern absent", () => {
  const r = evalAssertion(
    { kind: "notIncludes", pattern: "error" },
    { output: "all good", exitCode: 0 },
  );
  expect(r.ok).toBe(true);
});

test("regex matcher works with RegExp pattern", () => {
  const r = evalAssertion(
    { kind: "regex", pattern: /recommended/i },
    { output: "This is RECOMMENDED", exitCode: 0 },
  );
  expect(r.ok).toBe(true);
});

test("regex matcher compiles string pattern", () => {
  const r = evalAssertion(
    { kind: "regex", pattern: "^turn\\s+\\d+" },
    { output: "Turn 3 complete", exitCode: 0 },
  );
  expect(r.ok).toBe(false);
});

test("exitCode matcher compares numeric", () => {
  const r = evalAssertion(
    { kind: "exitCode", pattern: 0 },
    { output: "", exitCode: 0 },
  );
  expect(r.ok).toBe(true);
  const r2 = evalAssertion(
    { kind: "exitCode", pattern: 0 },
    { output: "", exitCode: 1 },
  );
  expect(r2.ok).toBe(false);
});

test("unknown kind returns ok=false with reason", () => {
  const r = evalAssertion(
    { kind: "bogus" as never, pattern: "x" },
    { output: "", exitCode: 0 },
  );
  expect(r.ok).toBe(false);
  expect(r.reason).toMatch(/unknown/i);
});
```

- [ ] **Step 2.1.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/eval-l1.test.ts
```

Expected: FAIL — `Cannot find module #src/eval/l1`.

- [ ] **Step 2.1.3: Implement matchers**

Create `packages/cursor-agent-bench/src/eval/l1.ts`:

```ts
import type { Assertion, AssertionResult } from "#src/types";

interface Context {
  output: string;
  exitCode: number;
}

export function evalAssertion(a: Assertion, ctx: Context): AssertionResult {
  const base = { kind: a.kind, description: a.description };
  switch (a.kind) {
    case "includes": {
      const ok = ctx.output.includes(String(a.pattern));
      return {
        ...base,
        ok,
        reason: ok ? undefined : `pattern "${String(a.pattern)}" not found in output`,
      };
    }
    case "notIncludes": {
      const ok = !ctx.output.includes(String(a.pattern));
      return {
        ...base,
        ok,
        reason: ok ? undefined : `pattern "${String(a.pattern)}" unexpectedly present`,
      };
    }
    case "regex": {
      const re = a.pattern instanceof RegExp ? a.pattern : new RegExp(String(a.pattern));
      const ok = re.test(ctx.output);
      return {
        ...base,
        ok,
        reason: ok ? undefined : `regex ${re} did not match output`,
      };
    }
    case "exitCode": {
      const ok = ctx.exitCode === Number(a.pattern);
      return {
        ...base,
        ok,
        reason: ok ? undefined : `exitCode ${ctx.exitCode} !== ${a.pattern}`,
      };
    }
    default:
      return { ...base, ok: false, reason: `unknown assertion kind: ${String(a.kind)}` };
  }
}
```

- [ ] **Step 2.1.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/eval-l1.test.ts
```

Expected: 7 pass, 0 fail.

- [ ] **Step 2.1.5: Commit**

```bash
git add packages/cursor-agent-bench/src/eval/l1.ts packages/cursor-agent-bench/src/__tests__/eval-l1.test.ts
git commit -m "feat(bench): L1 eval matchers (includes, notIncludes, regex, exitCode)"
```

---

## Phase 3 — Preflight (DEC-018, C5 + C6)

### Task 3.1: Preflight command-level check (binary + `status`/`whoami` fallback)

**Files:**
- Create: `packages/cursor-agent-bench/src/preflight.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/preflight.test.ts`

- [ ] **Step 3.1.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/preflight.test.ts`:

```ts
import { test, expect } from "bun:test";
import { preflightCheck } from "#src/preflight";

const okCmd = async () => ({ exitCode: 0, stdout: "logged in as user@x.com", stderr: "" });
const failCmd = async () => ({ exitCode: 1, stdout: "", stderr: "not logged in" });
const emptyCmd = async () => ({ exitCode: 0, stdout: "", stderr: "" });

test("preflight passes when binary present and status returns info", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => "/usr/local/bin/cursor-agent",
    runStatus: okCmd,
    runWhoami: failCmd,
  });
  expect(r.ok).toBe(true);
});

test("preflight fails exit 2 when binary missing (C5)", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => null,
    runStatus: okCmd,
    runWhoami: okCmd,
  });
  expect(r.ok).toBe(false);
  expect(r.exitCode).toBe(2);
  expect(r.message).toMatch(/cursor-agent.+not found/i);
});

test("preflight falls back from status to whoami when status fails (C6)", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => "/usr/local/bin/cursor-agent",
    runStatus: failCmd,
    runWhoami: okCmd,
  });
  expect(r.ok).toBe(true);
});

test("preflight fails exit 2 when both status + whoami fail (C6)", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => "/usr/local/bin/cursor-agent",
    runStatus: failCmd,
    runWhoami: failCmd,
  });
  expect(r.ok).toBe(false);
  expect(r.exitCode).toBe(2);
  expect(r.message).toMatch(/cursor-agent login/);
});

test("preflight fails when status exit=0 but stdout empty (stale session)", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => "/usr/local/bin/cursor-agent",
    runStatus: emptyCmd,
    runWhoami: emptyCmd,
  });
  expect(r.ok).toBe(false);
  expect(r.message).toMatch(/cursor-agent login/);
});
```

- [ ] **Step 3.1.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/preflight.test.ts
```

Expected: FAIL — `Cannot find module #src/preflight`.

- [ ] **Step 3.1.3: Implement preflight with command-level check**

Create `packages/cursor-agent-bench/src/preflight.ts`:

```ts
export interface CmdResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface PreflightDeps {
  whichCursorAgent: () => Promise<string | null>;
  runStatus: () => Promise<CmdResult>;
  runWhoami: () => Promise<CmdResult>;
}

export interface PreflightResult {
  ok: boolean;
  exitCode: number;
  message?: string;
}

async function runCmd(cmd: string[]): Promise<CmdResult> {
  const p = Bun.spawnSync({ cmd, stdout: "pipe", stderr: "pipe" });
  return {
    exitCode: p.exitCode,
    stdout: p.stdout.toString().trim(),
    stderr: p.stderr.toString().trim(),
  };
}

export const defaultDeps: PreflightDeps = {
  whichCursorAgent: async () => {
    const r = await runCmd(["which", "cursor-agent"]);
    return r.exitCode === 0 && r.stdout ? r.stdout : null;
  },
  runStatus: () => runCmd(["cursor-agent", "status"]),
  runWhoami: () => runCmd(["cursor-agent", "whoami"]),
};

function isLoggedIn(r: CmdResult): boolean {
  return r.exitCode === 0 && r.stdout.length > 0;
}

export async function preflightCheck(
  deps: PreflightDeps = defaultDeps,
): Promise<PreflightResult> {
  const cli = await deps.whichCursorAgent();
  if (!cli) {
    return {
      ok: false,
      exitCode: 2,
      message:
        "cursor-agent binary not found on PATH. Install: curl https://cursor.com/install -fsSL | bash",
    };
  }
  const status = await deps.runStatus();
  if (isLoggedIn(status)) return { ok: true, exitCode: 0 };

  const whoami = await deps.runWhoami();
  if (isLoggedIn(whoami)) return { ok: true, exitCode: 0 };

  return {
    ok: false,
    exitCode: 2,
    message: "Not logged in to Cursor. Run: cursor-agent login",
  };
}
```

- [ ] **Step 3.1.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/preflight.test.ts
```

Expected: 5 pass, 0 fail.

- [ ] **Step 3.1.5: Commit**

```bash
git add packages/cursor-agent-bench/src/preflight.ts packages/cursor-agent-bench/src/__tests__/preflight.test.ts
git commit -m "feat(bench): preflight command-level check (binary + status → whoami fallback)"
```

---

## Phase 4 — Fixture Loader

### Task 4.1: Fixture loader + validator

**Files:**
- Create: `packages/cursor-agent-bench/src/fixture.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/fixture.test.ts`

- [ ] **Step 4.1.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/fixture.test.ts`:

```ts
import { test, expect } from "bun:test";
import { validateFixture } from "#src/fixture";
import type { Fixture } from "#src/types";

test("validateFixture accepts minimal valid fixture", () => {
  const f: Fixture = {
    id: "x",
    skill: "y",
    description: "z",
    turns: [{ prompt: "p", assertions: [{ kind: "exitCode", pattern: 0 }] }],
  };
  expect(() => validateFixture(f)).not.toThrow();
});

test("validateFixture throws when id missing", () => {
  expect(() => validateFixture({} as Fixture)).toThrow(/id/);
});

test("validateFixture throws when turns empty", () => {
  expect(() =>
    validateFixture({
      id: "x",
      skill: "y",
      description: "z",
      turns: [],
    }),
  ).toThrow(/turns/);
});

test("validateFixture throws when turn has no prompt", () => {
  expect(() =>
    validateFixture({
      id: "x",
      skill: "y",
      description: "z",
      turns: [{ prompt: "", assertions: [] }],
    }),
  ).toThrow(/prompt/);
});

test("validateFixture allows turn with zero assertions (smoke)", () => {
  expect(() =>
    validateFixture({
      id: "x",
      skill: "y",
      description: "z",
      turns: [{ prompt: "p", assertions: [] }],
    }),
  ).not.toThrow();
});

test("validateFixture rejects maxTurns < turns.length", () => {
  expect(() =>
    validateFixture({
      id: "x",
      skill: "y",
      description: "z",
      maxTurns: 1,
      turns: [
        { prompt: "p1", assertions: [] },
        { prompt: "p2", assertions: [] },
      ],
    }),
  ).toThrow(/maxTurns/);
});
```

- [ ] **Step 4.1.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/fixture.test.ts
```

Expected: FAIL — `Cannot find module #src/fixture`.

- [ ] **Step 4.1.3: Implement loader + validator**

Create `packages/cursor-agent-bench/src/fixture.ts`:

```ts
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Fixture } from "#src/types";

export function validateFixture(f: Fixture): void {
  if (!f.id) throw new Error("fixture: id is required");
  if (!f.skill) throw new Error(`fixture ${f.id}: skill is required`);
  if (!f.description) throw new Error(`fixture ${f.id}: description is required`);
  if (!Array.isArray(f.turns) || f.turns.length === 0) {
    throw new Error(`fixture ${f.id}: turns must be non-empty array`);
  }
  if (f.maxTurns !== undefined && f.maxTurns < f.turns.length) {
    throw new Error(
      `fixture ${f.id}: maxTurns (${f.maxTurns}) < turns.length (${f.turns.length})`,
    );
  }
  for (const [i, t] of f.turns.entries()) {
    if (!t.prompt) throw new Error(`fixture ${f.id} turn ${i}: prompt required`);
    if (!Array.isArray(t.assertions)) {
      throw new Error(`fixture ${f.id} turn ${i}: assertions must be array`);
    }
  }
}

export async function loadAllFixtures(dir: string): Promise<Fixture[]> {
  const abs = resolve(dir);
  const entries = await readdir(abs);
  const fixtures: Fixture[] = [];
  for (const file of entries) {
    if (!file.endsWith(".ts")) continue;
    const mod = await import(join(abs, file));
    const f = mod.default as Fixture;
    validateFixture(f);
    fixtures.push(f);
  }
  return fixtures;
}

export async function loadFixtureById(
  dir: string,
  id: string,
): Promise<Fixture> {
  const all = await loadAllFixtures(dir);
  const found = all.find((f) => f.id === id);
  if (!found) throw new Error(`fixture not found: ${id}`);
  return found;
}
```

- [ ] **Step 4.1.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/fixture.test.ts
```

Expected: 6 pass, 0 fail.

- [ ] **Step 4.1.5: Commit**

```bash
git add packages/cursor-agent-bench/src/fixture.ts packages/cursor-agent-bench/src/__tests__/fixture.test.ts
git commit -m "feat(bench): fixture loader + schema validator"
```

---

## Phase 5 — Runner (spawn loop, retry, timeout)

### Task 5.1: Runner with dependency-injected spawn

**Files:**
- Create: `packages/cursor-agent-bench/src/runner.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/runner.test.ts`

- [ ] **Step 5.1.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/runner.test.ts`:

```ts
import { test, expect } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runFixture } from "#src/runner";
import type { Fixture, BenchConfig, ReproMetadata } from "#src/types";

const fakeMeta: ReproMetadata = {
  commit: "deadbeef",
  skillChecksum: "cafebabe",
  env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "test 0.0" },
};

async function tmp(): Promise<string> {
  return mkdtemp(join(tmpdir(), "bench-run-"));
}

const baseConfig: BenchConfig = {
  models: ["m1"],
  defaultModel: "m1",
  defaultRuns: 1,
  matrixRuns: 3,
  perTurnTimeoutMs: 1_000,
  perFixtureDeadlineMs: 60_000,
  maxTurns: 20,
  retry: { max: 1, delayMs: 10 },
  trackerDir: "",
  jsonlDir: "",
  fixturesDir: "",
};

const fx: Fixture = {
  id: "t",
  skill: "interview",
  description: "test",
  turns: [
    { prompt: "say hello", assertions: [{ kind: "includes", pattern: "hello" }] },
  ],
};

test("runner returns passing TurnResult when spawn output matches", async () => {
  const fakeSpawn = async () => ({
    stdout: "hello world",
    stderr: "",
    exitCode: 0,
    durationMs: 50,
    timedOut: false,
  });
  const dumpDir = await tmp();
  const results = await runFixture(fx, {
    config: baseConfig,
    model: "m1",
    runIndex: 0,
    metadata: fakeMeta,
    dumpDir,
    startedAt: new Date("2026-04-17T00:00:00Z"),
    spawn: fakeSpawn,
    sleep: async () => {},
  });
  await rm(dumpDir, { recursive: true, force: true });
  expect(results).toHaveLength(1);
  expect(results[0]!.pass).toBe(true);
  expect(results[0]!.retried).toBe(false);
});

test("runner retries once on spawn error, then succeeds", async () => {
  let calls = 0;
  const fakeSpawn = async () => {
    calls++;
    if (calls === 1) throw new Error("spawn failed");
    return {
      stdout: "hello there",
      stderr: "",
      exitCode: 0,
      durationMs: 50,
      timedOut: false,
    };
  };
  const dumpDir = await tmp();
  const results = await runFixture(fx, {
    config: baseConfig,
    model: "m1",
    runIndex: 0,
    metadata: fakeMeta,
    dumpDir,
    startedAt: new Date("2026-04-17T00:00:00Z"),
    spawn: fakeSpawn,
    sleep: async () => {},
  });
  await rm(dumpDir, { recursive: true, force: true });
  expect(calls).toBe(2);
  expect(results[0]!.pass).toBe(true);
  expect(results[0]!.retried).toBe(true);
});

test("runner marks turn failed on assertion mismatch, no retry", async () => {
  let calls = 0;
  const fakeSpawn = async () => {
    calls++;
    return {
      stdout: "unrelated",
      stderr: "",
      exitCode: 0,
      durationMs: 20,
      timedOut: false,
    };
  };
  const dumpDir = await tmp();
  const results = await runFixture(fx, {
    config: baseConfig,
    model: "m1",
    runIndex: 0,
    metadata: fakeMeta,
    dumpDir,
    startedAt: new Date("2026-04-17T00:00:00Z"),
    spawn: fakeSpawn,
    sleep: async () => {},
  });
  await rm(dumpDir, { recursive: true, force: true });
  expect(calls).toBe(1);
  expect(results[0]!.pass).toBe(false);
});

test("runner marks timedOut when spawn reports it", async () => {
  const fakeSpawn = async () => ({
    stdout: "",
    stderr: "",
    exitCode: 124,
    durationMs: 1_000,
    timedOut: true,
  });
  const dumpDir = await tmp();
  const results = await runFixture(fx, {
    config: baseConfig,
    model: "m1",
    runIndex: 0,
    metadata: fakeMeta,
    dumpDir,
    startedAt: new Date("2026-04-17T00:00:00Z"),
    spawn: fakeSpawn,
    sleep: async () => {},
  });
  await rm(dumpDir, { recursive: true, force: true });
  expect(results[0]!.timedOut).toBe(true);
  expect(results[0]!.pass).toBe(false);
});

test("runner kills fixture when per-fixture deadline exceeded (C4, DEC-017)", async () => {
  const shortDeadlineConfig = { ...baseConfig, perFixtureDeadlineMs: 50 };
  const fakeSpawn = async () => {
    await new Promise((r) => setTimeout(r, 80));
    return { stdout: "hello", stderr: "", exitCode: 0, durationMs: 80, timedOut: false };
  };
  const fx2: Fixture = {
    id: "long",
    skill: "x",
    description: "d",
    turns: [
      { prompt: "a", assertions: [] },
      { prompt: "b", assertions: [] },
      { prompt: "c", assertions: [] },
    ],
  };
  const dumpDir = await tmp();
  const results = await runFixture(fx2, {
    config: shortDeadlineConfig,
    model: "m1",
    runIndex: 0,
    metadata: fakeMeta,
    dumpDir,
    startedAt: new Date("2026-04-17T00:00:00Z"),
    spawn: fakeSpawn,
    sleep: async () => {},
  });
  await rm(dumpDir, { recursive: true, force: true });
  const last = results[results.length - 1]!;
  expect(last.pass).toBe(false);
  expect(last.reason).toBe("budget-exceeded");
});

test("runner respects fixture.maxTurns override", async () => {
  const fx2: Fixture = {
    id: "t2",
    skill: "interview",
    description: "test",
    maxTurns: 1,
    turns: [
      { prompt: "a", assertions: [] },
      { prompt: "b", assertions: [] },
    ],
  };
  // Should have thrown at validation earlier, but runner should also guard:
  // With valid fixture (maxTurns >= turns.length), check stop-early behavior:
  const fx3: Fixture = {
    id: "t3",
    skill: "interview",
    description: "test",
    maxTurns: 2,
    turns: [
      { prompt: "a", assertions: [] },
      { prompt: "b", assertions: [] },
    ],
  };
  let calls = 0;
  const fakeSpawn = async () => {
    calls++;
    return { stdout: "", stderr: "", exitCode: 0, durationMs: 1, timedOut: false };
  };
  const dumpDir = await tmp();
  await runFixture(fx3, {
    config: baseConfig,
    model: "m1",
    runIndex: 0,
    metadata: fakeMeta,
    dumpDir,
    startedAt: new Date("2026-04-17T00:00:00Z"),
    spawn: fakeSpawn,
    sleep: async () => {},
  });
  await rm(dumpDir, { recursive: true, force: true });
  expect(calls).toBe(2);
});

test("runner embeds metadata + truncates long output + dumps on fail", async () => {
  const longOutput = "x".repeat(20_000);
  const fakeSpawn = async () => ({
    stdout: longOutput,
    stderr: "",
    exitCode: 0,
    durationMs: 20,
    timedOut: false,
  });
  const fxMiss: Fixture = {
    id: "long",
    skill: "s",
    description: "d",
    turns: [
      { prompt: "p", assertions: [{ kind: "includes", pattern: "never-present-xyz" }] },
    ],
  };
  const dumpDir = await tmp();
  const results = await runFixture(fxMiss, {
    config: baseConfig,
    model: "m1",
    runIndex: 0,
    metadata: fakeMeta,
    dumpDir,
    startedAt: new Date("2026-04-17T00:00:00Z"),
    spawn: fakeSpawn,
    sleep: async () => {},
  });
  const r = results[0]!;
  expect(r.commit).toBe("deadbeef");
  expect(r.skillChecksum).toBe("cafebabe");
  expect(r.env.bun).toBe("1.3.10");
  expect(r.outputTruncated).toBe(true);
  expect(r.originalLen).toBe(20_000);
  expect(r.output.length).toBe(8192);
  expect(r.pass).toBe(false);
  expect(r.outputDumpPath).toBeDefined();
  await rm(dumpDir, { recursive: true, force: true });
});
```

- [ ] **Step 5.1.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/runner.test.ts
```

Expected: FAIL — `Cannot find module #src/runner`.

- [ ] **Step 5.1.3: Implement runner**

Create `packages/cursor-agent-bench/src/runner.ts`:

```ts
import type {
  Fixture,
  BenchConfig,
  TurnResult,
  AssertionResult,
  ReproMetadata,
} from "#src/types";
import { evalAssertion } from "#src/eval/l1";
import { truncateOutput, writeDump } from "#src/truncate";

export interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  sessionId?: string;
}

export interface SpawnArgs {
  model: string;
  prompt: string;
  resumeId?: string;
  timeoutMs: number;
}

export type SpawnFn = (args: SpawnArgs) => Promise<SpawnResult>;

export interface RunFixtureOpts {
  config: BenchConfig;
  model: string;
  runIndex: number;
  metadata: ReproMetadata;
  dumpDir: string;
  startedAt: Date;
  spawn: SpawnFn;
  sleep: (ms: number) => Promise<void>;
}

export async function runFixture(
  fixture: Fixture,
  opts: RunFixtureOpts,
): Promise<TurnResult[]> {
  const { config, model, runIndex, metadata, dumpDir, startedAt, spawn, sleep } = opts;
  const results: TurnResult[] = [];
  const cap = Math.min(fixture.turns.length, fixture.maxTurns ?? config.maxTurns);
  const deadline = Date.now() + config.perFixtureDeadlineMs;
  let resumeId: string | undefined;

  const capture = (r: SpawnResult): void => {
    if (r.sessionId) resumeId = r.sessionId;
  };

  const baseMetadata = {
    commit: metadata.commit,
    skillChecksum: metadata.skillChecksum,
    env: metadata.env,
  };

  const budgetExceededResult = (i: number, turnPrompt: string): TurnResult => ({
    skill: fixture.skill,
    fixture: fixture.id,
    model,
    runIndex,
    turn: i,
    input: turnPrompt,
    output: "",
    outputTruncated: false,
    originalLen: 0,
    durationMs: 0,
    exitCode: -1,
    pass: false,
    assertions: [],
    retried: false,
    timedOut: true,
    reason: "budget-exceeded",
    ...baseMetadata,
  });

  for (let i = 0; i < cap; i++) {
    if (Date.now() >= deadline) {
      results.push(budgetExceededResult(i, fixture.turns[i]!.prompt));
      break;
    }
    const turn = fixture.turns[i]!;
    const timeoutMs = Math.min(
      turn.timeoutMs ?? config.perTurnTimeoutMs,
      Math.max(0, deadline - Date.now()),
    );
    if (timeoutMs === 0) {
      results.push(budgetExceededResult(i, turn.prompt));
      break;
    }
    let spawnRes: SpawnResult | null = null;
    let lastErr: unknown = null;
    let retried = false;

    for (let attempt = 0; attempt <= config.retry.max; attempt++) {
      try {
        spawnRes = await spawn({ model, prompt: turn.prompt, resumeId, timeoutMs });
        if (spawnRes.timedOut && attempt < config.retry.max) {
          retried = true;
          await sleep(config.retry.delayMs);
          continue;
        }
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < config.retry.max) {
          retried = true;
          await sleep(config.retry.delayMs);
          continue;
        }
        break;
      }
    }

    if (!spawnRes) {
      results.push({
        skill: fixture.skill,
        fixture: fixture.id,
        model,
        runIndex,
        turn: i,
        input: turn.prompt,
        output: "",
        outputTruncated: false,
        originalLen: 0,
        durationMs: 0,
        exitCode: -1,
        pass: false,
        assertions: [
          {
            kind: "exitCode",
            ok: false,
            reason: `spawn failed after retries: ${String(lastErr)}`,
          },
        ],
        retried,
        timedOut: false,
        reason: "spawn-error",
        ...baseMetadata,
      });
      break;
    }

    capture(spawnRes);
    const assertions: AssertionResult[] = turn.assertions.map((a) =>
      evalAssertion(a, { output: spawnRes!.stdout, exitCode: spawnRes!.exitCode }),
    );
    const pass =
      !spawnRes.timedOut &&
      spawnRes.exitCode === 0 &&
      assertions.every((a) => a.ok);

    let reason: TurnResult["reason"];
    if (!pass) {
      reason = spawnRes.timedOut ? "turn-timeout" : "assertion";
    }

    const trunc = truncateOutput(spawnRes.stdout);
    let outputDumpPath: string | undefined;
    if (!pass) {
      outputDumpPath = await writeDump({
        dir: dumpDir,
        startedAt,
        skill: fixture.skill,
        fixture: fixture.id,
        model,
        runIndex,
        turn: i,
        output: spawnRes.stdout,
      });
    }

    results.push({
      skill: fixture.skill,
      fixture: fixture.id,
      model,
      runIndex,
      turn: i,
      input: turn.prompt,
      output: trunc.output,
      outputTruncated: trunc.outputTruncated,
      originalLen: trunc.originalLen,
      outputDumpPath,
      durationMs: spawnRes.durationMs,
      exitCode: spawnRes.exitCode,
      pass,
      assertions,
      retried,
      timedOut: spawnRes.timedOut,
      reason,
      ...baseMetadata,
    });

    if (!pass) break;
  }

  return results;
}
```

- [ ] **Step 5.1.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/runner.test.ts
```

Expected: 7 pass, 0 fail.

- [ ] **Step 5.1.5: Commit**

```bash
git add packages/cursor-agent-bench/src/runner.ts packages/cursor-agent-bench/src/__tests__/runner.test.ts
git commit -m "feat(bench): multi-turn runner with retry, per-turn timeout, 20min fixture deadline"
```

---

### Task 5.2: Real `cursor-agent` spawn adapter

**Files:**
- Create: `packages/cursor-agent-bench/src/spawn-cursor-agent.ts`

- [ ] **Step 5.2.1: Implement real spawn adapter**

Create `packages/cursor-agent-bench/src/spawn-cursor-agent.ts`:

```ts
import type { SpawnArgs, SpawnResult, SpawnFn } from "#src/runner";

const SESSION_RE = /(?:session[_ -]?id|sid)[:=]\s*([A-Za-z0-9_-]{6,})/i;

export function extractSessionId(stdout: string, stderr: string): string | undefined {
  for (const src of [stderr, stdout]) {
    const m = src.match(SESSION_RE);
    if (m) return m[1];
  }
  return undefined;
}

export const spawnCursorAgent: SpawnFn = async (args: SpawnArgs): Promise<SpawnResult> => {
  const cmd = [
    "cursor-agent",
    "--print",
    "--output-format", "text",
    "--model", args.model,
    ...(args.resumeId ? ["--resume", args.resumeId] : []),
    args.prompt,
  ];
  const start = performance.now();
  const proc = Bun.spawn({
    cmd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const timer = setTimeout(() => {
    try {
      proc.kill();
    } catch {}
  }, args.timeoutMs);
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  clearTimeout(timer);
  const durationMs = Math.round(performance.now() - start);
  const timedOut = durationMs >= args.timeoutMs && exitCode !== 0;
  const sessionId = extractSessionId(stdout, stderr);
  return { stdout, stderr, exitCode, durationMs, timedOut, sessionId };
};
```

- [ ] **Step 5.2.2: Verify session-id regex against real Cursor CLI output**

Run:
```bash
cursor-agent --print --output-format text --model composer-2-fast "say hello" 2>&1 | head -20
```

Inspect stdout/stderr for a session id line. If the real format differs from the `SESSION_RE` regex (`session[_ -]?id|sid`), update the regex in `extractSessionId` to match. The regex must capture the exact token needed for `--resume`. If Cursor CLI does NOT print a session id in text mode, switch the spawn adapter to `--output-format json` and parse the JSON envelope for the session id field.

- [ ] **Step 5.2.3: Add unit test for extractSessionId**

Append to `packages/cursor-agent-bench/src/__tests__/runner.test.ts` (or create a new file `src/__tests__/extract-session.test.ts`):

```ts
import { test, expect } from "bun:test";
import { extractSessionId } from "#src/spawn-cursor-agent";

test("extractSessionId captures sessionId from stdout", () => {
  expect(extractSessionId("session_id: abc123def", "")).toBe("abc123def");
});

test("extractSessionId captures sid from stderr", () => {
  expect(extractSessionId("", "sid=xyz-789_ok")).toBe("xyz-789_ok");
});

test("extractSessionId returns undefined when no match", () => {
  expect(extractSessionId("hello world", "no error")).toBeUndefined();
});
```

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/
```

Expected: all tests pass including new extractSessionId ones.

- [ ] **Step 5.2.4: Commit**

```bash
git add packages/cursor-agent-bench/src/spawn-cursor-agent.ts packages/cursor-agent-bench/src/__tests__/
git commit -m "feat(bench): real cursor-agent spawn adapter with session-id capture"
```

Note: Unit tests use DI fake; this adapter's end-to-end path is exercised in the opt-in `bench:smoke-real` tier (Phase 10).

---

## Phase 6 — Report (Aggregate + JSONL + Markdown)

### Task 6.0: Aggregate metrics (DEC-020, C9)

**Files:**
- Create: `packages/cursor-agent-bench/src/report/aggregate.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/report-aggregate.test.ts`

- [ ] **Step 6.0.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/report-aggregate.test.ts`:

```ts
import { test, expect } from "bun:test";
import { aggregate, percentile } from "#src/report/aggregate";
import type { TurnResult, BenchResult } from "#src/types";

const fakeMeta = {
  commit: "deadbeef",
  skillChecksum: "cafebabe",
  env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "test" },
};

const mk = (model: string, fixture: string, pass: boolean, ms: number, run = 0): TurnResult => ({
  skill: "interview",
  fixture,
  model,
  runIndex: run,
  turn: 0,
  input: "i",
  output: "o",
  outputTruncated: false,
  originalLen: 1,
  durationMs: ms,
  exitCode: pass ? 0 : 1,
  pass,
  assertions: [],
  retried: false,
  timedOut: false,
  commit: fakeMeta.commit,
  skillChecksum: fakeMeta.skillChecksum,
  env: fakeMeta.env,
});

test("percentile returns correct p50 and p95", () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  expect(percentile(xs, 50)).toBe(5);
  expect(percentile(xs, 95)).toBe(10);
});

test("percentile handles single element", () => {
  expect(percentile([42], 50)).toBe(42);
  expect(percentile([42], 95)).toBe(42);
});

test("percentile returns 0 for empty array", () => {
  expect(percentile([], 50)).toBe(0);
});

test("aggregate computes per-cell pass_rate, mean, p50, p95", () => {
  const turns = [
    mk("m1", "f1", true, 100, 0),
    mk("m1", "f1", true, 200, 1),
    mk("m1", "f1", false, 300, 2),
  ];
  const result: BenchResult = {
    startedAt: "2026-04-17T00:00:00Z",
    finishedAt: "2026-04-17T00:01:00Z",
    mode: "matrix",
    models: ["m1"],
    fixtureIds: ["f1"],
    runs: 3,
    turns,
    passCount: 2,
    totalCount: 3,
    wallClockMs: 60_000,
    metadata: fakeMeta,
  };
  const agg = aggregate(result);
  expect(agg.cells).toHaveLength(1);
  const cell = agg.cells[0]!;
  expect(cell.passCount).toBe(2);
  expect(cell.totalCount).toBe(3);
  expect(cell.passRate).toBeCloseTo(2 / 3);
  expect(cell.meanMs).toBe(200);
  expect(cell.p50Ms).toBe(200);
});

test("aggregate builds per-model ranking sorted by pass_rate desc, then mean asc", () => {
  const turns = [
    mk("fast-fail", "f1", false, 50),
    mk("fast-fail", "f1", false, 50),
    mk("slow-pass", "f1", true, 1000),
    mk("slow-pass", "f1", true, 1000),
    mk("fast-pass", "f1", true, 100),
    mk("fast-pass", "f1", true, 100),
  ];
  const result: BenchResult = {
    startedAt: "2026-04-17T00:00:00Z",
    finishedAt: "2026-04-17T00:01:00Z",
    mode: "matrix",
    models: ["fast-fail", "slow-pass", "fast-pass"],
    fixtureIds: ["f1"],
    runs: 2,
    turns,
    passCount: 4,
    totalCount: 6,
    wallClockMs: 60_000,
    metadata: fakeMeta,
  };
  const agg = aggregate(result);
  expect(agg.ranking[0]!.model).toBe("fast-pass");
  expect(agg.ranking[1]!.model).toBe("slow-pass");
  expect(agg.ranking[2]!.model).toBe("fast-fail");
});

test("aggregate sums retries, timeouts, budgetExceeded into summary", () => {
  const base = mk("m1", "f1", true, 100);
  const withRetry: TurnResult = { ...base, retried: true };
  const withTimeout: TurnResult = { ...base, pass: false, timedOut: true, reason: "turn-timeout" };
  const withBudget: TurnResult = { ...base, pass: false, timedOut: true, reason: "budget-exceeded" };
  const result: BenchResult = {
    startedAt: "x",
    finishedAt: "y",
    mode: "smoke",
    models: ["m1"],
    fixtureIds: ["f1"],
    runs: 4,
    turns: [base, withRetry, withTimeout, withBudget],
    passCount: 2,
    totalCount: 4,
    wallClockMs: 1000,
    metadata: fakeMeta,
  };
  const agg = aggregate(result);
  expect(agg.summary.totalRetries).toBe(1);
  expect(agg.summary.totalTimeouts).toBe(1);
  expect(agg.summary.totalBudgetExceeded).toBe(1);
});
```

- [ ] **Step 6.0.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/report-aggregate.test.ts
```

Expected: FAIL — `Cannot find module #src/report/aggregate`.

- [ ] **Step 6.0.3: Implement aggregator**

Create `packages/cursor-agent-bench/src/report/aggregate.ts`:

```ts
import type {
  BenchResult,
  TurnResult,
  CellStats,
  ModelRanking,
  AggregateReport,
} from "#src/types";

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const xs = [...sorted].sort((a, b) => a - b);
  const idx = Math.min(xs.length - 1, Math.ceil((p / 100) * xs.length) - 1);
  return xs[Math.max(0, idx)]!;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

function computeCells(turns: TurnResult[]): CellStats[] {
  const groups = new Map<string, TurnResult[]>();
  for (const t of turns) {
    const key = `${t.fixture}|${t.model}`;
    const arr = groups.get(key) ?? [];
    arr.push(t);
    groups.set(key, arr);
  }
  const cells: CellStats[] = [];
  for (const [key, arr] of groups) {
    const [fixture, model] = key.split("|") as [string, string];
    const lats = arr.map((t) => t.durationMs);
    const turnsByRun = new Map<number, number>();
    for (const t of arr) {
      turnsByRun.set(t.runIndex, (turnsByRun.get(t.runIndex) ?? 0) + 1);
    }
    const turnCounts = [...turnsByRun.values()];
    cells.push({
      fixture,
      model,
      passCount: arr.filter((t) => t.pass).length,
      totalCount: arr.length,
      passRate: arr.length === 0 ? 0 : arr.filter((t) => t.pass).length / arr.length,
      meanMs: mean(lats),
      p50Ms: percentile(lats, 50),
      p95Ms: percentile(lats, 95),
      turnMean: mean(turnCounts),
      retries: arr.filter((t) => t.retried).length,
      timeouts: arr.filter((t) => t.reason === "turn-timeout").length,
      budgetExceeded: arr.filter((t) => t.reason === "budget-exceeded").length,
    });
  }
  return cells;
}

function computeRanking(turns: TurnResult[]): ModelRanking[] {
  const byModel = new Map<string, TurnResult[]>();
  for (const t of turns) {
    const arr = byModel.get(t.model) ?? [];
    arr.push(t);
    byModel.set(t.model, arr);
  }
  const rows: ModelRanking[] = [];
  for (const [model, arr] of byModel) {
    const pass = arr.filter((t) => t.pass).length;
    rows.push({
      rank: 0,
      model,
      passCount: pass,
      totalCount: arr.length,
      passRate: arr.length === 0 ? 0 : pass / arr.length,
      meanMs: mean(arr.map((t) => t.durationMs)),
    });
  }
  rows.sort((a, b) => b.passRate - a.passRate || a.meanMs - b.meanMs);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function aggregate(result: BenchResult): AggregateReport {
  const cells = computeCells(result.turns);
  const ranking = computeRanking(result.turns);
  return {
    summary: {
      mode: result.mode,
      models: result.models,
      fixtures: result.fixtureIds,
      runsPerCell: result.runs,
      overallPass: result.passCount,
      overallTotal: result.totalCount,
      overallPassRate: result.totalCount === 0 ? 0 : result.passCount / result.totalCount,
      wallClockMs: result.wallClockMs,
      totalRetries: result.turns.filter((t) => t.retried).length,
      totalTimeouts: result.turns.filter((t) => t.reason === "turn-timeout").length,
      totalBudgetExceeded: result.turns.filter((t) => t.reason === "budget-exceeded").length,
      metadata: result.metadata,
    },
    cells,
    ranking,
  };
}
```

- [ ] **Step 6.0.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/report-aggregate.test.ts
```

Expected: 6 pass, 0 fail.

- [ ] **Step 6.0.5: Commit**

```bash
git add packages/cursor-agent-bench/src/report/aggregate.ts packages/cursor-agent-bench/src/__tests__/report-aggregate.test.ts
git commit -m "feat(bench): aggregator with pass_rate, p50/p95 latency, per-model ranking"
```

---

### Task 6.1: JSONL appender

**Files:**
- Create: `packages/cursor-agent-bench/src/report/jsonl.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/report-jsonl.test.ts`

- [ ] **Step 6.1.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/report-jsonl.test.ts`:

```ts
import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { appendJsonlBatch, jsonlPathFor } from "#src/report/jsonl";
import type { TurnResult } from "#src/types";

let dir = "";
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "bench-jsonl-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("jsonlPathFor formats timestamp + skill", () => {
  const p = jsonlPathFor("/tmp/x", "interview", new Date("2026-04-17T10:42:00Z"));
  expect(p).toMatch(/2026-04-17T10-42-00.+interview\.jsonl$/);
});

test("appendJsonlBatch writes one line per TurnResult", async () => {
  const file = join(dir, "out.jsonl");
  const fakeMeta = {
    commit: "deadbeef",
    skillChecksum: "cafebabe",
    env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "test" },
  };
  const base = {
    outputTruncated: false,
    originalLen: 5,
    retried: false,
    timedOut: false,
    commit: fakeMeta.commit,
    skillChecksum: fakeMeta.skillChecksum,
    env: fakeMeta.env,
  };
  const turns: TurnResult[] = [
    {
      skill: "interview",
      fixture: "f1",
      model: "m1",
      runIndex: 0,
      turn: 0,
      input: "hi",
      output: "hello",
      durationMs: 10,
      exitCode: 0,
      pass: true,
      assertions: [],
      ...base,
    },
    {
      skill: "interview",
      fixture: "f1",
      model: "m1",
      runIndex: 0,
      turn: 1,
      input: "hi2",
      output: "hello2",
      durationMs: 11,
      exitCode: 0,
      pass: true,
      assertions: [],
      ...base,
    },
  ];
  await appendJsonlBatch(file, turns);
  const content = await readFile(file, "utf8");
  const lines = content.trim().split("\n");
  expect(lines).toHaveLength(2);
  expect(JSON.parse(lines[0]!).turn).toBe(0);
  expect(JSON.parse(lines[1]!).turn).toBe(1);
});

test("appendJsonlBatch is idempotent across calls (appends)", async () => {
  const file = join(dir, "out.jsonl");
  const fakeMeta = {
    commit: "deadbeef",
    skillChecksum: "cafebabe",
    env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "test" },
  };
  const t: TurnResult = {
    skill: "s",
    fixture: "f",
    model: "m",
    runIndex: 0,
    turn: 0,
    input: "i",
    output: "o",
    outputTruncated: false,
    originalLen: 1,
    durationMs: 1,
    exitCode: 0,
    pass: true,
    assertions: [],
    retried: false,
    timedOut: false,
    commit: fakeMeta.commit,
    skillChecksum: fakeMeta.skillChecksum,
    env: fakeMeta.env,
  };
  await appendJsonlBatch(file, [t]);
  await appendJsonlBatch(file, [t]);
  const content = await readFile(file, "utf8");
  expect(content.trim().split("\n")).toHaveLength(2);
});
```

- [ ] **Step 6.1.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/report-jsonl.test.ts
```

Expected: FAIL — `Cannot find module #src/report/jsonl`.

- [ ] **Step 6.1.3: Implement JSONL appender**

Create `packages/cursor-agent-bench/src/report/jsonl.ts`:

```ts
import { mkdir, appendFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { TurnResult } from "#src/types";

export function jsonlPathFor(dir: string, skill: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[:]/g, "-").replace(/\..+/, "");
  return join(dir, `${stamp}-${skill}.jsonl`);
}

export async function appendJsonlBatch(
  file: string,
  turns: TurnResult[],
): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const payload = turns.map((t) => JSON.stringify(t)).join("\n") + "\n";
  await appendFile(file, payload, "utf8");
}
```

- [ ] **Step 6.1.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/report-jsonl.test.ts
```

Expected: 3 pass, 0 fail.

- [ ] **Step 6.1.5: Commit**

```bash
git add packages/cursor-agent-bench/src/report/jsonl.ts packages/cursor-agent-bench/src/__tests__/report-jsonl.test.ts
git commit -m "feat(bench): JSONL appender with timestamped filenames"
```

---

### Task 6.2: Markdown tracker renderer (3-section ML-style, DEC-020)

**Files:**
- Create: `packages/cursor-agent-bench/src/report/markdown.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/report-markdown.test.ts`

- [ ] **Step 6.2.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/report-markdown.test.ts`:

```ts
import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderTracker } from "#src/report/markdown";
import type { BenchResult } from "#src/types";

let dir = "";
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "bench-md-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const fakeMeta = {
  commit: "deadbeef",
  skillChecksum: "cafebabe",
  env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "darwin 24.6" },
};

const result: BenchResult = {
  startedAt: "2026-04-17T10:42:00Z",
  finishedAt: "2026-04-17T10:44:00Z",
  mode: "smoke",
  models: ["composer-2-fast"],
  fixtureIds: ["interview-phase1"],
  runs: 1,
  passCount: 1,
  totalCount: 1,
  wallClockMs: 12_340,
  metadata: fakeMeta,
  turns: [
    {
      skill: "interview",
      fixture: "interview-phase1",
      model: "composer-2-fast",
      runIndex: 0,
      turn: 0,
      input: "hi",
      output: "...",
      outputTruncated: false,
      originalLen: 3,
      durationMs: 12_340,
      exitCode: 0,
      pass: true,
      assertions: [],
      retried: false,
      timedOut: false,
      commit: fakeMeta.commit,
      skillChecksum: fakeMeta.skillChecksum,
      env: fakeMeta.env,
    },
  ],
};

test("renderTracker emits 3 sections with metadata, percentiles, ranking", async () => {
  const file = join(dir, "interview.md");
  await renderTracker(file, "interview", result);
  const content = await readFile(file, "utf8");
  expect(content).toContain("# Interview Skill — Bench Tracker");
  expect(content).toContain("## Latest Smoke");
  expect(content).toContain("### 1. Summary");
  expect(content).toContain("### 2. Per-Fixture × Model");
  expect(content).toContain("### 3. Per-Model Ranking");
  expect(content).toContain("pass_rate");
  expect(content).toContain("p50");
  expect(content).toContain("p95");
  expect(content).toContain("composer-2-fast");
  // C10: reproducibility metadata
  expect(content).toContain("Commit: `deadbeef`");
  expect(content).toContain("Skill checksum: `sha256:cafebabe`");
  // C12: env metadata
  expect(content).toContain("Env: bun 1.3.10");
  expect(content).toContain("cursor-agent 2.4.1");
  expect(content).toContain("darwin 24.6");
});

test("renderTracker replaces existing Latest Smoke section, preserves Latest Matrix", async () => {
  const file = join(dir, "interview.md");
  const existing = `# Interview Skill — Bench Tracker

## Latest Smoke — 2026-04-16 00:00

Old smoke data.

## Latest Matrix — 2026-04-15 00:00

Old matrix data kept.
`;
  await writeFile(file, existing, "utf8");
  await renderTracker(file, "interview", result);
  const content = await readFile(file, "utf8");
  expect(content).not.toContain("Old smoke data");
  expect(content).toContain("Old matrix data kept");
  expect(content).toContain("composer-2-fast");
});

test("renderTracker matrix mode writes Latest Matrix with Runs", async () => {
  const file = join(dir, "interview.md");
  const matrixResult: BenchResult = { ...result, mode: "matrix", runs: 3 };
  await renderTracker(file, "interview", matrixResult);
  const content = await readFile(file, "utf8");
  expect(content).toContain("## Latest Matrix");
  expect(content).toContain("Runs per cell: 3");
});
```

- [ ] **Step 6.2.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/report-markdown.test.ts
```

Expected: FAIL — `Cannot find module #src/report/markdown`.

- [ ] **Step 6.2.3: Implement tracker renderer**

Create `packages/cursor-agent-bench/src/report/markdown.ts`:

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { BenchResult } from "#src/types";
import { aggregate } from "#src/report/aggregate";

const SMOKE = "## Latest Smoke";
const MATRIX = "## Latest Matrix";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US").replace(/,/g, "_");
}

function renderSummary(r: BenchResult): string {
  const a = aggregate(r).summary;
  const minutes = (a.wallClockMs / 60_000).toFixed(1);
  const m = a.metadata;
  return [
    "### 1. Summary",
    "",
    `- Mode: ${a.mode}`,
    `- Commit: \`${m.commit}\` | Skill checksum: \`sha256:${m.skillChecksum}\``,
    `- Env: bun ${m.env.bun} | cursor-agent ${m.env.cursorAgent} | ${m.env.platform}`,
    `- Models: ${a.models.length} | Fixtures: ${a.fixtures.length} | Runs per cell: ${a.runsPerCell}`,
    `- Overall pass_rate: ${a.overallPass}/${a.overallTotal} (${pct(a.overallPassRate)})`,
    `- Total wall-clock: ${fmt(a.wallClockMs)} ms (~${minutes} min)`,
    `- Total retries: ${a.totalRetries} | Total turn-timeouts: ${a.totalTimeouts} | Total budget-exceeded: ${a.totalBudgetExceeded}`,
    "",
  ].join("\n");
}

function renderCells(r: BenchResult): string {
  const rows = aggregate(r).cells.map(
    (c) =>
      `| ${c.fixture} | ${c.model} | ${c.passCount}/${c.totalCount} (${pct(c.passRate)}) | ${fmt(c.meanMs)} | ${fmt(c.p50Ms)} | ${fmt(c.p95Ms)} | ${c.turnMean.toFixed(1)} | ${c.retries} | ${c.timeouts} | ${c.budgetExceeded} |`,
  );
  return [
    "### 2. Per-Fixture × Model",
    "",
    "| Fixture | Model | Pass rate | Mean (ms) | p50 (ms) | p95 (ms) | Turn mean | Retries | Timeouts | Budget-exceeded |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

function renderRanking(r: BenchResult): string {
  const rows = aggregate(r).ranking.map(
    (m) =>
      `| ${m.rank} | ${m.model} | ${m.passCount}/${m.totalCount} (${pct(m.passRate)}) | ${fmt(m.meanMs)} |`,
  );
  return [
    "### 3. Per-Model Ranking (pass_rate desc, then mean latency asc)",
    "",
    "| Rank | Model | Overall pass_rate | Mean latency (ms) |",
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

function renderSection(result: BenchResult): string {
  const heading = result.mode === "smoke" ? SMOKE : MATRIX;
  return [
    `${heading} — ${result.finishedAt}`,
    "",
    renderSummary(result),
    renderCells(result),
    renderRanking(result),
  ].join("\n");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceOrAppendSection(existing: string, heading: string, body: string): string {
  const re = new RegExp(`${escapeRegExp(heading)}[\\s\\S]*?(?=\\n## |$)`, "m");
  if (re.test(existing)) return existing.replace(re, body.trimEnd() + "\n");
  return existing.trimEnd() + "\n\n" + body + "\n";
}

export async function renderTracker(
  file: string,
  skill: string,
  result: BenchResult,
): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const header = `# ${cap(skill)} Skill — Bench Tracker\n`;
  let existing = "";
  try {
    existing = await readFile(file, "utf8");
  } catch {
    existing = header + "\n";
  }
  if (!existing.startsWith("# ")) existing = header + "\n" + existing;
  const section = renderSection(result);
  const heading = result.mode === "smoke" ? SMOKE : MATRIX;
  const updated = replaceOrAppendSection(existing, heading, section);
  await writeFile(file, updated, "utf8");
}
```

- [ ] **Step 6.2.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/report-markdown.test.ts
```

Expected: 3 pass, 0 fail.

- [ ] **Step 6.2.5: Commit**

```bash
git add packages/cursor-agent-bench/src/report/markdown.ts packages/cursor-agent-bench/src/__tests__/report-markdown.test.ts
git commit -m "feat(bench): markdown tracker renderer with smoke/matrix sections"
```

---

## Phase 7 — CLI Entry

### Task 7.1: Flag parsing + dispatch

**Files:**
- Create: `packages/cursor-agent-bench/src/cli-parse.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/cli-parse.test.ts`

- [ ] **Step 7.1.1: Write failing test**

Create `packages/cursor-agent-bench/src/__tests__/cli-parse.test.ts`:

```ts
import { test, expect } from "bun:test";
import { parseCliArgs } from "#src/cli-parse";

test("default args = smoke mode, default model, 1 run", () => {
  const r = parseCliArgs([]);
  expect(r.mode).toBe("smoke");
  expect(r.model).toBeUndefined();
  expect(r.runs).toBeUndefined();
  expect(r.fixture).toBeUndefined();
  expect(r.real).toBe(false);
});

test("--matrix flag sets mode=matrix", () => {
  const r = parseCliArgs(["--matrix"]);
  expect(r.mode).toBe("matrix");
});

test("--model <id> captures model", () => {
  const r = parseCliArgs(["--model", "claude-4.5-sonnet"]);
  expect(r.model).toBe("claude-4.5-sonnet");
});

test("--runs N captures numeric runs", () => {
  const r = parseCliArgs(["--runs", "5"]);
  expect(r.runs).toBe(5);
});

test("--fixture <id> captures fixture id", () => {
  const r = parseCliArgs(["--fixture", "interview-phase1"]);
  expect(r.fixture).toBe("interview-phase1");
});

test("--real enables real spawn adapter", () => {
  const r = parseCliArgs(["--real"]);
  expect(r.real).toBe(true);
});

test("combined flags parse correctly", () => {
  const r = parseCliArgs(["--matrix", "--runs", "3", "--fixture", "x"]);
  expect(r.mode).toBe("matrix");
  expect(r.runs).toBe(3);
  expect(r.fixture).toBe("x");
});

test("--help returns help flag", () => {
  const r = parseCliArgs(["--help"]);
  expect(r.help).toBe(true);
});

test("unknown flag throws", () => {
  expect(() => parseCliArgs(["--bogus"])).toThrow(/unknown/i);
});
```

- [ ] **Step 7.1.2: Run test to verify it fails**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/cli-parse.test.ts
```

Expected: FAIL — `Cannot find module #src/cli-parse`.

- [ ] **Step 7.1.3: Implement parser**

Create `packages/cursor-agent-bench/src/cli-parse.ts`:

```ts
export interface CliArgs {
  mode: "smoke" | "matrix";
  model?: string;
  runs?: number;
  fixture?: string;
  real: boolean;
  help: boolean;
}

export function parseCliArgs(argv: string[]): CliArgs {
  const out: CliArgs = { mode: "smoke", real: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--matrix":
        out.mode = "matrix";
        break;
      case "--real":
        out.real = true;
        break;
      case "--help":
      case "-h":
        out.help = true;
        break;
      case "--model": {
        const v = argv[++i];
        if (!v) throw new Error("--model requires a value");
        out.model = v;
        break;
      }
      case "--runs": {
        const v = argv[++i];
        if (!v) throw new Error("--runs requires a number");
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1) {
          throw new Error(`--runs must be positive integer, got "${v}"`);
        }
        out.runs = n;
        break;
      }
      case "--fixture": {
        const v = argv[++i];
        if (!v) throw new Error("--fixture requires an id");
        out.fixture = v;
        break;
      }
      default:
        throw new Error(`unknown flag: ${a}`);
    }
  }
  return out;
}

export const HELP_TEXT = `
Usage: bun run skill:bench [options]

  --matrix              Run full matrix (all models × matrixRuns)
  --model <id>          Override model (smoke only unless --matrix omitted)
  --runs <N>            Number of runs per model (default 1 / matrixRuns)
  --fixture <id>        Run only the fixture with this id
  --real                Use real cursor-agent spawn adapter (opt-in smoke)
  --help, -h            Show this help
`;
```

- [ ] **Step 7.1.4: Run test to verify it passes**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/cli-parse.test.ts
```

Expected: 9 pass, 0 fail.

- [ ] **Step 7.1.5: Commit**

```bash
git add packages/cursor-agent-bench/src/cli-parse.ts packages/cursor-agent-bench/src/__tests__/cli-parse.test.ts
git commit -m "feat(bench): CLI flag parser with exit-code taxonomy"
```

---

### Task 7.2: Entry orchestrator

**Files:**
- Create: `packages/cursor-agent-bench/src/index.ts`

- [ ] **Step 7.2.1: Implement entry**

Create `packages/cursor-agent-bench/src/index.ts`:

```ts
import { resolve } from "node:path";
import { parseCliArgs, HELP_TEXT } from "#src/cli-parse";
import { preflightCheck } from "#src/preflight";
import { loadAllFixtures, loadFixtureById } from "#src/fixture";
import { runFixture } from "#src/runner";
import { spawnCursorAgent } from "#src/spawn-cursor-agent";
import { appendJsonlBatch, jsonlPathFor } from "#src/report/jsonl";
import { renderTracker } from "#src/report/markdown";
import { collectMetadata, defaultDeps as metadataDeps } from "#src/metadata";
import type { BenchResult, Fixture, TurnResult, ReproMetadata } from "#src/types";
import config from "../cursor-bench.config";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<number> {
  let args;
  try {
    args = parseCliArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`error: ${(e as Error).message}`);
    console.error(HELP_TEXT);
    return 4;
  }

  if (args.help) {
    console.log(HELP_TEXT);
    return 0;
  }

  const pre = await preflightCheck();
  if (!pre.ok) {
    console.error(`preflight: ${pre.message}`);
    return pre.exitCode;
  }

  const fixturesDir = resolve(import.meta.dirname, "..", config.fixturesDir);
  let fixtures: Fixture[];
  try {
    fixtures = args.fixture
      ? [await loadFixtureById(fixturesDir, args.fixture)]
      : await loadAllFixtures(fixturesDir);
  } catch (e) {
    console.error(`fixture error: ${(e as Error).message}`);
    return 4;
  }

  const models =
    args.mode === "matrix"
      ? config.models
      : [args.model ?? config.defaultModel];
  const runs =
    args.runs ?? (args.mode === "matrix" ? config.matrixRuns : config.defaultRuns);

  const startedAt = new Date();
  const startTs = Date.now();
  const bySkill = new Map<string, TurnResult[]>();
  const metadataBySkill = new Map<string, ReproMetadata>();
  const jsonlRoot = resolve(import.meta.dirname, "..", config.jsonlDir);
  let passCount = 0;
  let totalCount = 0;

  for (const fx of fixtures) {
    let meta = metadataBySkill.get(fx.skill);
    if (!meta) {
      const skillPath = resolve(
        import.meta.dirname,
        "..",
        "..",
        "templates",
        fx.skill,
        "claude",
        "SKILL.md",
      );
      meta = await collectMetadata(metadataDeps(skillPath));
      metadataBySkill.set(fx.skill, meta);
    }

    for (const model of models) {
      for (let r = 0; r < runs; r++) {
        const turns = await runFixture(fx, {
          config,
          model,
          runIndex: r,
          metadata: meta,
          dumpDir: jsonlRoot,
          startedAt,
          spawn: spawnCursorAgent,
          sleep,
        });
        totalCount += turns.length;
        passCount += turns.filter((t) => t.pass).length;
        const arr = bySkill.get(fx.skill) ?? [];
        arr.push(...turns);
        bySkill.set(fx.skill, arr);
      }
    }
  }

  const finishedAt = new Date();
  const wallClockMs = Date.now() - startTs;
  const trackerRoot = resolve(import.meta.dirname, "..", config.trackerDir);

  for (const [skill, turns] of bySkill) {
    const meta = metadataBySkill.get(skill)!;
    const result: BenchResult = {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      mode: args.mode,
      models,
      fixtureIds: [...new Set(turns.map((t) => t.fixture))],
      runs,
      passCount: turns.filter((t) => t.pass).length,
      totalCount: turns.length,
      wallClockMs,
      metadata: meta,
      turns,
    };
    await appendJsonlBatch(jsonlPathFor(jsonlRoot, skill, startedAt), turns);
    await renderTracker(`${trackerRoot}/${skill}.md`, skill, result);
  }

  console.log(`bench: ${passCount}/${totalCount} pass (${args.mode} mode)`);
  return passCount === totalCount ? 0 : 1;
}

const code = await main();
process.exit(code);
```

- [ ] **Step 7.2.2: Run typecheck to verify no compile error**

Run:
```bash
cd packages/cursor-agent-bench && bun run typecheck
```

Expected: clean exit, no errors.

- [ ] **Step 7.2.3: Commit**

```bash
git add packages/cursor-agent-bench/src/index.ts
git commit -m "feat(bench): CLI entry orchestrating preflight → runner → report"
```

---

## Phase 8 — First Fixture (interview)

### Task 8.1: Write interview-phase1 fixture

**Files:**
- Create: `packages/cursor-agent-bench/fixtures/interview-phase1.ts`

- [ ] **Step 8.1.1: Write fixture**

Create `packages/cursor-agent-bench/fixtures/interview-phase1.ts`:

```ts
import type { Fixture } from "#src/types";

const fixture: Fixture = {
  id: "interview-phase1",
  skill: "interview",
  description:
    "Verify interview skill locks Phase 1 items (objective, DoD, scope) with recommended option + explanation",
  maxTurns: 6,
  turns: [
    {
      prompt:
        "Activate the interview skill. I want to add a dark-mode toggle to a CLI wizard. Begin the interview.",
      assertions: [
        { kind: "regex", pattern: /objective|what.+trying to build|requirement/i, description: "asks for objective or requirement" },
      ],
    },
    {
      prompt:
        "Objective: let users persist a preferred color scheme (light / dark / auto) across sessions. DoD: flag saved to config, honored on next boot, covered by tests.",
      assertions: [
        { kind: "regex", pattern: /recommend/i, description: "presents a recommended option" },
        { kind: "regex", pattern: /why|because|rationale/i, description: "explains why" },
      ],
    },
    {
      prompt: "Pick option 1 (Recommended).",
      assertions: [
        { kind: "regex", pattern: /decision log|locked|accepted/i, description: "records decision" },
      ],
    },
    {
      prompt: "Continue the interview.",
      assertions: [
        { kind: "regex", pattern: /scope|non-goals|constraints|environment/i, description: "moves to next Phase 1 item" },
      ],
    },
  ],
};

export default fixture;
```

- [ ] **Step 8.1.2: Run fixture validator sanity check**

Run (ad-hoc script):
```bash
cd packages/cursor-agent-bench && bun -e "
import('./src/fixture.ts').then(async (m) => {
  const fx = (await import('./fixtures/interview-phase1.ts')).default;
  m.validateFixture(fx);
  console.log('fixture OK');
});
"
```

Expected: `fixture OK`.

- [ ] **Step 8.1.3: Commit**

```bash
git add packages/cursor-agent-bench/fixtures/interview-phase1.ts
git commit -m "feat(bench): interview-phase1 fixture covering Phase 1 lock sequence"
```

---

## Phase 9 — Docs + PR Template

### Task 9.1: ADR-0010 — Cursor CLI system-prereq exception

**Files:**
- Create: `docs/adr/0010-cursor-cli-system-prereq.md`

- [ ] **Step 9.1.1: Write ADR**

Create `docs/adr/0010-cursor-cli-system-prereq.md`:

```markdown
# ADR-0010: Cursor CLI as system prerequisite for bench

**Status:** Accepted
**Date:** 2026-04-17
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

`packages/cursor-agent-bench/` validates skill quality by spawning `cursor-agent` (the Cursor CLI) with scripted fixtures. `cursor-agent` is distributed only as a shell installer (`curl https://cursor.com/install -fsSL | bash`), not as an npm package. `docs/ai/dependency-scope-policy.md` forbids global / user-scope installers with two documented exceptions: Bun and git.

## Decision

Cursor CLI is added as a third system prerequisite, scoped to the `cursor-agent-bench` package only. It is **not** a transitive dependency of `au-agentic` runtime or of `bun run verify`. The bench runner preflight-checks for the binary and OAuth session; missing prereqs fail-fast with exit code 2 and an actionable install message.

## Consequences

**Positive**
- Unlocks cross-model skill validation impossible without Cursor CLI
- Scope is narrow: only when running `bun run skill:bench`
- Preflight keeps error surface localized

**Negative**
- Breaks the two-prereq invariant (Bun + git)
- Contributors who only build / verify don't need it, but the bench command now lists it in its README

## Alternatives considered

- **Anthropic SDK direct calls**: rejected — loses Cursor's OAuth, CLI session resume, multi-provider routing that the whole bench premise depends on
- **Dockerize Cursor CLI**: rejected — the CLI requires host OAuth, Docker would need `-v ~/.cursor` mount and still does not solve OAuth flow
- **Replace Cursor CLI with Copilot CLI / Codex CLI**: rejected — we specifically chose Cursor for model diversity in free slow tier (DEC-015)

## References

- Spec: `docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md`
- Policy: `docs/ai/dependency-scope-policy.md`
- Decision log entry: DEC-001 (🔴 HIGH risk accepted)
```

- [ ] **Step 9.1.2: Commit**

```bash
git add docs/adr/0010-cursor-cli-system-prereq.md
git commit -m "docs(adr): ADR-0010 Cursor CLI as system prereq for bench"
```

---

### Task 9.2: Tracker dir placeholder + README

**Files:**
- Create: `docs/superpowers/bench/.gitkeep`
- Create: `docs/superpowers/bench/README.md`

- [ ] **Step 9.2.1: Create dir placeholder**

Run:
```bash
mkdir -p docs/superpowers/bench
touch docs/superpowers/bench/.gitkeep
```

- [ ] **Step 9.2.2: Write bench README**

Create `docs/superpowers/bench/README.md`:

```markdown
# Superpowers Skill Bench Tracker

Committed markdown summaries of `bun run skill:bench` runs. Each file corresponds to one skill and contains two sections:

- `## Latest Smoke` — most recent 1-model × 1-run run (updated on every smoke)
- `## Latest Matrix` — most recent full matrix (updated only when `bun run skill:bench --matrix` runs)

Older runs are not kept in this tracker. Raw per-turn records live in the gitignored `coverage/cursor-bench/*.jsonl`.

## How to read

- `Pass rate 3/3` — all runs of that fixture+model combo passed
- `Latency (ms)` uses `_` as thousands separator for diff-friendly
- Matrix overall pass_rate = sum pass across all (fixture × model × run)

## How to run

```bash
bun run skill:bench           # smoke (fast feedback)
bun run skill:bench --matrix  # full gate (2–3 h)
```

See [`packages/cursor-agent-bench/README.md`](../../../packages/cursor-agent-bench/README.md) for full options.
```

- [ ] **Step 9.2.3: Commit**

```bash
git add docs/superpowers/bench/.gitkeep docs/superpowers/bench/README.md
git commit -m "docs(bench): tracker dir + README explaining format"
```

---

### Task 9.3: PR template reminder + dependency-scope-policy link

**Files:**
- Modify or Create: `.github/pull_request_template.md`
- Modify: `docs/ai/dependency-scope-policy.md`

- [ ] **Step 9.3.1: Check if PR template exists**

Run:
```bash
ls -la .github/pull_request_template.md 2>/dev/null || echo "does not exist"
```

- [ ] **Step 9.3.2: Add/append bench reminder**

If file exists, append the following section. If not, create with this content:

```markdown
## Skill bench (required if skill files changed)

- [ ] N/A — PR does not touch `packages/templates/**/SKILL.md` or skill logic
- [ ] Ran `bun run skill:bench` locally; tracker diff attached in `docs/superpowers/bench/<skill>.md`
- [ ] Ran `bun run skill:bench --matrix` (release-gate scope); pass_rate documented
```

- [ ] **Step 9.3.3: Add exception note to dependency-scope-policy.md**

Open `docs/ai/dependency-scope-policy.md`. Find the section listing Bun + git as allowed system prereqs. Append:

```markdown

**Narrow exception — cursor-agent-bench only:** Cursor CLI (`cursor-agent`) is permitted as a system prerequisite for the `@au-agentic/cursor-agent-bench` workspace package. It is not a runtime dependency of any shipped artifact. See [ADR-0010](../adr/0010-cursor-cli-system-prereq.md).
```

- [ ] **Step 9.3.4: Commit**

```bash
git add .github/pull_request_template.md docs/ai/dependency-scope-policy.md
git commit -m "docs(bench): PR template reminder + dependency-scope exception link"
```

---

### Task 9.4a: Performance benchmark entry (C7, DEC-019)

**Files:**
- Modify: `scripts/benchmark.ts`

- [ ] **Step 9.4a.1: Read existing benchmark.ts structure**

Run:
```bash
grep -n "name:" /Users/phamau/Desktop/projects/me/au-agentic/scripts/benchmark.ts | head -20
```

Expected: see list of existing bench entries.

- [ ] **Step 9.4a.2: Add new entry for cursor-agent-bench unit tests**

In `scripts/benchmark.ts`, locate the `benches: Bench[]` array. Insert after the `"bun test (full concurrent)"` entry:

```ts
  {
    name: "bun test (cursor-agent-bench unit)",
    cmd: ["bun", "--filter", "@au-agentic/cursor-agent-bench", "test"],
    targetMs: 200,
    ceilingMs: 500,
  },
```

- [ ] **Step 9.4a.3: Run perf benchmark to confirm entry active**

Run:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic && bun run perf 2>&1 | grep -A2 "cursor-agent-bench"
```

Expected: entry runs and prints PASS/FAIL with target 200ms. If FAIL, reduce test overhead (cold cache warm-up, mock heavier modules). Must be < 500ms ceiling.

- [ ] **Step 9.4a.4: Commit**

```bash
git add scripts/benchmark.ts
git commit -m "perf(bench): add cursor-agent-bench unit test entry (T1 200/500ms)"
```

---

### Task 9.4: Routing + testing-policy updates

**Files:**
- Modify: `docs/ai/routing.md`
- Modify: `docs/development/testing-policy.md`

- [ ] **Step 9.4.1: Add routing entry**

Open `docs/ai/routing.md`. Find the table of task types. Add a row:

```markdown
| Skill quality validation (benchmark run, adding fixtures, reviewing tracker diff) | packages/cursor-agent-bench/README.md + docs/superpowers/bench/README.md | docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md |
```

Adapt column headers to match whatever the existing table uses.

- [ ] **Step 9.4.2: Add testing-policy section**

Open `docs/development/testing-policy.md`. Append:

```markdown

## Skill benchmarking

Superpowers skills are validated by `packages/cursor-agent-bench/` — not by `bun run verify`. Two modes:

- **Smoke** (`bun run skill:bench`): single default model × 1 run, fast iter feedback
- **Matrix** (`bun run skill:bench --matrix`): 7 models × 3 runs, release gate

Bench runs locally only (no CI). Tracker at `docs/superpowers/bench/<skill>.md` is committed; raw JSONL at `coverage/cursor-bench/*.jsonl` is gitignored.

Required runs when PR touches `packages/templates/**/SKILL.md`: see PR template checkboxes.
```

- [ ] **Step 9.4.3: Commit**

```bash
git add docs/ai/routing.md docs/development/testing-policy.md
git commit -m "docs(bench): routing + testing-policy updates"
```

---

## Phase 10 — Verification (9 Success Criteria Gate)

### Task 10.1: Framework self-test + criteria acceptance

Strict rule: fail 1 criterion → fail toàn bộ. Run each check in order.

- [ ] **Step 10.1.1: C1 TDD — Run full verify**

Run:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic && bun run verify
```

Expected: lint + typecheck + test all green. **Review list of test files** — must include eval-l1, fixture, runner, preflight, report-aggregate, report-jsonl, report-markdown, cli-parse, config-define. At least 8 test files for `cursor-agent-bench`. PASS if all green AND coverage list complete.

- [ ] **Step 10.1.2: C2 Model switching — Dry-run each mode**

Run:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic && bun run skill:bench --help
cat packages/cursor-agent-bench/cursor-bench.config.ts | grep -E "models:|defaultModel"
```

Expected: help text shows `--model`, `--matrix`; config lists 7 models. PASS.

- [ ] **Step 10.1.3: C3 Interview skill asks question — fixture review**

Run:
```bash
grep -E "recommend|option|\\?" packages/cursor-agent-bench/fixtures/interview-phase1.ts
```

Expected: fixture contains regex assertion checking for question patterns. PASS.

- [ ] **Step 10.1.4: C4 Per-fixture deadline 20min — test already exists**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/runner.test.ts 2>&1 | grep "budget-exceeded"
```

Expected: deadline test passes, reason "budget-exceeded" matched. PASS.

- [ ] **Step 10.1.5: C5 Binary check — simulate missing**

Run:
```bash
cd packages/cursor-agent-bench && PATH="" bun run src/index.ts 2>&1 | head -5 ; echo "Exit: $?"
```

Expected: exit 2, message "cursor-agent binary not found". PASS.

- [ ] **Step 10.1.6: C6 Login check — unit test**

Run:
```bash
cd packages/cursor-agent-bench && bun test src/__tests__/preflight.test.ts 2>&1 | grep -E "status|whoami|login"
```

Expected: 5 tests pass including "falls back from status to whoami" and "both fail → login message". PASS.

- [ ] **Step 10.1.7: C7 Perf 200ms — run benchmark**

Run:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic && bun run perf 2>&1 | grep -A2 "cursor-agent-bench unit"
```

Expected: entry runs, output shows time < 500ms with "PASS" label. PASS.

- [ ] **Step 10.1.8: C8 Simplicity — subagent review**

Dispatch review via the `compound-engineering:review:code-simplicity-reviewer` subagent. Ask it to evaluate `packages/cursor-agent-bench/src/**` for YAGNI / KISS / Clean Code violations. Fix any blockers inline; acceptable nits logged in follow-up but not blocking merge.

- [ ] **Step 10.1.9: C9 Report 3-section — render sample then inspect**

After a real `bench:smoke-real` run (Task 10.2), inspect `docs/superpowers/bench/interview.md`:

```bash
grep -E "^### [0-9]\." docs/superpowers/bench/interview.md
```

Expected: 3 sections "1. Summary", "2. Per-Fixture × Model", "3. Per-Model Ranking" present in the latest bench run output. Must also contain `p50`, `p95`, `pass_rate`. PASS.

- [ ] **Step 10.1.10: C10 Reproducibility metadata — inspect tracker + JSONL**

After a real `bench:smoke-real` run (Task 10.2), run:

```bash
grep -E "^- Commit:|^- Skill checksum:" docs/superpowers/bench/interview.md
head -1 coverage/cursor-bench/*.jsonl | bun -e "const d=JSON.parse(await Bun.stdin.text()); console.log('commit:', d.commit, 'skillChecksum:', d.skillChecksum);"
```

Expected: Summary shows `Commit: <8-char>` and `Skill checksum: sha256:<8-char>`. JSONL first record has non-empty `commit` and `skillChecksum` fields. PASS.

- [ ] **Step 10.1.11: C11 JSONL size control — inspect size + dump behavior**

After `bench:smoke-real` run, check size and dump:

```bash
# Size sanity: single-turn pass should be < 100KB total
du -k coverage/cursor-bench/*.jsonl
# Check if any dump .txt files exist (only if turn failed)
ls coverage/cursor-bench/*.txt 2>/dev/null || echo "no failures, no dumps"
# Inspect one record for truncation fields
head -1 coverage/cursor-bench/*.jsonl | bun -e "const d=JSON.parse(await Bun.stdin.text()); console.log('truncated:', d.outputTruncated, 'originalLen:', d.originalLen, 'dumpPath:', d.outputDumpPath || 'none');"
```

Expected: `outputTruncated` + `originalLen` fields present in every record. Dump `.txt` created only when pass=false. PASS.

- [ ] **Step 10.1.12: C12 Env metadata — inspect tracker**

Run:
```bash
grep -E "^- Env:" docs/superpowers/bench/interview.md
```

Expected: line like `- Env: bun 1.3.10 | cursor-agent 2.4.1 | darwin 24.6`. PASS.

- [ ] **Step 10.1.13: Aux — knip + ls-lint + markdownlint**

Run in parallel:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic && bunx knip
cd /Users/phamau/Desktop/projects/me/au-agentic && bun run lint:fs
cd /Users/phamau/Desktop/projects/me/au-agentic && bunx markdownlint-cli2 "docs/**/*.md" "packages/cursor-agent-bench/README.md"
```

Expected: all clean. No dead exports, naming respects ls-lint, markdown valid.

---

### Task 10.2: Opt-in real-smoke validation

Prerequisites: Cursor CLI installed, `cursor-agent login` completed, OAuth session active, API quota available.

- [ ] **Step 10.2.1: Dry-run preflight only**

Run:
```bash
cursor-agent --version
```

Expected: version string printed (not "command not found").

- [ ] **Step 10.2.2: Real smoke with default model, 1 turn only**

Run:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic && bun run skill:bench:smoke-real
```

Expected:
- Preflight passes
- At least 1 turn of `interview-phase1` fixture runs against `composer-2-fast`
- Tracker `docs/superpowers/bench/interview.md` created or updated with `## Latest Smoke`
- JSONL at `coverage/cursor-bench/<timestamp>-interview.jsonl` contains ≥ 1 line
- Exit code 0 or 1 depending on whether assertions passed (both acceptable; fixture is for shape validation)

- [ ] **Step 10.2.3: Inspect tracker diff**

Run:
```bash
git diff docs/superpowers/bench/interview.md
```

Expected: shows added `## Latest Smoke — <timestamp>` section with model, pass/fail, latency.

- [ ] **Step 10.2.4: Commit tracker (first real run)**

```bash
git add docs/superpowers/bench/interview.md
git commit -m "chore(bench): initial interview tracker entry from first smoke run"
```

---

### Task 10.3: Final sanity commit

- [ ] **Step 10.3.1: Verify bench is NOT wired into verify**

Run:
```bash
grep -rn "skill:bench" package.json turbo.json .github/workflows/ scripts/ 2>/dev/null
```

Expected: only matches in root `package.json` `scripts.skill:bench` and `scripts.skill:bench:smoke-real`; no matches in `turbo.json`, no workflow files, no `scripts/` hooks.

- [ ] **Step 10.3.2: Verify .gitignore entry active**

Run:
```bash
git check-ignore coverage/cursor-bench/anything.jsonl
```

Expected: prints `coverage/cursor-bench/anything.jsonl` (ignored).

- [ ] **Step 10.3.3: Final verify**

Run:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic && bun run verify
```

Expected: green. Work complete.

---

## Deferred Follow-ups (explicitly NOT in this plan)

- L2 LLM-judge eval layer (after L1 data)
- Multi-skill coverage beyond `interview`
- Flaky detection heuristic
- Trend/diff tool for tracker comparison across commits
- Fixture format migration yaml ↔ ts (if needed later)
- Cursor CLI version pinning / detection

These are tracked in the spec's "Open Follow-ups" section. Each is additive and does not require refactoring the V1 framework.
