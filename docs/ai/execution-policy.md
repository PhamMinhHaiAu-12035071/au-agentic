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

## Performance gate

Before claiming a toolchain-related task complete, run `bun run perf`. If any benchmark row reports `FAIL`, the work is not done — fix the root cause (config drift, accidentally-broad glob, slow plugin) and re-run.
