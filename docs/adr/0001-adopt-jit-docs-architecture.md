**Purpose:** Record why au-agentic adopted a four-layer, just-in-time documentation architecture.  
**Read this when:** Changing docs layout, AI routing, or shim files.  
**Do not use for:** Day-to-day CLI usage (use getting started docs).  
**Related:** [../governance/decision-records.md](../governance/decision-records.md), [../ai/routing.md](../ai/routing.md), [../index.md](../index.md)  
**Update when:** This decision is superseded or materially amended (add a new ADR; do not silently rewrite history).

---

# ADR 0001: Adopt JIT docs architecture (four layers + routing)

## Status

Accepted

**Revised 2026-04-14 after implementation:**
- DEC-A4: Exempts index/mapping files (routing.md, docs-policy.md) from max 3 cross-references rule
- Layer 2 budget: Revised from ≤25KB to ≤45KB based on actual content density
- Per-task context budget: Remains ≤28-32KB (agents load 2-3 policy files, not entire layer)

## Context

The repository historically relied on short [AGENTS.md](../../AGENTS.md) and longer [CLAUDE.md](../../CLAUDE.md) loaded into every session. Human-oriented material had no canonical home under `docs/`, and there was no AI-facing routing layer.

Pain points (from the enterprise docs epic brief):

- **No routing:** Agents and humans lacked a clear map of which document to load for a given task type.
- **Token waste:** Always-loaded shim content carried architecture and commands even when irrelevant to the current task.
- **Not scalable:** Growing policies and conventions would continue to inflate root shims without a structured place to land them.
- **Fragmented verification and testing guidance:** Checklists lived at the repository root instead of beside other developer docs.

We needed a structure that keeps shims minimal, centralizes human docs, and gives agents a tool-agnostic policy and routing layer without loading everything up front.

## Decision

Adopt a **four-layer, just-in-time (JIT) documentation architecture**:

1. **Root shims** (e.g. AGENTS.md, CLAUDE.md): minimal, always or often loaded pointers and non-negotiables.
2. **`docs/ai/`**: routing, policies, and repo map for AI agents; loaded per task type from the routing table.
3. **`docs/` canonical**: human-oriented reference, getting started, governance, support, ADRs, etc.
4. **Source and config** as the final source of truth where behavior is defined (code, package scripts).

The routing table in `docs/ai/routing.md` is the primary mechanism agents use to decide which `docs/ai/` (and optionally `docs/`) files to read for a given task.

## Consequences

**Positive:**

- **Tool-agnostic policies:** `docs/ai/` can serve multiple assistants without duplicating full CLAUDE-style blobs per tool.
- **Scalable growth:** New policies and references extend the tree instead of growing root files without bound.
- **Token efficiency:** Agents load only what the routing layer says is required for the task class.

**Negative / cost:**

- **Initial complexity:** Contributors must learn where content belongs (shim vs ai vs canonical) and keep cross-links honest.
- **Sync discipline:** Outdated docs become a correctness problem; update triggers in blueprint headers and policies must be respected.

## Alternatives considered

1. **Two-layer model (root shims + single flat `docs/`).** Rejected: still encourages large always-loaded shims or undifferentiated doc dumps, poor task-based loading, and continued token waste for agents.

2. **Heavier automation (generated doc portals, enforced sync bots) as the primary fix.** Rejected for this stage as over-engineering relative to repo size; the JIT structure addresses routing and scale first without mandatory tooling.

## References

- Epic brief: enterprise docs architecture for au-agentic (problem statement and success criteria).
- [Documentation styleguide](../governance/docs-styleguide.md) for canonical page format.
