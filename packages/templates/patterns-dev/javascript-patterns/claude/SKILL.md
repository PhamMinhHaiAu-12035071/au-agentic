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

**Manual-only.** Skill này KHÔNG tự active. Chỉ kích hoạt khi:

- User gõ slash `/javascript-patterns` (Cursor/Claude/Copilot/Codex popup)
- User explicit prompt: "active skill javascript-patterns", "dùng javascript-patterns", v.v.
- User yêu cầu áp dụng 1 pattern có trong catalog bằng tên

Nếu không có trigger ở trên, **KHÔNG** apply pattern — tiếp tục theo convention repo hiện tại.

## Scope

Chỉ áp dụng trên file:

- `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`
- File test & spec tương ứng: `*.test.{js,ts,jsx,tsx}`, `*.spec.{js,ts,jsx,tsx}`

File ngoài scope (`.py`, `.rb`, `.go`, `.md`, config, …) → skill KHÔNG áp dụng kể cả khi được trigger.

## How to Use

1. Bảng bên dưới liệt kê 29 pattern + 1 dòng "when to use"
2. Khi task khớp cột "when to use" rõ ràng, `Read` file tương ứng trong `references/` **TRƯỚC** khi viết code
3. Copy code ví dụ từ reference, không phải tự nhớ
4. KHÔNG load tất cả references cùng lúc (tốn context)

## Ambiguity Protocol

Nếu task **không khớp rõ ràng** 1 pattern trong bảng (mơ hồ, multi-pattern, pattern không có trong catalog):

- **KHÔNG đoán** — đoán sai dẫn đến refactor sai hướng.
- **Delegate sang `/interview` skill** để phỏng vấn user về ý định, constraints, file scope.
- Sau khi interview ra spec rõ ràng, quay lại catalog này và chọn pattern khớp (nếu có).
- Nếu interview cho thấy task nằm ngoài scope của catalog, thông báo user và không áp dụng skill.

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

- Catalog là lớp routing duy nhất load khi skill được trigger; reference chi tiết chỉ nạp khi pattern khớp rõ.
- Nếu task không khớp rõ pattern nào, đừng đoán — hỏi user hoặc delegate `/interview`.

## Attribution

Refs phái sinh từ [patterns.dev](https://patterns.dev) (self-declared MIT per SKILL.md frontmatter). Upstream repo [PatternsDev/skills](https://github.com/PatternsDev/skills) không ship root LICENSE — au-agentic tự viết MIT grant tại `./LICENSE` với attribution.
