---
name: javascript-patterns
description: 29 JavaScript design, performance, and loading patterns from patterns.dev. Use when user invokes `/javascript-patterns`, says "active skill javascript-patterns", or explicitly asks to apply a named pattern (singleton, observer, factory, proxy, etc.). Only applies to JS/TS source + test/spec files.
disable-model-invocation: true
license: MIT
metadata:
  author: au-agentic
  upstream: https://github.com/PatternsDev/skills
  upstream_license: MIT (patterns.dev authors)
---

# JavaScript Patterns Catalog

## Trigger Model

**Manual-only.** This skill does NOT auto-activate. It only fires when:

- User types the slash command `/javascript-patterns` (Cursor/Claude/Copilot/Codex popup)
- User explicit prompt: "active skill javascript-patterns", "use javascript-patterns", etc.
- User asks to apply a named pattern from the catalog

If none of the above triggers fire, **DO NOT** apply any pattern — continue following the repo's existing conventions.

## Scope

Applies only to:

- `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`
- Their test & spec files: `*.test.{js,ts,jsx,tsx}`, `*.spec.{js,ts,jsx,tsx}`

Files outside this scope (`.py`, `.rb`, `.go`, `.md`, config, …) → the skill does NOT apply even if triggered.

## How to Use

1. The table below lists 29 patterns + a one-line "when to use" hint
2. When the task clearly matches a "when to use" row, `Read` the corresponding file in `references/` **BEFORE** writing code
3. Copy example code from the reference; do not rely on memory
4. Do NOT load all references at once (wastes context)

## Ambiguity Protocol

If the task **does not clearly match** a single pattern in the table (vague, multi-pattern, or pattern not in catalog):

- **DO NOT guess** — wrong guesses lead to wrong refactors.
- **Delegate to the `/interview` skill** to interview the user about intent, constraints, and file scope.
- After the interview produces a clear spec, return to this catalog and pick the matching pattern (if any).
- If the interview shows the task is outside the catalog's scope, inform the user and do not apply the skill.

## Catalog

### Design Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Singleton | Exactly one shared instance across app | `references/singleton.md` |
| Observer | Pub-sub; broadcast state changes to subscribers | `references/observer.md` |
| Factory | Centralize object creation logic | `references/factory.md` |
| Proxy | Intercept/control access to another object | `references/proxy.md` |
| Mediator | Route communication between objects through a hub | `references/mediator.md` |
| Mixin | Compose reusable behavior into a class | `references/mixin.md` |
| Module | Encapsulate private state behind an export surface | `references/module.md` |
| Provider | Share data via React-like context to avoid prop drilling | `references/provider.md` |
| Prototype | Share methods across instances via prototype chain | `references/prototype.md` |
| Command | Encapsulate an action as a queueable/undoable object | `references/command.md` |
| Flyweight | Share expensive state across many similar instances | `references/flyweight.md` |

### Performance Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Bundle Splitting | Reduce initial JS payload; split by route/feature | `references/bundle-splitting.md` |
| Tree Shaking | Strip unused exports at bundle time | `references/tree-shaking.md` |
| Compression | Gzip/Brotli assets for transport | `references/compression.md` |
| JS Performance Patterns | General JS perf recipes (debounce/throttle/memoize) | `references/js-performance-patterns.md` |
| Third Party | Load 3rd-party scripts without blocking | `references/third-party.md` |
| Vite Bundle Optimization | Vite-specific chunking and splitting strategies | `references/vite-bundle-optimization.md` |

### Loading Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Dynamic Import | Import chunks lazily at runtime | `references/dynamic-import.md` |
| Static Import | Default eager import at the top of a file | `references/static-import.md` |
| Import on Interaction | Load a chunk on user gesture (click/hover) | `references/import-on-interaction.md` |
| Import on Visibility | Load a chunk when an element scrolls into view | `references/import-on-visibility.md` |
| Prefetch | Hint the browser to fetch a low-priority resource | `references/prefetch.md` |
| Preload | Critical-resource priority hint | `references/preload.md` |
| PRPL | Push, render, pre-cache, lazy-load | `references/prpl.md` |
| Route-based Splitting | Split chunks per route | `references/route-based.md` |
| Islands Architecture | Selective hydration of interactive islands | `references/islands-architecture.md` |
| Loading Sequence | Prioritize critical assets first | `references/loading-sequence.md` |
| View Transitions | CSS View Transitions API for smooth route changes | `references/view-transitions.md` |
| Virtual Lists | Render only visible rows in long lists | `references/virtual-lists.md` |

## Notes

- The catalog is the only routing layer loaded when the skill triggers; detailed references load only when a pattern clearly matches.
- If the task does not clearly match any pattern, do not guess — ask the user or delegate to `/interview`.

## Attribution

References derived from [patterns.dev](https://patterns.dev) (self-declared MIT per SKILL.md frontmatter). The upstream repo [PatternsDev/skills](https://github.com/PatternsDev/skills) does not ship a root LICENSE — au-agentic authors its own MIT grant at `./LICENSE` with attribution.
