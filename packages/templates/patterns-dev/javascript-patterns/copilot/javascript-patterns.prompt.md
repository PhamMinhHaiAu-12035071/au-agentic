---
description: "Use 29 JavaScript design/performance/loading patterns from patterns.dev. Slash-triggered — manual only."
mode: "agent"
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
2. Khi task khớp cột "when to use" rõ ràng, dùng `#file:.github/prompts/javascript-patterns/<slug>.md` **TRƯỚC** khi viết code
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

- Catalog là lớp routing duy nhất load khi skill được trigger; reference chi tiết chỉ nạp khi pattern khớp rõ.
- Nếu task không khớp rõ pattern nào, đừng đoán — hỏi user hoặc delegate `/interview`.

## Attribution

Refs phái sinh từ [patterns.dev](https://patterns.dev) (self-declared MIT per SKILL.md frontmatter). Upstream repo [PatternsDev/skills](https://github.com/PatternsDev/skills) không ship root LICENSE — au-agentic tự viết MIT grant tại `./LICENSE` với attribution.
