**Purpose:** Conventions for writing and maintaining files under `docs/`.  
**Read this when:** Adding or editing canonical documentation.  
**Do not use for:** AI-specific policies (use [../ai/docs-policy.md](../ai/docs-policy.md)).  
**Related:** [../development/docs-contributing.md](../development/docs-contributing.md), [decision-records.md](decision-records.md), [../index.md](../index.md)  
**Update when:** Doc format rules, budgets, or review bar change.

---

# Documentation styleguide

## Voice and density

- Be concise, actionable, and focused on the reader task.
- Prefer bullets and tables over long prose paragraphs.
- Avoid filler, repetition, and conversational padding ("yapping").
- Do not use emoji in docs (including lists and callouts).

## Blueprint header (required on new canonical pages)

Use exactly these five lines at the top of Markdown files under `docs/` (except where a file type cannot carry them, e.g. raw YAML):

```markdown
**Purpose:** [What this covers]  
**Read this when:** [When to read]  
**Do not use for:** [What not to use for]  
**Related:** [Related files, max 3]  
**Update when:** [Update triggers]
```

Rules:

- **Related:** at most three links, relative paths preferred.
- **Update when:** list concrete triggers, not vague "as needed".

## Structure

- Put a horizontal rule (`---`) after the header block, then the H1 title.
- Use `**Status:**` and `**Trigger:**` blocks for skeleton or not-yet-applicable pages (per DEC-A7-style guidance).

## Length budgets

| Doc | Target max |
|-----|------------|
| [docs/ai/routing.md](../ai/routing.md) | 150 lines |
| Typical canonical page (overview, policy) | 100 lines |
| Deeper reference or runbook-style | 200 lines |

Exceed only with good cause (generated tables, large example blocks). Split content or link out rather than growing unbounded pages.

## Markdown mechanics

- Use fenced code blocks with language tags when it helps copy-paste.
- Prefer linking to source files and existing docs over duplicating long excerpts from shims.
