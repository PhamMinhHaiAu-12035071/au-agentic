---
description: "Use 29 JavaScript design/performance/loading patterns from patterns.dev. Slash-triggered — manual only."
mode: "agent"
---

# JavaScript Patterns Catalog

## Trigger Model

**Manual-only.** This prompt does NOT auto-activate. It only fires when:

- User types the slash command `/javascript-patterns` (Cursor/Claude/Copilot/Codex popup)
- User explicit prompt: "active skill javascript-patterns", "use javascript-patterns", etc.
- User asks to apply a named pattern from the catalog

If none of the above triggers fire, **DO NOT** apply any pattern — continue following the repo's existing conventions.

## Scope

Applies only to:

- `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`
- Their test & spec files: `*.test.{js,ts,jsx,tsx}`, `*.spec.{js,ts,jsx,tsx}`

Files outside this scope (`.py`, `.rb`, `.go`, `.md`, config, …) → the prompt does NOT apply even if triggered.

## How to Use

1. The table below lists 29 patterns + a one-line "when to use" hint
2. When the task clearly matches a "when to use" row, use `#file:.github/prompts/javascript-patterns/<slug>.md` **BEFORE** writing code
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
| Singleton | Exactly one shared instance across app | `javascript-patterns/singleton.md` |
| Observer | Pub-sub; broadcast state changes to subscribers | `javascript-patterns/observer.md` |
| Factory | Centralize object creation logic | `javascript-patterns/factory.md` |
| Proxy | Intercept/control access to another object | `javascript-patterns/proxy.md` |
| Mediator | Route communication between objects through a hub | `javascript-patterns/mediator.md` |
| Mixin | Compose reusable behavior into a class | `javascript-patterns/mixin.md` |
| Module | Encapsulate private state behind an export surface | `javascript-patterns/module.md` |
| Provider | Share data via React-like context to avoid prop drilling | `javascript-patterns/provider.md` |
| Prototype | Share methods across instances via prototype chain | `javascript-patterns/prototype.md` |
| Command | Encapsulate an action as a queueable/undoable object | `javascript-patterns/command.md` |
| Flyweight | Share expensive state across many similar instances | `javascript-patterns/flyweight.md` |

### Performance Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Bundle Splitting | Reduce initial JS payload; split by route/feature | `javascript-patterns/bundle-splitting.md` |
| Tree Shaking | Strip unused exports at bundle time | `javascript-patterns/tree-shaking.md` |
| Compression | Gzip/Brotli assets for transport | `javascript-patterns/compression.md` |
| JS Performance Patterns | General JS perf recipes (debounce/throttle/memoize) | `javascript-patterns/js-performance-patterns.md` |
| Third Party | Load 3rd-party scripts without blocking | `javascript-patterns/third-party.md` |
| Vite Bundle Optimization | Vite-specific chunking and splitting strategies | `javascript-patterns/vite-bundle-optimization.md` |

### Loading Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Dynamic Import | Import chunks lazily at runtime | `javascript-patterns/dynamic-import.md` |
| Static Import | Default eager import at the top of a file | `javascript-patterns/static-import.md` |
| Import on Interaction | Load a chunk on user gesture (click/hover) | `javascript-patterns/import-on-interaction.md` |
| Import on Visibility | Load a chunk when an element scrolls into view | `javascript-patterns/import-on-visibility.md` |
| Prefetch | Hint the browser to fetch a low-priority resource | `javascript-patterns/prefetch.md` |
| Preload | Critical-resource priority hint | `javascript-patterns/preload.md` |
| PRPL | Push, render, pre-cache, lazy-load | `javascript-patterns/prpl.md` |
| Route-based Splitting | Split chunks per route | `javascript-patterns/route-based.md` |
| Islands Architecture | Selective hydration of interactive islands | `javascript-patterns/islands-architecture.md` |
| Loading Sequence | Prioritize critical assets first | `javascript-patterns/loading-sequence.md` |
| View Transitions | CSS View Transitions API for smooth route changes | `javascript-patterns/view-transitions.md` |
| Virtual Lists | Render only visible rows in long lists | `javascript-patterns/virtual-lists.md` |

## Notes

- The catalog is the only routing layer loaded when the prompt triggers; detailed references load only when a pattern clearly matches.
- If the task does not clearly match any pattern, do not guess — ask the user or delegate to `/interview`.

## Attribution

References derived from [patterns.dev](https://patterns.dev) (self-declared MIT per SKILL.md frontmatter). The upstream repo [PatternsDev/skills](https://github.com/PatternsDev/skills) does not ship a root LICENSE — au-agentic authors its own MIT grant at `./LICENSE` with attribution.
