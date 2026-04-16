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
Destination where template gets copied. Example: `templates/interview/cursor/SKILL.md` → `.cursor/skills/interview/SKILL.md` in user's project.

---

*This file will grow as au-agentic-specific terminology evolves. Keep definitions concise (1-3 sentences).*
