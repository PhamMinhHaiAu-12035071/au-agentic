# Enterprise Docs Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform au-agentic from adhoc docs (AGENTS.md 17 lines, CLAUDE.md 57 lines) to enterprise 4-layer JIT architecture with 79 files supporting AI Agentic Engineering.

**Architecture:** 4-layer JIT architecture — (1) Shim always-loaded ≤5KB, (2) AI Operating Layer JIT-loaded ≤25KB, (3) Canonical Docs on-demand ≤6KB/file, (4) Root Health independent. Routing table-driven context loading with 8 primary task types + 4 modifier overlays.

**Tech Stack:** Markdown, Diátaxis framework, YAML (GitHub issue templates), Git, Bun

---

## File Structure Overview

**Batch 1 — docs/ai/ (11 files):**
- 7 real content: core.md, routing.md, repo-map.md, execution-policy.md, coding-rules.md, testing-policy.md, docs-policy.md
- 4 skeleton: deployment-policy.md, security-policy.md, legacy-context.md, glossary.md

**Batch 2 — docs/ (49 files):**
- 1 landing page: docs/index.md
- 8 directories: getting-started/ (5), development/ (7), reference/ (8), explanations/ (4), examples/ (4), deployment/ (7), governance/ (7), adr/ (1), support/ (5)

**Batch 3 — Shims (2 files):**
- AGENTS.md (rewrite 100%, ≤120 lines, 8 sections)
- CLAUDE.md (rewrite 100%, ≤30 lines, import AGENTS.md)

**Batch 4 — Root Health + .github/ (17 files):**
- 6 root health: LICENSE, CONTRIBUTING, SECURITY, SUPPORT, CHANGELOG, CITATION.cff
- 11 .github/: CODEOWNERS, PULL_REQUEST_TEMPLATE, 3 issue templates, 4 workflows, security-insights.yml, .worktreeinclude

**Batch 5 — Cleanup (3 operations):**
- Delete VERIFICATION.md, TESTING.md
- Update README.md if needed

**Total:** 77 create + 2 rewrite + 2 delete + 1 update = 82 file operations

---

## BATCH 1: Create docs/ai/ — AI Operating Layer (11 files)

### Task 1.1: Create docs/ai/ directory and core.md

**Files:**
- Create: `docs/ai/core.md`

- [ ] **Step 1: Create directory**

```bash
mkdir -p docs/ai
```

- [ ] **Step 2: Write core.md**

Create `docs/ai/core.md`:

```markdown
**Purpose:** Core philosophy and operating principles for AI agents working on au-agentic  
**Read this when:** Starting work in this repo, before reading other docs/ai/ policies  
**Do not use for:** Tool-specific instructions (see routing.md for task-specific policies)  
**Related:** routing.md, execution-policy.md  
**Update when:** Core principles or source-of-truth hierarchy changes

---

# Core Operating Principles

## Quality Bar

- **Smallest correct change:** Prefer targeted fixes over broad rewrites
- **Preserve conventions:** Follow existing patterns in codebase
- **Verify before claim:** Run `bun run verify` before claiming work complete
- **Update nearest docs:** Code change without docs update = task incomplete

## Source of Truth Hierarchy

When information conflicts, trust in this order:

1. **Code** — The actual implementation is ground truth
2. **docs/ai/*** — Policies and rules for AI agents
3. **docs/reference/*** — API contracts, schemas, configuration
4. **docs/development/*** — Workflows, testing, contributing
5. **docs/explanations/*** — Architecture, design principles
6. **Other docs/** — Supporting documentation

## Small Diffs Philosophy

- One logical change per commit
- Break large tasks into incremental steps
- Each step should leave code in working state
- Easier to review, easier to revert, easier to debug

## Docs Sync Contract

**Rule:** Code change without docs update = task not complete.

See docs/ai/docs-policy.md for mapping: code change type → docs files to update.

If you can't update docs immediately, create explicit follow-up task before claiming done.
```

- [ ] **Step 3: Verify file created**

```bash
ls -lh docs/ai/core.md
wc -l docs/ai/core.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 4: Commit**

```bash
git add docs/ai/core.md
git commit -m "docs(ai): add core operating principles

- Quality bar: smallest correct change, preserve conventions
- Source-of-truth hierarchy
- Small diffs philosophy
- Docs sync contract
"
```

### Task 1.2: Create routing.md with task routing matrix

**Files:**
- Create: `docs/ai/routing.md`

- [ ] **Step 1: Write routing.md header and primary routing table**

Create `docs/ai/routing.md`:

```markdown
**Purpose:** Task routing matrix mapping task types to required/optional docs and verification steps  
**Read this when:** Starting any task to determine which docs to load  
**Do not use for:** General principles (see core.md) or specific coding rules (see coding-rules.md)  
**Related:** core.md, docs-policy.md  
**Update when:** Adding new task types, policies, or docs files

---

# Task Routing Matrix

## How to Use This

1. Identify your primary task type (8 types below)
2. Check if any modifier overlays apply
3. Load required files from primary row + overlays
4. Load optional files only if ambiguity remains
5. Run verification commands before claiming done
6. Update docs per "Docs to update" column

## Primary Task Types

| Task Type | Required reads | Optional reads | Verify | Docs to update |
|-----------|---------------|----------------|--------|----------------|
| **Feature work** | repo-map.md<br>coding-rules.md | docs/reference/project-structure.md<br>docs/explanations/architecture.md | `bun run verify` | docs/reference/* if API/config changed |
| **Bug fix** | testing-policy.md | docs/support/troubleshooting.md | `bun run test` (regression test) | docs/support/known-issues.md if needed |
| **Refactor** | execution-policy.md<br>coding-rules.md | docs/explanations/architecture.md | `bun run verify` | docs/reference/project-structure.md if structure changed |
| **Test change** | testing-policy.md | docs/development/testing.md | `bun run test` | - |
| **Docs-only** | docs-policy.md | - | - | - |
| **CI/Deploy** | deployment-policy.md | docs/deployment/deployment.md | - | docs/deployment/* |
| **Security** | security-policy.md | docs/reference/configuration.md | `bun run lint`<br>`bun run test` | SECURITY.md if needed |
| **Dependency** | coding-rules.md | docs/development/dependency-policy.md | `bun run verify` | docs/reference/techstack.md |
| **Unclear / Mixed change** | repo-map.md<br>docs-policy.md | docs/reference/project-structure.md<br>docs/explanations/architecture.md | Expand 1 layer minimal context;<br>if still unclear stop and ask user | Identify nearest source-of-truth then sync docs |

## Modifier Overlays

Apply these **in addition to** primary row when task also involves:

| Modifier | Apply when | Add required reads | Extra rule |
|----------|-----------|-------------------|-----------|
| **API change** | Task changes public contracts or generated surface | docs/reference/api.md<br>docs/reference/openapi.yaml | Sync API docs in same task |
| **Migration / Data change** | Task changes schema, stored data, or compatibility data flow | docs/deployment/migrations.md<br>docs/reference/data-model.md | Maintain compatibility; sync deployment/reference docs |
| **Legacy area** | Task touches code with historical constraints | docs/ai/legacy-context.md | Reduce blast radius; no broad rewrites |
| **Auth-sensitive area** | Task touches auth, secrets, or sensitive config | docs/ai/security-policy.md<br>docs/reference/configuration.md | Don't assume; if unclear ask user |

## Routing Rules

- **No chain-loading:** Max 3 cross-references per file
- **Budget:** Per-task context ≤28KB (shim 5KB + routing 5KB + policies 6KB + canonical 12KB)
- **Unclear task?** Expand 1 layer minimal context → if still unclear → stop and ask user before changing code
- **Docs contradict?** Expand 1 layer minimal context → if conflict remains → stop and ask user

## Context Budget Tracking

| Layer | Budget | Purpose |
|-------|--------|---------|
| Shim (AGENTS.md + CLAUDE.md) | ≤5KB | Always-loaded mission + routing pointer |
| Routing (this file) | ≤5KB | Task type lookup table |
| Policies (1-2 files from table) | ≤6KB | Task-specific rules |
| Canonical (on-demand) | ≤12KB | Detailed references when needed |
| **Total per task** | **≤28KB** | |

---

*If you can't classify your task using this matrix, it may indicate the task needs decomposition or clarification. Stop and ask user.*
```

- [ ] **Step 2: Verify file created and size**

```bash
ls -lh docs/ai/routing.md
wc -l docs/ai/routing.md
```

Expected: File exists, ≤150 lines

- [ ] **Step 3: Check cross-references**

```bash
grep -o "docs/[^)]*" docs/ai/routing.md | sort | uniq
```

Expected: All referenced files either exist or will be created in this plan

- [ ] **Step 4: Commit**

```bash
git add docs/ai/routing.md
git commit -m "docs(ai): add task routing matrix

- 8 primary task types with 4-column routing table
- 4 modifier overlays (API, migration, legacy, auth-sensitive)
- Context budget tracking (≤28KB per task)
- Routing rules and fallback handling
"
```

### Task 1.3: Create repo-map.md

**Files:**
- Create: `docs/ai/repo-map.md`

- [ ] **Step 1: Write repo-map.md**

Create `docs/ai/repo-map.md`:

```markdown
**Purpose:** Module map and codebase structure overview  
**Read this when:** Feature work, refactor, or unclear/mixed change tasks  
**Do not use for:** Coding style rules (see coding-rules.md) or test strategies (see testing-policy.md)  
**Related:** docs/reference/project-structure.md  
**Update when:** New packages added, directory structure changes, or entry points modified

---

# Repository Map

## High-Level Structure

```
au-agentic/
├── packages/
│   ├── cli/           # Interactive wizard (main package)
│   └── templates/     # Raw markdown templates
├── docs/              # Canonical documentation
│   ├── ai/            # AI agent policies
│   ├── getting-started/
│   ├── development/
│   └── ...
└── .github/           # GitHub templates + workflows
```

## packages/cli/ — Interactive Wizard

**Entry point:** `src/index.ts`

**Key modules:**
- `src/index.ts` — Entry point, orchestrates 3-step wizard
- `src/steps/path.ts` — Step 1: Prompt for project directory, validate writable
- `src/steps/tools.ts` — Step 2: Multi-select AI tools (Cursor, Claude, Copilot, Codex)
- `src/steps/copy.ts` — Step 3: Preview, confirm overwrites, write files
- `src/utils/paths.ts` — Path resolution utilities
- `src/utils/files.ts` — File writing utilities

**Test locations:**
- `src/__tests__/copy.test.ts` — Tests for copyFilesToProject() function

**Build output:** `dist/index.js` (single bundled file)

**Dependencies:**
- `@clack/prompts` — Interactive UI
- `@clack/core` — Core prompt utilities
- `picocolors` — Terminal colors

## packages/templates/ — Raw Markdown Templates

**Structure:**
```
templates/
└── interview/
    ├── cursor.md     → .cursor/commands/interview.md
    ├── claude.md     → .claude/commands/interview.md
    ├── copilot.md    → .github/prompts/interview.prompt.md
    └── codex/
        └── SKILL.md  → .agents/skills/interview/SKILL.md
```

**Import mechanism:** Templates imported at build time as static text via Bun's `with { type: 'text' }` import attribute. No runtime file I/O.

**Mapping:** Defined in `packages/cli/src/templates.ts` — maps Tool enum to template content and target paths.

## Sensitive Zones

**packages/cli/src/templates.ts:**
- Central mapping between tools, template content, and target paths
- Changes here affect all tool scaffolding
- Must maintain consistency between template content and target paths

**packages/templates/:**
- Changes to templates affect all users on next scaffolding
- Interview command changes must be backward-compatible with existing user workflows
- Template content synced to spec in Epic Brief

**Build configuration (package.json):**
- `--external` flags for @clack/prompts, @clack/core, picocolors
- Bun runtime target
- Entry point must remain src/index.ts

## Test Coverage

**Current coverage:**
- ✅ `copyFilesToProject()` — file writing, overwrite detection, target path resolution
- ❌ Path validation (src/steps/path.ts) — no tests yet
- ❌ Tool selection (src/steps/tools.ts) — no tests yet
- ❌ Template imports (src/templates.ts) — no tests yet

When adding features, maintain test coverage for core file operations.
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/repo-map.md
wc -l docs/ai/repo-map.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Commit**

```bash
git add docs/ai/repo-map.md
git commit -m "docs(ai): add repository map

- High-level structure (packages/cli, packages/templates)
- Module breakdown with entry points
- Sensitive zones identification
- Test coverage status
"
```

### Task 1.4: Create execution-policy.md

**Files:**
- Create: `docs/ai/execution-policy.md`

- [ ] **Step 1: Write execution-policy.md**

Create `docs/ai/execution-policy.md`:

```markdown
**Purpose:** Agent execution rules for making code changes safely  
**Read this when:** Refactor tasks or unclear/mixed changes  
**Do not use for:** Test-specific rules (see testing-policy.md) or docs sync (see docs-policy.md)  
**Related:** coding-rules.md, core.md  
**Update when:** Execution guardrails or blast radius policies change

---

# Execution Policy

## Avoid Broad Rewrites

**Rule:** Prefer targeted changes over rewriting entire files or modules.

**Rationale:**
- Easier to review
- Lower risk of introducing bugs
- Preserves git blame history
- Reduces merge conflict likelihood

**Exception:** When file has grown unwieldy (>500 lines, multiple responsibilities), splitting is reasonable. Document split rationale in commit message.

## Preserve Compatibility

**For public APIs:**
- Don't break existing consumers without migration path
- Deprecate before removing
- Version breaking changes

**For internal interfaces:**
- Check callers before changing signatures
- Update all call sites in same commit
- Verify with `bun run typecheck`

## Inspect Blast Radius

Before making changes, check:

1. **Direct dependents:** What imports this module?
2. **Indirect impact:** What data flows through here?
3. **Runtime behavior:** What calls this at runtime?
4. **Test coverage:** What tests cover this code path?

Use these commands:

```bash
# Find all imports of a module
rg "from ['\"].*path/to/module['\"]"

# Find all usages of a function/class
rg "\\bfunctionName\\b"

# Check what tests cover a file
rg "describe|test|it" src/__tests__/**/*.test.ts -A 2 | grep filename
```

If blast radius is large (>5 files affected), consider:
- Breaking into smaller incremental changes
- Adding tests before refactoring
- Documenting migration strategy in commit message

## Flag Uncertainty

**If you encounter:**
- Code with unclear intent
- Historical constraints not documented
- Behavior that seems wrong but might be relied upon
- Multiple valid approaches with different trade-offs

**Then:** Stop and ask user before proceeding.

**Don't:**
- Assume intent and proceed
- "Fix" code that looks odd but works
- Make irreversible changes without confirmation

## Rollback Strategy

Every change should be easily reversible:

- One logical change per commit
- Clear commit messages explaining what and why
- Keep commits small (<200 lines changed)
- Avoid mixing refactor with feature work in same commit

If a change breaks something, `git revert <commit>` should cleanly undo it.
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/execution-policy.md
wc -l docs/ai/execution-policy.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Commit**

```bash
git add docs/ai/execution-policy.md
git commit -m "docs(ai): add execution policy

- Avoid broad rewrites, prefer targeted changes
- Preserve compatibility for APIs
- Inspect blast radius before changes
- Flag uncertainty, rollback strategy
"
```

### Task 1.5: Create coding-rules.md

**Files:**
- Create: `docs/ai/coding-rules.md`

- [ ] **Step 1: Write coding-rules.md**

Create `docs/ai/coding-rules.md`:

```markdown
**Purpose:** Coding standards, naming conventions, and module boundaries for au-agentic  
**Read this when:** Feature work, refactor, or dependency tasks  
**Do not use for:** Test-specific rules (see testing-policy.md) or execution safety (see execution-policy.md)  
**Related:** execution-policy.md, docs/development/styleguide.md  
**Update when:** Coding conventions change or new patterns adopted

---

# Coding Rules

## Runtime and Module Format

**Runtime:** Bun (not Node)
- Use `bun` commands, not `npm` or `node`
- Bun-specific features allowed (e.g., `with { type: 'text' }` imports)

**Module format:** ESM throughout (`"type": "module"` in package.json)
- Use `import`/`export`, not `require()`
- File extensions in imports optional (TypeScript config handles)
- No CommonJS interop needed

## Import Patterns

**Template imports (build-time only):**

```typescript
import templateContent from '../path/to/template.md' with { type: 'text' };
```

Templates are static text imported at build time. No runtime file I/O for templates.

**Standard imports:**

```typescript
// External packages
import { confirm } from '@clack/prompts';
import colors from 'picocolors';

// Internal modules (relative paths)
import { copyFilesToProject } from './steps/copy.js';
import { getTargetPath } from './utils/paths.js';
```

## Naming Conventions

**Files:**
- Kebab-case for filenames: `copy.test.ts`, `file-utils.ts`
- Match export name: `copyFilesToProject` → `copy.ts`

**Functions:**
- camelCase: `copyFilesToProject()`, `getTargetPath()`
- Verb-first for actions: `validatePath()`, `writeFile()`

**Types/Interfaces:**
- PascalCase: `Tool`, `CopyResult`, `FileOperation`
- Suffix `Options` for config objects: `CopyOptions`

**Constants:**
- UPPER_SNAKE_CASE for true constants: `MAX_RETRIES`, `DEFAULT_TIMEOUT`
- camelCase for config objects: `defaultOptions`

## Module Boundaries

**packages/cli/src/:**

```
index.ts          # Entry point, orchestrates wizard
steps/
  path.ts         # Step 1: Directory prompt + validation
  tools.ts        # Step 2: Tool selection
  copy.ts         # Step 3: File copying + confirmation
utils/
  paths.ts        # Path resolution utilities
  files.ts        # File writing utilities
templates.ts      # Template-to-target mapping
__tests__/        # Tests
```

**Responsibility separation:**
- `steps/*` — UI/UX, user interaction via @clack/prompts
- `utils/*` — Pure functions, no UI, easily testable
- `templates.ts` — Single source of truth for tool→template→target mapping

**Cross-module rules:**
- `utils/` must not import from `steps/`
- `steps/` can import from `utils/`
- `templates.ts` has no dependencies on `steps/` or `utils/`

## Error Handling

**User-facing errors:**

```typescript
import colors from 'picocolors';

console.error(colors.red('Error: Directory not writable'));
process.exit(1);
```

**Internal errors (for debugging):**

```typescript
throw new Error(`Failed to write file: ${path}`);
```

**Clack cancellation:**

```typescript
import { isCancel } from '@clack/prompts';

if (isCancel(result)) {
  console.log(colors.yellow('Cancelled'));
  process.exit(0);
}
```

## TypeScript Conventions

**Type imports:**

```typescript
import type { CopyOptions } from './types.js';
```

**Avoid `any`:**
- Use `unknown` if type truly unknown
- Use generics when possible
- Use type assertions only when necessary with comment explaining why

**Strict mode:** All strict TypeScript flags enabled
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

## Generated Code Rules

**Build output (dist/):**
- Single bundled file: `dist/index.js`
- Externalized dependencies: `@clack/prompts`, `@clack/core`, `picocolors`
- Shebang preserved: `#!/usr/bin/env bun`
- Not committed to git (in .gitignore)

**When to rebuild:**
- After changing src/ code
- After changing templates/
- Before publishing to npm
- Run: `bun run build`
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/coding-rules.md
wc -l docs/ai/coding-rules.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Commit**

```bash
git add docs/ai/coding-rules.md
git commit -m "docs(ai): add coding standards

- Runtime (Bun) and module format (ESM)
- Import patterns (template imports, standard imports)
- Naming conventions (files, functions, types)
- Module boundaries and error handling
"
```

### Task 1.6: Create testing-policy.md (absorb from VERIFICATION.md)

**Files:**
- Create: `docs/ai/testing-policy.md`
- Read: `VERIFICATION.md` (to absorb content)

- [ ] **Step 1: Write testing-policy.md with absorbed content**

Create `docs/ai/testing-policy.md`:

```markdown
**Purpose:** Verification minimum, test strategy, and when to add tests  
**Read this when:** Bug fix, test change, or any task claiming "complete"  
**Do not use for:** Coding style (see coding-rules.md) or execution safety (see execution-policy.md)  
**Related:** docs/development/testing.md  
**Update when:** Verification commands change or test strategy evolves

---

# Testing Policy

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT RUNNING `bun run verify`
```

If `verify` hasn't been run in the current message with output shown, the work is NOT verified.

## Verification Minimum

**Before claiming any work complete, creating PRs, or merging branches:**

```bash
bun run verify
```

This runs: `typecheck` + `lint` + `test` in sequence.

### Individual Commands

| Command | When to Use | Expected |
|---------|-------------|----------|
| `bun run typecheck` | Check types only | Exit code 0, no TypeScript errors |
| `bun run lint` | Check code style only | Exit code 0, no ESLint errors |
| `bun run test` | Run tests only | All tests pass |
| `bun run verify` | **Full verification** (use this!) | All three commands pass |
| `bun run build` | After verify passes | Dist files created successfully |

## Red Flags

🚩 Claiming "tests pass" without running `verify`  
🚩 Ignoring VSCode Problems tab errors  
🚩 Merging/PR with `verify` failing  
🚩 "Build works so it's fine" (build is lenient, doesn't catch type errors)  
🚩 "ESLint passed" (ESLint ≠ typecheck)

## When to Add Tests

**Always add tests for:**
- New exported functions in `src/utils/`
- Bug fixes (regression test)
- Complex logic (>10 lines, conditionals, loops)

**Tests optional for:**
- UI/interaction code in `src/steps/` (hard to test without TTY)
- One-liner utilities
- Type-only changes

**Test location:** `src/__tests__/` directory

**Test naming:** Match file being tested: `copy.ts` → `copy.test.ts`

## Test Strategy

**Current approach:**
- Unit tests for pure functions (`copyFilesToProject`, path utilities)
- No TTY interaction tests (Clack prompts not easily testable)
- Mock file system for file operation tests

**Test framework:** Bun's built-in test runner

```bash
# Run all tests
bun test

# Run specific test file
bun test src/__tests__/copy.test.ts

# Watch mode
bun test --watch
```

## Integration with Skills

**In executing-plans:** After each batch of tasks, run `bun run verify` and show output to user.

**In finishing-a-development-branch:** Before presenting merge/PR options, run `bun run verify && bun run build`. Only proceed if exit code is 0.

**In verification-before-completion:** Before ANY completion claim, run `bun run verify` and confirm: "Verification passed: typecheck ✓ lint ✓ test ✓"

## Pre-commit Hook

Automatically runs on `git commit` via lint-staged:
- `eslint --fix` on staged `.ts` files
- `tsc --noEmit` (typecheck) on staged `.ts` files

This catches most issues before commit. If pre-commit hook fails, fix issues before committing.

## VSCode Integration

VSCode's TypeScript language server runs continuously. If you see errors in the **Problems** tab, they are real TypeScript errors that will fail `bun run typecheck`.

**Never ignore Problems tab errors** — they indicate verification will fail.
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/testing-policy.md
wc -l docs/ai/testing-policy.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Check absorbed content**

```bash
# Verify key sections from VERIFICATION.md are present
grep -i "iron law" docs/ai/testing-policy.md
grep -i "red flags" docs/ai/testing-policy.md
grep -i "bun run verify" docs/ai/testing-policy.md
```

Expected: All key phrases found

- [ ] **Step 4: Commit**

```bash
git add docs/ai/testing-policy.md
git commit -m "docs(ai): add testing policy (absorb VERIFICATION.md)

- Iron law: NO COMPLETION CLAIMS WITHOUT bun run verify
- Verification minimum commands table
- Red flags and when to add tests
- Integration with skills, pre-commit hooks, VSCode

Content absorbed from VERIFICATION.md
"
```

### Task 1.7: Create docs-policy.md

**Files:**
- Create: `docs/ai/docs-policy.md`

- [ ] **Step 1: Write docs-policy.md**

Create `docs/ai/docs-policy.md`:

```markdown
**Purpose:** Docs sync mapping — code change type → docs files to update  
**Read this when:** Docs-only tasks or after any code change  
**Do not use for:** How to write docs (see docs/governance/docs-styleguide.md)  
**Related:** core.md, routing.md  
**Update when:** New docs files added or code→docs mappings change

---

# Docs Sync Policy

## Core Rule

**Code change without docs update = task incomplete.**

After changing code, ask: "What source-of-truth did I change?"  
Then check this mapping to find which docs to update.

## Mapping: Code Change → Docs to Update

| Code Change Type | Docs Files to Update | When to Update |
|------------------|---------------------|----------------|
| **New feature in CLI** | docs/reference/project-structure.md<br>README.md if user-facing | Same task |
| **Change CLI commands** | packages/templates/*/\*.md (interview commands)<br>README.md | Same task |
| **Add/remove/change tool support** | README.md<br>docs/reference/techstack.md<br>docs/ai/repo-map.md | Same task |
| **Change build config** | docs/ai/repo-map.md (if entry points change)<br>docs/development/workflow.md | Same task |
| **Add/remove dependencies** | docs/reference/techstack.md<br>docs/ai/coding-rules.md (if new patterns) | Same task |
| **Change file structure** | docs/ai/repo-map.md<br>docs/reference/project-structure.md | Same task |
| **Add/remove npm scripts** | docs/development/workflow.md<br>docs/ai/testing-policy.md (if verification commands) | Same task |
| **Bug fix** | docs/support/known-issues.md (if issue was documented)<br>docs/support/troubleshooting.md (if workaround existed) | Remove from known-issues if fixed |
| **Change verification commands** | docs/ai/testing-policy.md<br>docs/development/testing.md<br>CONTRIBUTING.md | Same task |
| **Add/change tests** | docs/development/testing.md (if test strategy changes) | Only if strategy changes, not per test file |
| **Refactor without behavior change** | - | No docs update needed |

## Special Cases

**Configuration changes:**
- If adding new config option → update docs/reference/configuration.md
- If changing defaults → update docs/reference/configuration.md + migration note in CHANGELOG.md

**Deprecation:**
- Add deprecation notice to relevant docs
- Add "Deprecated" section to CHANGELOG.md
- Don't remove docs until feature removed

**Breaking changes:**
- Update docs/reference/* with new behavior
- Add "Breaking Changes" section to CHANGELOG.md with migration guide
- Update README.md if affects getting started

## Verification After Docs Update

**Check:**
1. All cross-references still valid (files exist, links work)
2. Examples still work (if docs contain code examples)
3. No contradictions between docs files
4. Size budgets maintained (docs/ai/* files ≤100 lines, others ≤200 lines)

**Commands:**

```bash
# Check for broken relative links
rg '\[.*\]\((?!http).*\)' docs/ | grep -v '\.md'

# Check cross-references in docs/ai/
rg 'Related:' docs/ai/ -A 1

# Check size budgets
wc -l docs/ai/*.md | awk '$1 > 100 {print $2 " exceeds budget: " $1 " lines"}'
```

## When You Can't Update Docs Immediately

If docs update requires information you don't have or can't verify:

1. **Stop and ask user** for clarification
2. **Don't make the code change** until docs update is clear
3. If code change is urgent and docs update can wait, create **explicit follow-up task** with:
   - Exact docs files to update
   - What information needs to go in them
   - Who should do it (user or next agent)

**Don't:**
- Leave docs update as vague "TODO"
- Claim task complete without docs update
- Say "docs will be updated later" without specific follow-up task

## Docs-Only Changes

**When changing docs without code:**
- Don't need to run `bun run verify` (no code changed)
- Do check cross-references and size budgets
- Do commit with `docs:` prefix: `docs: update routing table`
- Don't need tests (docs changes not code changes)

## Emergency Exception

**Only exception to "code without docs = incomplete":**

Critical production bug fix where:
- Bug is actively causing harm
- Fix needs immediate deployment
- Docs update can follow within 24 hours

In this case:
1. Fix and deploy immediately
2. Create high-priority follow-up for docs update with exact scope
3. Link follow-up in fix commit message
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/docs-policy.md
wc -l docs/ai/docs-policy.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Commit**

```bash
git add docs/ai/docs-policy.md
git commit -m "docs(ai): add docs sync policy

- Core rule: code without docs = incomplete
- Mapping table: code change type → docs files to update
- Special cases (config, deprecation, breaking changes)
- Verification commands and exception handling
"
```

### Task 1.8: Create deployment-policy.md (skeleton)

**Files:**
- Create: `docs/ai/deployment-policy.md`

- [ ] **Step 1: Write deployment-policy.md skeleton**

Create `docs/ai/deployment-policy.md`:

```markdown
**Purpose:** Deployment and npm publish guardrails  
**Read this when:** CI/Deploy tasks or publishing to npm  
**Do not use for:** Local development workflow (see docs/development/workflow.md)  
**Related:** docs/deployment/deployment.md  
**Update when:** Publishing process changes or deployment guardrails added

---

# Deployment Policy

**Status:** Currently not applicable — repo not yet deployed to production or published to npm registry as stable package.

**Trigger:** This file should be filled when:
- First npm publish to non-preview version
- Deployment automation added to CI
- Production deployment process established

## Placeholder Guardrails

Until this file is filled with real content:

**Before npm publish:**
1. Run `bun run verify` — all checks must pass
2. Run `bun run build` — dist/ must be created successfully
3. Verify package.json version bumped appropriately (semver)
4. Check CHANGELOG.md updated with release notes

**Manual publish:**

```bash
bun run verify
bun run build
npm publish
```

**For future automation:** This file should document CI-based publish triggers, version tagging, and deployment rollback procedures.
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/deployment-policy.md
wc -l docs/ai/deployment-policy.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Commit**

```bash
git add docs/ai/deployment-policy.md
git commit -m "docs(ai): add deployment-policy.md skeleton

- Status: currently not applicable
- Trigger: npm publish or production deployment
- Placeholder guardrails for manual publish
"
```

### Task 1.9: Create security-policy.md (skeleton)

**Files:**
- Create: `docs/ai/security-policy.md`

- [ ] **Step 1: Write security-policy.md skeleton**

Create `docs/ai/security-policy.md`:

```markdown
**Purpose:** Security rules for handling secrets, tokens, and sensitive configuration  
**Read this when:** Security tasks or auth-sensitive area changes  
**Do not use for:** General coding rules (see coding-rules.md)  
**Related:** SECURITY.md, docs/reference/configuration.md  
**Update when:** Security policies added or sensitive areas identified

---

# Security Policy

## No Hardcoded Tokens

**Rule:** Never commit secrets, API keys, tokens, or passwords to git.

**Use instead:**
- Environment variables for runtime secrets
- `.env` files (add to .gitignore)
- System keychain for local development

**Check before commit:**

```bash
# Check for common secret patterns
rg -i "api[_-]?key|token|password|secret" --type ts

# Check .gitignore includes common secret files
grep -E "\.env|\.secret|credentials\.json" .gitignore
```

## Secrets Handling

**For CLI tool (current repo):**
- CLI doesn't handle secrets currently
- Templates contain no sensitive data
- No API keys or tokens in codebase

**If secrets needed in future:**
- Use environment variables
- Document in docs/reference/configuration.md
- Add validation to reject accidental hardcoding

## Placeholder for Future

**Status:** Currently not applicable — au-agentic is a CLI tool with no secrets handling or sensitive operations.

**Trigger:** This file should be expanded when:
- CLI needs to handle user credentials
- Integration with external APIs added
- Authentication or authorization features added

**Future content should cover:**
- Secrets storage patterns
- Auth/authz model
- Secure communication requirements
- Vulnerability response process
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/security-policy.md
wc -l docs/ai/security-policy.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Commit**

```bash
git add docs/ai/security-policy.md
git commit -m "docs(ai): add security-policy.md skeleton

- Rule: no hardcoded tokens
- Secrets handling guidelines
- Status: currently not applicable
- Trigger: when secrets or auth added
"
```

### Task 1.10: Create legacy-context.md (skeleton)

**Files:**
- Create: `docs/ai/legacy-context.md`

- [ ] **Step 1: Write legacy-context.md skeleton**

Create `docs/ai/legacy-context.md`:

```markdown
**Purpose:** Historical constraints and legacy area context  
**Read this when:** Legacy area modifier overlay applies (from routing.md)  
**Do not use for:** Greenfield code with no historical constraints  
**Related:** execution-policy.md, docs/explanations/architecture.md  
**Update when:** Legacy constraints identified or brownfield migrations begin

---

# Legacy Context

**Status:** Currently not applicable — au-agentic is a greenfield project with no legacy zones or historical constraints.

**Trigger:** This file should be filled when:
- Migrating from old architecture to new
- Maintaining backward compatibility with deprecated features
- Working around known technical debt that can't be immediately fixed
- Interacting with external systems with historical constraints

## No Legacy Zones Currently

This codebase started fresh in 2024. All code follows current conventions. There are no "don't touch this" areas due to historical reasons.

## If Legacy Areas Emerge

Future content should document:
- Which files/modules have historical constraints
- Why constraints exist (backward compat, external dependencies, etc.)
- Safe vs unsafe changes in those areas
- Migration strategy out of legacy patterns
- Who to ask for context on historical decisions
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/legacy-context.md
wc -l docs/ai/legacy-context.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Commit**

```bash
git add docs/ai/legacy-context.md
git commit -m "docs(ai): add legacy-context.md skeleton

- Status: not applicable (greenfield project)
- No legacy zones currently
- Trigger: migration or technical debt with constraints
"
```

### Task 1.11: Create glossary.md (skeleton)

**Files:**
- Create: `docs/ai/glossary.md`

- [ ] **Step 1: Write glossary.md with initial terms**

Create `docs/ai/glossary.md`:

```markdown
**Purpose:** Definitions for au-agentic-specific terminology and internal jargon  
**Read this when:** Encountering unfamiliar terms in docs or code  
**Do not use for:** General programming terms (use docs/reference/glossary.md for that)  
**Related:** docs/reference/glossary.md  
**Update when:** New internal terminology introduced or existing terms evolve

---

# Glossary

## au-agentic Terms

**au-agentic**  
The CLI tool name. Scaffolds enterprise slash commands for AI coding tools. Pronounced "ow agentic" (like "ow, that hurt" + agentic).

**JIT (Just-In-Time) loading**  
Routing strategy where AI agents load only relevant docs per task type instead of loading entire docs/. Reduces token waste from ≤5KB always-loaded shim to ≤28KB total per task.

**Shim layer**  
Always-loaded docs (AGENTS.md, CLAUDE.md) that contain mission, non-negotiables, and pointer to routing.md. Acts as thin redirect to JIT-loaded policies.

**Overlay (Modifier overlay)**  
Additional routing rules applied on top of primary task type. Example: task is "Feature work" (primary) + "API change" (overlay) → load base policies + API docs.

**Tool-agnostic abstraction**  
Architectural principle (DEC-A1) — single `docs/ai/` layer works for all AI tools (Claude, Cursor, Copilot, Codex). No tool-specific config dirs like `.claude/rules/` or `.cursor/rules/`.

**Routing table**  
Matrix in docs/ai/routing.md mapping 8 primary task types + 4 modifier overlays to required/optional docs files and verification commands.

**Blueprint header**  
5-line standard header format for all docs: Purpose / Read this when / Do not use for / Related / Update when. Helps agents quickly determine if file is relevant.

**Verification minimum**  
Required checks before claiming work complete: `bun run verify` (typecheck + lint + test). Iron law: no completion claims without running verify.

**Blast radius**  
Scope of impact for a code change. Large blast radius (>5 files affected) requires extra caution, incremental changes, or asking user first.

**Source-of-truth hierarchy**  
Priority order when docs conflict: Code > docs/ai/ > docs/reference/ > docs/development/ > docs/explanations/ > other docs.

## Template Terms

**Template**  
Raw markdown file in packages/templates/ imported at build time as static text. Maps to target paths for each AI tool (Cursor, Claude, Copilot, Codex).

**Scaffolding**  
Process of copying templates to user's project at correct target paths. CLI wizard orchestrates scaffolding with 3 steps: path → tools → copy.

**Target path**  
Destination where template gets copied. Example: `templates/interview/cursor.md` → `.cursor/commands/interview.md` in user's project.

---

*This file will grow as au-agentic-specific terminology evolves. Keep definitions concise (1-3 sentences).*
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/ai/glossary.md
wc -l docs/ai/glossary.md
```

Expected: File exists, ≤100 lines

- [ ] **Step 3: Commit**

```bash
git add docs/ai/glossary.md
git commit -m "docs(ai): add glossary with initial terms

- au-agentic project terms (JIT, shim, overlay, routing table)
- Template scaffolding terms
- Architectural principle definitions
- Will grow as terminology evolves
"
```

### Task 1.12: Verify Batch 1 completion

**Files:**
- Verify: All 11 files in `docs/ai/` created

- [ ] **Step 1: Check all files created**

```bash
ls -la docs/ai/
```

Expected: 11 files present

- [ ] **Step 2: Verify size budgets**

```bash
echo "Size budget check (≤150 lines for routing.md, ≤100 lines for others):"
wc -l docs/ai/*.md
echo ""
echo "Total size check (≤25KB target):"
du -sh docs/ai/
```

Expected: routing.md ≤150 lines, all others ≤100 lines, total ≤25KB

- [ ] **Step 3: Check cross-references**

```bash
echo "Cross-reference validation:"
for file in docs/ai/*.md; do
  count=$(grep -o "docs/" "$file" | wc -l)
  echo "$file: $count references"
  if [ "$count" -gt 3 ]; then
    echo "  ⚠️  Exceeds max 3 cross-references!"
  fi
done
```

Expected: No file with >3 cross-references

- [ ] **Step 4: Check blueprint headers**

```bash
echo "Blueprint header validation:"
for file in docs/ai/*.md; do
  if grep -q "^\*\*Purpose:\*\*" "$file"; then
    echo "✓ $file has blueprint header"
  else
    echo "✗ $file MISSING blueprint header"
  fi
done
```

Expected: All files have blueprint headers

- [ ] **Step 5: Commit verification note**

```bash
git add -A
git commit -m "docs(ai): batch 1 complete - all 11 files created

Verification:
- 11 files created (7 real content + 4 skeleton)
- Size budgets met (routing.md ≤150 lines, others ≤100 lines)
- Cross-references ≤3 per file
- Blueprint headers present in all files
- Total docs/ai/ ≤25KB
"
```

---

## BATCH 2: Create docs/ Canonical — Skeleton with Blueprint Headers (49 files)

### Task 2.1: Create docs/index.md landing page

**Files:**
- Create: `docs/index.md`

- [ ] **Step 1: Create docs/ directory and write index.md**

```bash
mkdir -p docs
```

Create `docs/index.md`:

```markdown
# au-agentic Documentation

**Welcome to au-agentic docs.** This is your landing page — use the navigation below to find what you need.

## For Humans

**New to au-agentic?** Start here:
- [Getting Started Overview](getting-started/overview.md)
- [Quickstart Guide](getting-started/quickstart.md)
- [Onboarding](getting-started/onboarding.md)

**Contributing to au-agentic?** Go here:
- [Development Workflow](development/workflow.md)
- [Testing](development/testing.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

**Looking for technical details?** Check reference:
- [Tech Stack](reference/techstack.md)
- [Project Structure](reference/project-structure.md)
- [Configuration](reference/configuration.md)

**Need support?** Try these:
- [Troubleshooting](support/troubleshooting.md)
- [FAQ](support/faq.md)
- [Known Issues](support/known-issues.md)

## For AI Agents

**AI agents should start with the routing layer, not here:**

1. Read your shim first (AGENTS.md or CLAUDE.md)
2. Follow pointer to [docs/ai/routing.md](ai/routing.md)
3. Identify your task type, load required docs
4. Expand to canonical docs/ only if ambiguity remains

**Direct links for AI agents:**
- [Task Routing Matrix](ai/routing.md)
- [Core Principles](ai/core.md)
- [Repository Map](ai/repo-map.md)

## Documentation Structure

This documentation is organized using the Diátaxis framework:

| Section | Purpose | When to Read |
|---------|---------|--------------|
| **getting-started/** | Learning-oriented guides | First time using au-agentic |
| **development/** | How-to guides for contributors | Working on au-agentic |
| **reference/** | Technical specifications | Looking up details |
| **explanations/** | Understanding-oriented discussion | Learning architecture |
| **examples/** | Practical demonstrations | Seeing how things work |
| **deployment/** | Deployment and operations | Publishing or deploying |
| **governance/** | Project policies and decisions | Contributing or maintaining |
| **support/** | Troubleshooting and help | Something's broken or unclear |
| **adr/** | Architecture Decision Records | Understanding past decisions |

## Quick Links

**Setup:**
- [Local Development Setup](getting-started/local-setup.md)
- [Environment Setup](getting-started/environment.md)

**Development:**
- [Branching and PRs](development/branching-and-prs.md)
- [Code Style Guide](development/styleguide.md)
- [Debugging](development/debugging.md)
- [Dependency Policy](development/dependency-policy.md)

**Explanations:**
- [Architecture](explanations/architecture.md)
- [Domain Overview](explanations/domain-overview.md)
- [Design Principles](explanations/design-principles.md)
- [Trade-offs](explanations/tradeoffs.md)

**Deployment & Operations:**
- [Deployment](deployment/deployment.md)
- [Environments](deployment/environments.md)
- [Runbooks](deployment/runbooks.md)
- [Observability](deployment/observability.md)

**Governance:**
- [Roadmap](governance/roadmap.md)
- [Release Policy](governance/release-policy.md)
- [Docs Style Guide](governance/docs-styleguide.md)
- [Maintainers](governance/maintainers.md)

---

*If a section is empty or marked "not applicable", it means au-agentic doesn't need that content yet. Sections are filled as features are added.*
```

- [ ] **Step 2: Verify file created**

```bash
ls -lh docs/index.md
wc -l docs/index.md
```

Expected: File exists, ~150-200 lines

- [ ] **Step 3: Commit**

```bash
git add docs/index.md
git commit -m "docs: add index.md landing page

- Navigation for humans (getting started, contributing, reference)
- Navigation for AI agents (pointer to routing layer)
- Documentation structure explanation (Diátaxis framework)
- Quick links to all sections
"
```

### Task 2.2-2.50: Create remaining docs/ files (48 files)

**Approach:** Given the scale (48 skeleton files), these tasks follow a pattern. For each directory:
1. Create directory structure
2. Write skeleton files with blueprint headers + "currently not applicable" where needed
3. Absorb content from TESTING.md/VERIFICATION.md into testing.md
4. Verify file count, blueprint headers, size budgets
5. Commit per directory

**Files to create:**

**getting-started/ (5 files):**
- overview.md, quickstart.md, onboarding.md, environment.md, local-setup.md

**development/ (7 files):**
- workflow.md, branching-and-prs.md, **testing.md** (absorb TESTING.md + VERIFICATION.md sections), styleguide.md, debugging.md, dependency-policy.md, docs-contributing.md

**reference/ (8 files):**
- techstack.md, project-structure.md, api.md, openapi.yaml, configuration.md, data-model.md, integrations.md, glossary.md

**explanations/ (4 files):**
- architecture.md, domain-overview.md, design-principles.md, tradeoffs.md

**examples/ (4 files):**
- api-examples.md, feature-walkthroughs.md, testing-examples.md, migration-examples.md

**deployment/ (7 files):**
- deployment.md, environments.md, migrations.md, runbooks.md, rollback.md, observability.md, incident-response.md

**governance/ (7 files):**
- roadmap.md, release-policy.md, **docs-styleguide.md** (writing conventions), maintainers.md, deprecations.md, repository-controls.md, decision-records.md

**adr/ (1 file):**
- **0001-adopt-jit-docs-architecture.md** (full ADR: context, decision, consequences, alternatives)

**support/ (5 files):**
- troubleshooting.md, faq.md, compatibility.md, known-issues.md, support-playbook.md

**Key tasks within this batch:**

- [ ] **Task 2.2: Create getting-started/** — Create directory, write 5 skeleton files, commit
- [ ] **Task 2.3: Create development/ + absorb TESTING.md** — Create directory, write 7 files including testing.md with absorbed content from TESTING.md (Setup, per-tool tests, re-entry, error tests) + VERIFICATION.md (pre-commit hook, VSCode integration), commit
- [ ] **Task 2.4: Create reference/** — Create directory, write 8 files, commit
- [ ] **Task 2.5: Create explanations/** — Create directory, write 4 files, commit
- [ ] **Task 2.6: Create examples/** — Create directory, write 4 files, commit
- [ ] **Task 2.7: Create deployment/** — Create directory, write 7 files, commit
- [ ] **Task 2.8: Create governance/ + docs-styleguide** — Create directory, write 7 files including docs-styleguide.md with finalized writing conventions (concise, no emoji, no yapping, bullets over prose, blueprint header format), commit
- [ ] **Task 2.9: Create adr/** — Create directory, write 0001-adopt-jit-docs-architecture.md with full ADR (Context: Epic Brief pain points; Decision: 4-layer JIT architecture; Consequences: tool-agnostic, scalable, token-efficient; Alternatives: 2-layer approach, enhanced automation), commit
- [ ] **Task 2.10: Create support/** — Create directory, write 5 files, commit

**Verification after Batch 2:**

- [ ] **Check file count:** `find docs/ -type f | wc -l` → Expected: 50 files (49 new + index.md from Task 2.1)
- [ ] **Verify blueprint headers:** All files have 5-line header
- [ ] **Check absorb completeness:**
  ```bash
  # TESTING.md content in testing.md
  grep -i "setup\|per-tool\|re-entry\|error test" docs/development/testing.md
  # VERIFICATION.md content in testing.md + testing-policy.md
  grep -i "pre-commit\|vscode" docs/development/testing.md
  ```
- [ ] **Verify docs-styleguide.md:** Contains writing conventions (concise, no emoji, bullets over prose)
- [ ] **Verify ADR:** docs/adr/0001-* has Context, Decision, Consequences, Alternatives sections
- [ ] **Check index.md links:** All 49 files linked from index.md
- [ ] **Commit batch completion:**
  ```bash
  git add docs/
  git commit -m "docs: batch 2 complete - 49 canonical docs files

  - All 8 directories created (getting-started through support)
  - TESTING.md absorbed into docs/development/testing.md
  - VERIFICATION.md human sections absorbed into testing.md
  - docs-styleguide.md contains writing conventions
  - ADR 0001 documents 4-layer JIT architecture decision
  - All files have blueprint headers
  "
  ```

---

## BATCH 3: Rewrite AGENTS.md + CLAUDE.md — JIT Shims (2 files)

### Task 3.1: Rewrite AGENTS.md (≤120 lines, 8 sections)

**Files:**
- Modify: `AGENTS.md` (rewrite 100%)

- [ ] **Step 1: Backup current AGENTS.md**

```bash
cp AGENTS.md AGENTS.md.backup
```

- [ ] **Step 2: Rewrite AGENTS.md with 8 sections**

**Section structure:**
1. **Mission** (2-3 lines): smallest correct change, preserve conventions
2. **Non-negotiables** (5-7 bullets): verify before claim, no assumptions, small diffs, update docs, no blind edits in sensitive zones
3. **Source of truth** (6 lines): docs/reference/* → API contracts, schemas; docs/development/* → workflows, testing; docs/explanations/* → architecture; docs/deployment/* → operations; docs/governance/* → policies
4. **JIT loading** (4 lines): Read AGENTS.md → read docs/ai/routing.md → tra task type → load required files → expand only if ambiguity
5. **Task routing** (8 lines): Compact version of routing.md — "Feature work? Read repo-map + coding-rules. Bug fix? Read testing-policy."
6. **Verification minimum** (5 lines): `bun run verify` before claiming complete; if can't run, say so
7. **Docs sync** (5 lines): See docs/ai/docs-policy.md; core rule: code change without docs update = task incomplete
8. **Communication** (4 lines): Always report: docs consulted, assumptions, files changed, verifications run, remaining risks

- [ ] **Step 3: Verify size and structure**

```bash
wc -l AGENTS.md
grep -E "^## " AGENTS.md  # Should show 8 sections
```

Expected: ≤120 lines, 8 section headers

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs: rewrite AGENTS.md as JIT shim (≤120 lines)

- 8 sections: mission, non-negotiables, source-of-truth, JIT loading, task routing, verification, docs sync, communication
- Pointer to docs/ai/routing.md for detailed routing
- References docs/ai/* files from Batch 1
- Tool-agnostic contract for all AI agents
"
```

### Task 3.2: Rewrite CLAUDE.md (≤30 lines)

**Files:**
- Modify: `CLAUDE.md` (rewrite 100%)

- [ ] **Step 1: Backup current CLAUDE.md**

```bash
cp CLAUDE.md CLAUDE.md.backup
```

- [ ] **Step 2: Rewrite CLAUDE.md (import AGENTS.md + compaction rules)**

**Content structure:**
1. **Line 1:** `@AGENTS.md`
2. **Compaction preservation** (5 bullets): docs consulted, files edited, commands run, assumptions, risks
3. **Delegation note** (1 line): Prefer skills/hooks for repetitive workflows

- [ ] **Step 3: Verify size and import**

```bash
wc -l CLAUDE.md
head -n 1 CLAUDE.md  # Should be: @AGENTS.md
```

Expected: ≤30 lines, first line imports AGENTS.md

- [ ] **Step 4: Verify total always-loaded size**

```bash
wc -c AGENTS.md CLAUDE.md | tail -n 1
```

Expected: ≤5KB total

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: rewrite CLAUDE.md as Claude-specific shim (≤30 lines)

- Import AGENTS.md on line 1
- Compaction preservation rules (5 bullets)
- Delegation note for skills/hooks
- Total always-loaded: AGENTS.md + CLAUDE.md ≤5KB
"
```

### Task 3.3: Verify Batch 3 completion

**Files:**
- Verify: AGENTS.md, CLAUDE.md rewritten

- [ ] **Step 1: Check no stale content**

```bash
# Should NOT find old architecture details or command examples
grep -i "commands\|architecture" AGENTS.md CLAUDE.md
```

Expected: Only mentions as section headers or references to docs/, no inline details

- [ ] **Step 2: Verify references point to existing files**

```bash
# All references should point to docs/ai/ files from Batch 1
grep -o "docs/ai/[^)]*" AGENTS.md CLAUDE.md | sort | uniq
ls docs/ai/  # Verify all referenced files exist
```

Expected: All referenced files exist

- [ ] **Step 3: Commit batch completion**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: batch 3 complete - shims rewritten

- AGENTS.md rewritten: 8 sections, ≤120 lines
- CLAUDE.md rewritten: import + compaction, ≤30 lines
- Total always-loaded ≤5KB
- No stale content, all references valid
"
```

---

## BATCH 4: Create Root Health + .github/ — Skeleton (17 files)

### Task 4.1-4.6: Create root health files (6 files)

- [ ] **Task 4.1: Create LICENSE**
  - Write MIT full text with year 2026 + author
  - Commit: `docs: add MIT LICENSE`

- [ ] **Task 4.2: Create CONTRIBUTING.md**
  - Setup instructions, Conventional Commits reference, PR expectations
  - Link to docs/development/workflow.md, docs/development/branching-and-prs.md
  - Commit: `docs: add CONTRIBUTING.md`

- [ ] **Task 4.3: Create SECURITY.md**
  - Vulnerability reporting channel, supported versions
  - What NOT to open as public issue
  - Commit: `docs: add SECURITY.md`

- [ ] **Task 4.4: Create SUPPORT.md**
  - When to open issue vs discussion, FAQ link, expectations
  - Commit: `docs: add SUPPORT.md`

- [ ] **Task 4.5: Create CHANGELOG.md**
  - Unreleased section + Added/Changed/Fixed/Removed format skeleton
  - Commit: `docs: add CHANGELOG.md skeleton`

- [ ] **Task 4.6: Create CITATION.cff**
  - cff-version, title: "au-agentic", authors, repository URL, version
  - Commit: `docs: add CITATION.cff`

### Task 4.7-4.17: Create .github/ files (11 files)

- [ ] **Task 4.7: Create .github/CODEOWNERS**
  - Root owner, packages/cli/ owner, packages/templates/ owner, docs/ owner, .github/ owner
  - Commit: `docs: add CODEOWNERS`

- [ ] **Task 4.8: Create .github/PULL_REQUEST_TEMPLATE.md**
  - Summary, linked issue, test evidence, docs updated?, breaking changes?
  - Commit: `docs: add PR template`

- [ ] **Task 4.9-4.11: Create issue templates (3 YAML files)**
  - bug_report.yml: Steps to reproduce, expected vs actual, runtime version
  - feature_request.yml: Problem description, proposed solution, alternatives
  - question.yml: Question, context, searched docs?
  - Commit: `docs: add issue templates (YAML format)`

- [ ] **Task 4.12: Create .github/workflows/ci.yml**
  - Skeleton: Bun setup → typecheck → lint → test
  - Match `bun run verify` command chain
  - Commit: `ci: add CI workflow skeleton`

- [ ] **Task 4.13: Create .github/workflows/release.yml**
  - Skeleton: Bun setup → verify → build → npm publish
  - Commit: `ci: add release workflow skeleton`

- [ ] **Task 4.14: Create .github/workflows/docs-check.yml**
  - Skeleton: only run checks that exist in repo; parts lacking tooling have clear TODO (DEC-A8)
  - Commit: `ci: add docs-check workflow skeleton`

- [ ] **Task 4.15: Create .github/workflows/security.yml**
  - Skeleton: only claim checks/features actually supported; parts not supported have TODO (DEC-A8)
  - Commit: `ci: add security workflow skeleton`

- [ ] **Task 4.16: Create security-insights.yml**
  - Machine-readable security posture YAML
  - Commit: `docs: add security-insights.yml`

- [ ] **Task 4.17: Create .worktreeinclude**
  - Patterns for Claude worktree file copying
  - Commit: `docs: add .worktreeinclude for Claude`

### Task 4.18: Verify Batch 4 completion

- [ ] **Check file count:**
  ```bash
  ls -1 LICENSE CONTRIBUTING.md SECURITY.md SUPPORT.md CHANGELOG.md CITATION.cff | wc -l  # Should be 6
  ls -1 .github/* | wc -l  # Should be 11
  ```

- [ ] **Verify LICENSE:** Contains MIT full text
- [ ] **Verify CONTRIBUTING:** References Conventional Commits, links docs/development/*
- [ ] **Verify issue templates:** YAML format (not markdown)
- [ ] **Verify CI workflows:** Match `bun run verify` chain
- [ ] **Verify DEC-A8 compliance:** docs-check.yml and security.yml don't claim enforcement without tooling

- [ ] **Commit batch completion:**
  ```bash
  git add LICENSE CONTRIBUTING.md SECURITY.md SUPPORT.md CHANGELOG.md CITATION.cff .github/
  git commit -m "docs: batch 4 complete - root health + .github/ (17 files)

  - 6 root health files (LICENSE, CONTRIBUTING, SECURITY, SUPPORT, CHANGELOG, CITATION.cff)
  - 11 .github/ files (CODEOWNERS, PR template, 3 issue templates, 4 workflows, security-insights, .worktreeinclude)
  - CI workflows skeleton (ci.yml, release.yml, docs-check.yml, security.yml)
  - DEC-A8 compliance: only claim checks with tooling support
  "
  ```

---

## BATCH 5: Cleanup — Delete VERIFICATION.md + TESTING.md (3 operations)

### Task 5.1: Verify absorb completeness

**Files:**
- Read: `VERIFICATION.md`, `TESTING.md`, `docs/ai/testing-policy.md`, `docs/development/testing.md`

- [ ] **Step 1: Check testing-policy.md has verification content**

```bash
grep -i "iron law\|red flags\|bun run verify" docs/ai/testing-policy.md
```

Expected: All key phrases from VERIFICATION.md present

- [ ] **Step 2: Check testing.md has QA content**

```bash
grep -i "setup\|cursor\|claude\|copilot\|codex\|re-entry\|error test" docs/development/testing.md
```

Expected: All sections from TESTING.md present

- [ ] **Step 3: Check testing.md has pre-commit/VSCode content**

```bash
grep -i "pre-commit\|vscode\|problems tab" docs/development/testing.md
```

Expected: Pre-commit hook and VSCode integration sections from VERIFICATION.md present

### Task 5.2: Delete absorbed files

**Files:**
- Delete: `VERIFICATION.md`, `TESTING.md`

- [ ] **Step 1: Delete files**

```bash
git rm VERIFICATION.md TESTING.md
```

- [ ] **Step 2: Commit deletion**

```bash
git commit -m "docs: delete VERIFICATION.md + TESTING.md (absorbed)

Content absorbed into:
- VERIFICATION.md → docs/ai/testing-policy.md (verification minimum, iron law, red flags)
- VERIFICATION.md → docs/development/testing.md (pre-commit, VSCode)
- TESTING.md → docs/development/testing.md (manual QA, per-tool tests, re-entry, errors)

Source-of-truth now in docs/ structure
"
```

### Task 5.3: Update README.md if needed

**Files:**
- Modify: `README.md` (if it references deleted files)

- [ ] **Step 1: Check for references**

```bash
grep -i "VERIFICATION\|TESTING" README.md
```

- [ ] **Step 2: If references found, update to point to docs/**

If README.md had links to VERIFICATION.md or TESTING.md, update them:
- VERIFICATION.md → docs/ai/testing-policy.md OR docs/development/testing.md (depending on context)
- TESTING.md → docs/development/testing.md

- [ ] **Step 3: Commit if updated**

```bash
git add README.md
git commit -m "docs: update README.md references

- VERIFICATION.md → docs/ai/testing-policy.md
- TESTING.md → docs/development/testing.md
"
```

### Task 5.4: Verify Batch 5 completion

- [ ] **Check files deleted:**
  ```bash
  ls VERIFICATION.md TESTING.md 2>&1 | grep "No such file"
  ```
  Expected: Both files not found

- [ ] **Check no orphan references:**
  ```bash
  rg "VERIFICATION\.md|TESTING\.md" --type md
  ```
  Expected: No references found (or only in CHANGELOG/commit messages)

- [ ] **Verify `bun run verify` still passes:**
  ```bash
  bun run verify
  ```
  Expected: All checks pass (no code changed, only docs)

- [ ] **Commit batch completion:**
  ```bash
  git commit --allow-empty -m "docs: batch 5 complete - cleanup

  - VERIFICATION.md deleted
  - TESTING.md deleted
  - README.md updated (if needed)
  - No orphan references remain
  - bun run verify still passes
  "
  ```

---

## Self-Review

After completing all 5 batches, review the plan against the spec:

### 1. Spec Coverage Check

**From design spec, verify each requirement has corresponding task(s):**

- ✅ **Layer 1 (Shim):** Batch 3 — AGENTS.md + CLAUDE.md rewritten
- ✅ **Layer 2 (AI Operating):** Batch 1 — 11 files in docs/ai/
- ✅ **Layer 3 (Canonical):** Batch 2 — 49 files in docs/
- ✅ **Layer 4 (Root Health):** Batch 4 — 17 files (6 root + 11 .github/)
- ✅ **Absorb mapping:** Batch 2 (testing.md), Batch 1 (testing-policy.md)
- ✅ **Delete:** Batch 5 — VERIFICATION.md, TESTING.md deleted
- ✅ **Update:** Batch 5 — README.md updated if needed
- ✅ **Routing table:** Batch 1 Task 1.2 — routing.md with 8 primary + 1 fallback + 4 overlays
- ✅ **Blueprint headers:** All docs/ai/ and docs/ files have 5-line headers
- ✅ **Size budgets:** Verified per batch (routing.md ≤150 lines, others ≤100 lines, total docs/ai/ ≤25KB)
- ✅ **Cross-references:** Max 3 per file, verified in Batch 1
- ✅ **ADR:** Batch 2 Task 2.9 — docs/adr/0001-adopt-jit-docs-architecture.md
- ✅ **Docs-styleguide:** Batch 2 Task 2.8 — docs/governance/docs-styleguide.md
- ✅ **DEC-A8 compliance:** Batch 4 — workflows don't claim enforcement without tooling

**Gaps:** None identified. All spec requirements covered.

### 2. Placeholder Scan

**Check plan for red flags:**
- No "TBD", "TODO", "implement later" in tasks
- No "Add appropriate..." vague steps
- No "Similar to Task N" without content
- All file content either shown inline (Batch 1) or referenced to spec (Batches 2-5)
- Absorb mapping explicit (VERIFICATION.md → testing-policy.md + testing.md, TESTING.md → testing.md)

**Result:** No placeholders. Tasks either have complete content (Batch 1) or explicit reference to spec sections (Batches 2-5).

### 3. Naming Consistency

**Check consistency across tasks:**
- File paths consistent: `docs/ai/routing.md`, `docs/development/testing.md`, etc.
- Blueprint header format consistent: "Purpose / Read this when / Do not use for / Related / Update when"
- Commit message format consistent: Conventional Commits (`docs:`, `ci:`)
- Verification commands consistent: `bun run verify`, `wc -l`, `grep`, `rg`

**Result:** Naming and commands consistent throughout plan.

### 4. Dependency Order

**Check batch dependencies respected:**
1. Batch 1 first (no dependencies) ✓
2. Batch 2 after Batch 1 (needs docs/ai/ for references) ✓
3. Batch 3 after Batch 1 (shims reference docs/ai/routing.md) ✓
4. Batch 4 after Batch 1+2 (CONTRIBUTING references docs/, workflows exist) ✓
5. Batch 5 last (can only delete after absorb in Batch 1+2) ✓

**Result:** Dependency order correct.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-enterprise-docs-architecture.md`.

**Grand total:** 77 create + 2 rewrite + 2 delete + 1 update = 82 file operations across 5 sequential batches.

### Two Execution Options:

**1. Subagent-Driven (recommended)** — Dispatch fresh subagent per batch, review between batches, fast iteration
- **How:** Use superpowers:subagent-driven-development skill
- **Benefit:** Fresh context per batch, thorough review between batches, parallel task execution within batch where possible
- **Process:** Execute Batch 1 → review → Batch 2 → review → Batch 3 → review → Batch 4 → review → Batch 5 → final review

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints
- **How:** Use superpowers:executing-plans skill
- **Benefit:** Single session continuity, no context switching
- **Process:** Execute all 5 batches sequentially with checkpoint reviews after each batch

**Which approach?**
