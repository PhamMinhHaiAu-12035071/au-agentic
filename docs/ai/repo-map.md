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
├── docs/              # Canonical documentation (see detailed structure below)
│   ├── ai/            # AI agent policies (Layer 2)
│   ├── getting-started/
│   ├── development/
│   ├── reference/
│   ├── explanations/
│   ├── examples/
│   ├── deployment/
│   ├── governance/
│   ├── support/
│   ├── adr/           # Architecture Decision Records
│   └── superpowers/   # Meta-documentation (specs, plans)
└── .github/           # GitHub templates + workflows (see detailed structure below)
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
    ├── cursor/SKILL.md   → .cursor/skills/interview/SKILL.md
    ├── claude/SKILL.md   → .claude/skills/interview/SKILL.md
    ├── copilot.md        → .github/prompts/interview.prompt.md
    └── codex/SKILL.md    → .agents/skills/interview/SKILL.md
```

**Import mechanism:** Templates imported at build time as static text via Bun's `with { type: 'text' }` import attribute. No runtime file I/O.

**Mapping:** Defined in `packages/cli/src/templates.ts` — maps Tool enum to template content and target paths.

## docs/ — Canonical Documentation

4-layer JIT architecture with AI operating layer and human-readable documentation.

**Structure:**
```
docs/
├── index.md              # Landing page, maps entire structure
├── ai/                   # AI agent policies (Layer 2)
├── getting-started/      # Onboarding, quickstart, setup
├── development/          # Workflows, testing, contributing
├── reference/            # API, schemas, config
├── explanations/         # Architecture, design principles
├── examples/             # Code examples, walkthroughs
├── deployment/           # Deploy, migrations, runbooks
├── governance/           # Policies, compliance
├── support/              # Troubleshooting, FAQ
├── adr/                  # Architecture Decision Records
└── superpowers/          # Meta-documentation (specs, plans)
    ├── specs/
    └── plans/
```

**Purpose by directory:**
- `ai/` — AI agent JIT policies (core.md, routing.md, repo-map.md, *-policy.md files)
- `getting-started/` — User onboarding, quickstart guide, environment setup
- `development/` — Developer workflows, testing strategies, styleguide, contributing
- `reference/` — Technical references (API docs, schemas, configuration, techstack)
- `explanations/` — Architecture rationale, design principles, domain overview
- `examples/` — Code samples, feature walkthroughs, testing examples
- `deployment/` — Deployment procedures, environment configs, runbooks
- `governance/` — Project policies, compliance, decision processes
- `support/` — User support, troubleshooting guides, FAQ
- `adr/` — Architecture Decision Records with context and rationale
- `superpowers/` — Meta-documentation for specs and implementation plans

## .github/ — GitHub Templates & Workflows

GitHub-specific configuration and automation.

**Structure:**
```
.github/
├── ISSUE_TEMPLATE/           # Issue templates
├── workflows/                # CI/CD workflows
├── CODEOWNERS                # Code review assignments
├── PULL_REQUEST_TEMPLATE.md  # PR template
└── security-insights.yml     # Security metadata
```

**Purpose by directory:**
- `ISSUE_TEMPLATE/` — Structured issue forms (bug reports, feature requests, questions)
- `workflows/` — GitHub Actions CI/CD automation (docs-check.yml, security.yml)

## Root-Level Files

Project documentation, governance, and configuration files at repository root.

**Documentation & Governance:**
```
README.md                 # Project overview, quick start, badges
AGENTS.md                 # Universal AI agent contract (Layer 1 shim)
CLAUDE.md                 # Claude-specific rules, imports AGENTS.md
CONTRIBUTING.md           # Contribution guidelines, setup, PR process
LICENSE                   # MIT license full text
CHANGELOG.md              # Version history and release notes
SECURITY.md               # Security policy, vulnerability reporting
SUPPORT.md                # Support channels, getting help
CITATION.cff              # Citation metadata for academic use
```

**Configuration:**
```
package.json              # Monorepo root, workspaces, scripts, devDependencies
tsconfig.json             # TypeScript compiler config (ESNext, Bun types)
eslint.config.ts          # ESLint config (@typescript-eslint plugins)
commitlint.config.ts      # Conventional Commits enforcement config
bun.lock                  # Bun lockfile for dependency resolution
```

**Purpose by category:**
- **AGENTS.md / CLAUDE.md** — Always-loaded shims (≤5KB total), JIT routing to docs/ai/
- **CONTRIBUTING.md** — Links to docs/development/* for workflows and testing
- **Configuration files** — Runtime (Bun), type checking (tsc), linting (eslint), commit messages (commitlint)

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
