# Mission

Smallest correct change. Preserve conventions. Verify before claiming complete.

# Universal Standards

**Read [docs/ai/gold-rules.md](./docs/ai/gold-rules.md) first.** It contains universal coding quality, agent behavior, and efficiency standards that apply across all projects.

All agents must internalize these principles before starting any task. Project-specific rules (below) extend but never contradict these foundational standards.

# Non-Negotiables

- Run `bun run verify` before claiming work complete
- No assumptions — ask when unclear
- Small diffs — one logical change per commit
- Update docs in same task — code without docs = incomplete
- No blind edits in sensitive zones (templates.ts, package.json build config)

# Source of Truth

When docs conflict, trust this order:

1. Code (actual implementation)
2. docs/ai/* (AI agent policies)
3. docs/reference/* (API, schemas, config)
4. docs/development/* (workflows, testing)
5. docs/explanations/* (architecture)
6. Other docs/

# JIT Loading

Flow: Read AGENTS.md → read docs/ai/routing.md → identify task type → load required files from routing table → expand to canonical docs only if ambiguity remains.

Per-task context budget: ≤28KB (shim 5KB + routing 5KB + policies 6KB + canonical 12KB).

# Task Routing

Compact version — see docs/ai/routing.md for full table:

- **Feature work?** Read repo-map.md + coding-rules.md
- **Bug fix?** Read testing-policy.md
- **Refactor?** Read execution-policy.md + coding-rules.md
- **Test change?** Read testing-policy.md
- **Docs-only?** Read docs-policy.md
- **CI/Deploy?** Read deployment-policy.md
- **Security?** Read security-policy.md
- **Dependency?** Read coding-rules.md
- **Unclear / Mixed?** Read repo-map.md + docs-policy.md; if still unclear, stop and ask user

Apply modifier overlays when task also involves API change, migration/data change, legacy area, or auth-sensitive area.

# Verification Minimum

Before claiming complete:

```bash
bun run verify  # typecheck + lint + test
```

If can't run verify, say so explicitly. Don't claim complete without verification output.

# Docs Sync

**Rule:** Code change without docs update = task incomplete.

See docs/ai/docs-policy.md for mapping: code change type → docs files to update.

If can't update docs immediately, create explicit follow-up before claiming done.

# Communication

Always report in completion:

- **Docs consulted:** Which files you read
- **Assumptions:** What you assumed and why
- **Files changed:** What you modified
- **Verifications run:** Output from `bun run verify`
- **Remaining risks:** Known issues or uncertainties
