---

## date: 2026-04-17
topic: cursor-agent-bench
status: design-approved

# Cursor Agent Bench — Skill Validation Framework

## Goal

Xây dựng một workspace package `packages/cursor-agent-bench/` dùng Bun + TypeScript spawn Cursor CLI (`cursor-agent`) để benchmark hiệu quả thực tế của superpowers skills trong `au-agentic`. Tương tự ML model validation: fixture × model × runs → pass/fail + latency + token metrics, cho phép maintainer kiểm chứng skill có hoạt động đồng nhất trên nhiều LLM vendor trước khi merge skill change.

V1 chỉ cover một skill đầu tiên (`packages/templates/interview/claude/SKILL.md`). Framework được thiết kế để thêm skill khác sau mà không refactor core runner.

## Rationale

- Skills là prompt-as-code → chất lượng phụ thuộc execution của LLM, không compile-check được
- Cần cross-model validation tránh skill overfit một model family (ví dụ chỉ work với Claude)
- Maintainer cần iter-loop nhanh (smoke, 1 model, 1 run) + release-gate chậm (matrix, nhiều model × runs) không đánh đổi
- Cursor CLI hỗ trợ `--model`, `--resume`, non-interactive output format chuẩn → match nhu cầu scripted multi-turn
- Repo đã có pattern workspace package + commit-able markdown tracker trong `docs/superpowers/`

## Scope

**In scope (V1):**

- Workspace package `packages/cursor-agent-bench/` với `"private": true`
- Bun spawn `cursor-agent` non-interactive mode
- Scripted multi-turn fixture chạy với `--resume <session>`
- Eval Layer 1 (L1): exit-code + regex/string assertion per turn
- Config file `cursor-bench.config.ts` list 7 models (smoke default = composer-2-fast)
- Run mode 2-tier: smoke (default) / `--matrix` (full subset × runs)
- CLI flags `--model <id>` + `--runs N` + `--fixture <path>` override config
- Output: markdown tracker commit-able (`docs/superpowers/bench/<skill-id>.md`) + JSONL raw gitignored (`coverage/cursor-bench/<timestamp>-<skill-id>.jsonl`)
- Auth preflight: `cursor-agent status` → fallback `cursor-agent whoami`; cả hai fail → exit 2 + message "Not logged in. Run: cursor-agent login" (DEC-018)
- Per-turn timeout 120s (configurable), max-turns 20 default
- **Per-fixture-per-run deadline 20 phút (1_200_000 ms)** — runner wrap `runFixture` với overall deadline; vượt → kill + mark `pass=false, reason=budget-exceeded` (DEC-017)
- Infra-only retry: max 1, delay 2s
- Root script `bun run skill:bench` + package script đồng tên
- PR template reminder: maintainer chạy manual khi đụng skill changes
- Fixture đầu tiên cover skill `interview` (scripted 3-5 turn cover Phase 1 + closing sequence), mỗi turn có assertion regex xác nhận skill "đặt câu hỏi" (DEC-016 — relaxed C3, không yêu cầu ACP strict)
- Self-test entry trong `scripts/benchmark.ts` target 200ms / ceiling 500ms (DEC-019)
- Report ML-style 3 section: Summary, Per-Fixture×Model table (pass_rate + mean/p50/p95 latency + turn/timeout/retry counts), Per-Model ranking (DEC-020)
- Reproducibility metadata: git SHA (short) + skill checksum (sha256-8) trong Summary + JSONL (DEC-021, C10)
- JSONL size control: truncate output ở 8KB per turn, full dump vào file `.txt` khi turn fail (DEC-022, C11)
- Environment metadata: bun version + cursor-agent version + platform trong Summary + JSONL (DEC-023, C12)
- ADR mới document system-prereq exception cho Cursor CLI

**Out of scope (defer):**

- Eval Layer 2 (LLM-judge) — chờ có data L1
- Flaky detection tự động — chờ có multi-run data
- ACP JSON-RPC client + `cursor/ask_question` strict parsing — C3 relaxed DEC-016; text regex đủ cho MVP
- Token cost estimator — Cursor CLI chưa expose API ổn định
- Confidence interval / Fleiss kappa flakiness score — cần N≥10 data
- GitHub Actions workflow `skill-bench.yml` — local-only per DEC-013
- Test fixture format lock (yaml vs ts) — tactical, quyết trong plan phase
- Multi-skill cover (chỉ `interview` ở V1, additive sau)
- Integration với Turbo cache (bench không idempotent, không phù hợp cache)
- Integration với `bun run verify` chain (standalone)

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│ packages/cursor-agent-bench/                                       │
│                                                                    │
│   cursor-bench.config.ts  ──── { models[], defaultModel, ... }     │
│                                                                    │
│   src/                                                             │
│     index.ts            ─── CLI entry (parse flags → dispatch)     │
│     runner.ts           ─── spawn cursor-agent, multi-turn loop    │
│     preflight.ts        ─── auth check, CLI presence check         │
│     eval/l1.ts          ─── exit-code + assertion matchers         │
│     report/markdown.ts  ─── render tracker markdown                │
│     report/jsonl.ts     ─── append JSONL raw records               │
│     fixture.ts          ─── load + validate fixture schema         │
│                                                                    │
│   fixtures/                                                        │
│     interview-phase1.ts  (initial fixture, ts format)              │
│                                                                    │
│   package.json          ─── "private": true, scripts.bench         │
└────────────────────────────────────────────────────────────────────┘
                              │ spawn
                              ▼
                    cursor-agent --resume <sid>
                              │
                              ▼
             process.stdout + process.stderr + exitCode
                              │
                              ▼
                    per-turn L1 eval → record
                              │
                              ▼
                    markdown tracker + JSONL
```

## Command Surface

Root (`package.json` scripts):

```json
{
  "skill:bench": "cd packages/cursor-agent-bench && bun run bench"
}
```

Package (`packages/cursor-agent-bench/package.json`):

```json
{
  "name": "@au-agentic/cursor-agent-bench",
  "private": true,
  "scripts": {
    "bench": "bun run src/index.ts"
  }
}
```

CLI invocations:

| Command | Behavior |
|---|---|
| `bun run skill:bench` | Smoke: 1 model (`composer-2-fast`) × 1 run, all fixtures |
| `bun run skill:bench --matrix` | Full: 7 models × 3 runs, all fixtures |
| `bun run skill:bench --model claude-4.5-sonnet` | Smoke with specific model |
| `bun run skill:bench --runs 5` | Single model (default) × 5 runs |
| `bun run skill:bench --fixture interview-phase1` | Chỉ chạy 1 fixture |
| `bun run skill:bench --matrix --runs 1` | Matrix nhưng chỉ 1 run per model |

Exit codes:
- `0` — all fixtures pass
- `1` — one or more fixture fail assertion
- `2` — preflight fail (CLI missing, auth missing)
- `3` — timeout exceeded beyond max-turns
- `4` — config/fixture parse error

## Config File

`cursor-bench.config.ts`:

```ts
import { defineConfig } from "./src/config-define";

export default defineConfig({
  models: [
    "composer-2-fast",      // smoke default
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
  perFixtureDeadlineMs: 1_200_000,   // DEC-017 (20 min)
  maxTurns: 20,
  retry: { max: 1, delayMs: 2_000 },
  trackerDir: "../../docs/superpowers/bench",
  jsonlDir: "../../coverage/cursor-bench",
  fixturesDir: "./fixtures",
});
```

## Fixture Shape (TS, V1)

```ts
export default {
  id: "interview-phase1",
  skill: "interview",
  description: "Phase 1 objective/DoD/scope locking",
  maxTurns: 10,
  turns: [
    {
      prompt: "interview me for a feature to add dark mode to a CLI wizard",
      assertions: [
        { kind: "includes", pattern: "objective" },
        { kind: "regex", pattern: /recommended/i },
      ],
    },
    // ... more turns
  ],
};
```

Final format (yaml vs ts) **decide in plan phase** — TS shown here as illustration.

## Output Artifacts

### Markdown tracker (commit-able) — ML-style 3 section (DEC-020)

Path: `docs/superpowers/bench/interview.md`

```markdown
# Interview Skill — Bench Tracker

## Latest Matrix — 2026-04-17 09:10

### 1. Summary

- Mode: matrix
- Commit: `a1b2c3d4` | Skill checksum: `sha256:9f8e7d6c`
- Env: bun 1.3.10 | cursor-agent 2.4.1 | darwin 24.6
- Models: 7 | Fixtures: 1 | Runs per cell: 3
- Overall pass_rate: 19/21 (90.5%)
- Total wall-clock: 2h 14m
- Total retries: 1 | Total timeouts: 0 | Total budget-exceeded: 0

### 2. Per-Fixture × Model

| Fixture | Model | Pass rate | Mean (ms) | p50 (ms) | p95 (ms) | Turn mean | Retries | Timeouts |
|---|---|---|---|---|---|---|---|---|
| interview-phase1 | composer-2-fast | 3/3 (100%) | 11_500 | 11_200 | 12_800 | 4.0 | 0 | 0 |
| interview-phase1 | claude-4.5-sonnet | 3/3 (100%) | 18_200 | 18_000 | 19_500 | 4.0 | 0 | 0 |
| interview-phase1 | gemini-3-flash | 2/3 (67%) | 9_800 | 9_500 | 11_200 | 3.7 | 1 | 0 |
| ... |

### 3. Per-Model Ranking (pass_rate desc, then mean latency asc)

| Rank | Model | Overall pass_rate | Mean latency (ms) |
|---|---|---|---|
| 1 | composer-2-fast | 3/3 (100%) | 11_500 |
| 2 | claude-4.5-sonnet | 3/3 (100%) | 18_200 |
| 3 | gemini-3-flash | 2/3 (67%) | 9_800 |
| ... |

## Latest Smoke — 2026-04-17 10:42

### 1. Summary

- Mode: smoke
- Commit: `a1b2c3d4` | Skill checksum: `sha256:9f8e7d6c`
- Env: bun 1.3.10 | cursor-agent 2.4.1 | darwin 24.6
- Model: composer-2-fast | Runs: 1 | Fixtures: 1
- Overall pass_rate: 1/1 (100%)
- Total wall-clock: 12s

### 2. Per-Fixture × Model

| Fixture | Model | Pass rate | Mean (ms) | p50 (ms) | p95 (ms) | Turn mean | Retries | Timeouts |
|---|---|---|---|---|---|---|---|---|
| interview-phase1 | composer-2-fast | 1/1 (100%) | 12_340 | 12_340 | 12_340 | 4 | 0 | 0 |

### 3. Per-Model Ranking

| Rank | Model | Overall pass_rate | Mean latency (ms) |
|---|---|---|---|
| 1 | composer-2-fast | 1/1 (100%) | 12_340 |
```

### JSONL raw (gitignored)

Path: `coverage/cursor-bench/2026-04-17T10-42-00-interview.jsonl`

Each record includes reproducibility metadata (C10), truncation flags (C11), and env metadata (C12):

```jsonl
{"skill":"interview","fixture":"interview-phase1","model":"composer-2-fast","runIndex":0,"turn":0,"input":"...","output":"... (8KB max)","outputTruncated":false,"originalLen":2340,"durationMs":2340,"exitCode":0,"pass":true,"assertions":[...],"retried":false,"timedOut":false,"commit":"a1b2c3d4","skillChecksum":"9f8e7d6c","env":{"bun":"1.3.10","cursorAgent":"2.4.1","platform":"darwin 24.6"}}
{"skill":"interview","fixture":"interview-phase1","model":"gemini-3-flash","runIndex":2,"turn":3,"input":"...","output":"... (truncated head)","outputTruncated":true,"originalLen":18420,"outputDumpPath":"coverage/cursor-bench/2026-04-17T10-42-00-interview-fixture-interview-phase1-m-gemini-3-flash-r2-t3.txt","durationMs":9800,"exitCode":1,"pass":false,"reason":"assertion",...}
```

Full output dump file (chỉ tạo khi turn fail): plain text, no markup, full LLM response để debug.

## Auth & Secret

- **Local only** — preflight check session file tạo bởi `cursor-agent login`
- Không đọc env var, không có CI path (DEC-013)
- Fail-fast message: `"Cursor CLI session not found. Run: cursor-agent login"`
- Tracker + JSONL tuyệt đối **không** ghi bất kỳ auth data nào

## Reproducibility & Variance

- Default `runs=1` → MVP-ergonomic
- Matrix mode `runs=3` → đủ data cho pass_rate có nghĩa
- `--runs N` override trên CLI
- JSONL giữ `run_index` per record → offline aggregate
- Markdown tracker render pass_rate cả khi N=1 (hiển thị `1/1` để consistent format)

## Retry & Timeout

- Per-turn timeout 120_000 ms default (configurable per-fixture qua `turn.timeoutMs`)
- **Per-fixture-per-run deadline 1_200_000 ms (20 phút)** — runner wrap runFixture với `AbortController`/deadline timer. Vượt → abort subprocess + mark result `pass=false, timedOut=true, reason="budget-exceeded"` (DEC-017, C4)
- Max-turns 20 default (override qua `fixture.maxTurns`)
- Retry = **infra-only** (network error, spawn fail, turn timeout), max 1, delay 2s
- **Không** retry khi assertion fail hoặc khi deadline exceed — đó là signal legit của skill quality

## Testing Strategy

Framework tự nó cần test:

**Tier 1 — Unit (mock spawn):**
- `eval/l1.ts` matchers (includes, regex, exitCode)
- `fixture.ts` validator
- `preflight.ts` command spawn check (mock spawn exit code)
- `runner.ts` turn loop với mocked spawn + deadline test
- `report/aggregate.ts` quantile computation (p50/p95)
- `report/markdown.ts` 3-section rendering

**Performance gate (DEC-019, C7):**
- Entry trong `scripts/benchmark.ts`: `{ name: "bun test (cursor-agent-bench unit)", targetMs: 200, ceilingMs: 500 }`
- `bun run perf` phải xanh trước khi merge PR

**Tier 2 — Integration (stub cursor-agent):**
- Shell script stub simulate `cursor-agent` trả kết quả cố định
- End-to-end CLI invoke → markdown + JSONL sinh đúng format
- Retry path test với stub fail lần đầu, pass lần hai

**Tier 3 — Smoke (real cursor-agent):**
- 1 fixture đơn giản với 1 turn
- Chỉ chạy khi maintainer explicit opt-in (`bun run skill:bench:smoke-real`)
- Không chạy trong test suite thường

## Documentation Updates Required

**Same PR:**

- `packages/cursor-agent-bench/README.md` — usage, setup, how to add fixture
- `docs/adr/0010-cursor-cli-system-prereq.md` — document system-prereq exception (DEC-001)
- `docs/development/testing-policy.md` — add section "Skill benchmarking"
- `docs/ai/routing.md` — task type "Skill quality validation?" → bench docs
- `.github/pull_request_template.md` — checkbox "Ran `bun run skill:bench` nếu đụng skill"
- `.gitignore` — thêm `coverage/cursor-bench/`
- Root `package.json` — `skill:bench` script
- `docs/superpowers/bench/.gitkeep` hoặc README index

## Risks

| Risk | Mitigation |
|---|---|
| 🔴 Cursor CLI là external system prereq, phá dependency-scope-policy | ADR-0010 document exception, README install hướng dẫn rõ |
| 🟡 Matrix cost 2–3h cho 7 model × 3 run | README call-out, khuyến nghị maintainer chạy matrix trước release, smoke cho daily iter |
| 🟡 OAuth-only auth khó debug khi session expire | Preflight fail-fast message rõ, hướng dẫn chính xác cmd để login lại |
| 🟡 Non-deterministic LLM → flaky assertion | `--runs 3+` cho matrix, pass_rate column hiển thị variance |
| 🟢 Skill format thay đổi upstream | Fixture version-locked trong repo, refactor khi skill đổi |
| 🟢 Cursor CLI model list thay đổi | Config file dễ edit, không hardcode |

## Decision Log (Final)

| ID | Decision | Provenance |
|---|---|---|
| DEC-001 | Cursor CLI = system-prereq exception | user-stated (🔴 HIGH) |
| DEC-002 | V1 scope = interview × Cursor | user-stated |
| DEC-003 → DEC-014 | Model strategy revised: config file + smoke/matrix | superseded |
| DEC-004 | Scripted multi-turn với `--resume` | user-stated |
| DEC-005 | Eval hybrid layered, MVP = L1 | user-stated |
| DEC-006 | Per-turn timeout 120s configurable | user-stated |
| DEC-007 | Max-turns 20 default, per-fixture override | user-stated |
| DEC-008 | Retry infra-only, max 1, delay 2s | user-stated |
| DEC-009 | Package name `cursor-agent-bench` | user-stated |
| DEC-009.bis | Workspace `packages/cursor-agent-bench/` + `"private": true` | user-stated |
| DEC-010 | Run mode standalone `bun run skill:bench` (local), tracker commit-able, PR template reminder | user-stated |
| DEC-010.revised | CI workflow bỏ — local only | user-confirmed (🟡 MEDIUM) |
| DEC-011 | Output = markdown tracker + JSONL raw | user-confirmed |
| DEC-012 | Reproducibility = `--runs N`, default 1, pass_rate | user-confirmed |
| DEC-013 | Auth = OAuth `cursor-agent login` only | user-stated (🟡 MEDIUM) |
| DEC-014 | Model strategy = config file + smoke/matrix + CLI override | user-confirmed |
| DEC-015 | Model subset = 7 models incl. thinking variants | user-stated (🟡 MEDIUM cost) |
| DEC-016 | C3 relaxed: text regex đủ, không ACP strict | user-confirmed |
| DEC-017 | Per-fixture-per-run deadline 20 phút | user-confirmed |
| DEC-018 | Login = `cursor-agent status` → fallback `whoami` | user-confirmed |
| DEC-019 | Self-test entry 200/500ms vào `scripts/benchmark.ts` | user-confirmed |
| DEC-020 | Report ML-style 3 section: Summary, Per-Fixture×Model table, Per-Model ranking | user-confirmed |
| DEC-021 | Reproducibility metadata: git SHA + skill checksum trong Summary + JSONL (C10) | user-confirmed |
| DEC-022 | JSONL size control: truncate 8KB per turn + full dump file khi fail (C11) | user-confirmed |
| DEC-023 | Env metadata: bun + cursor-agent + platform (C12) | user-confirmed |
| DEC-024 | Realtime UI mode = Hybrid (progress + taskLog streaming) | 2026-04-18 spec |
| DEC-025 | Bump @clack/prompts repo-wide; add consola devDep bench-only | 2026-04-18 spec |
| DEC-026 | Strict phase isolation: consola outside loop, clack in-loop | 2026-04-18 spec |
| DEC-027 | Auto-detect TTY via process.stdout.isTTY; zero new flags | 2026-04-18 spec |
| DEC-028 | DoD must include heartbeat + CLI regression + ADR-0011 | 2026-04-18 spec |
| DEC-029 | HARD NO-STUCK: ≤1s TTY / ≤30s non-TTY | 2026-04-18 spec |
| DEC-030 | BenchUI interface = method-based | 2026-04-18 interview |
| DEC-031 | Heartbeat = adapter self-ticks | 2026-04-18 interview |
| DEC-032 | runCmd refactor = optional callbacks (backward-compat) | 2026-04-18 interview |
| DEC-033 | CLI regression = smoke wizard + no-unused-exports | 2026-04-18 interview |

## V1.1 Addendum — Realtime UX

See [spec 2026-04-18-bench-realtime-ux-design.md](./2026-04-18-bench-realtime-ux-design.md)
for the `BenchUI` adapter architecture, streaming `runCmd`, and
NO-STUCK guarantee (DEC-029). The V1 runner/report/JSONL shape is
unchanged; V1.1 is purely additive UI.

## Open Follow-ups (deferred, not blocking)

- Test fixture format (yaml vs ts) — decide in plan phase
- L2 LLM-judge evaluation — after L1 data available
- Flaky detection heuristic — after multi-run data available
- Multi-skill coverage (beyond `interview`) — additive, no refactor
- Trend comparison between bench runs — needs JSONL aggregator tool
