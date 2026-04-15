**Purpose:** Coding standards, naming conventions, and module boundaries for au-agentic  
**Read this when:** Feature work, refactor, or dependency tasks  
**Do not use for:** Test-specific rules (see testing-policy.md) or execution safety (see execution-policy.md)  
**Related:** execution-policy.md, docs/development/styleguide.md  
**Update when:** Coding conventions change or new patterns adopted

---

# Coding Rules

## Runtime and Module Format

**Runtime:** Bun (not Node). This repo is currently validated on Bun 1.3.10. Use `bun`, not `npm` or `node`. Bun-specific features are allowed (for example `with { type: 'text' }` imports).

**Module format:** ESM throughout (`"type": "module"` in package.json). Use `import`/`export`, not `require()`. File extensions in imports are optional where TypeScript config allows.

## Import Patterns

**Template imports (build-time only):**

```typescript
import templateContent from '../path/to/template.md' with { type: 'text' };
```

Templates are static text at build time; no runtime file I/O for templates.

**Standard imports:** External packages (`@clack/prompts`, `picocolors`, etc.). Internal modules use relative paths; prefer `.js` suffix in import specifiers for ESM resolution (for example `./steps/copy.js`, `./utils/paths.js`).

## Naming Conventions

- **Files:** kebab-case (`copy.test.ts`). Align filename with primary export when practical (`copyFilesToProject` in `copy.ts`).
- **Functions:** camelCase, verb-first (`validatePath`, `writeFile`).
- **Types/interfaces:** PascalCase (`Tool`, `CopyResult`). Suffix config objects with `Options`.
- **Constants:** `UPPER_SNAKE_CASE` for true constants; `camelCase` for structured config objects.

## Module Boundaries (`packages/cli/src/`)

- `index.ts` — entry; orchestrates the wizard.
- `steps/*` — UI via `@clack/prompts`; may import `utils/*`.
- `utils/*` — pure helpers; must not import `steps/*`.
- `templates.ts` — tool to template and target mapping; no imports from `steps/*` or `utils/*`.
- `__tests__/` — tests co-located by feature file name.

## Error Handling

**User-facing:** `console.error(colors.red('Error: ...')); process.exit(1);`

**Internal:** `throw new Error(...)` with enough context (for example the path or operation).

**Clack cancellation:** `isCancel` from `@clack/prompts`; log cancellation (for example yellow), then `process.exit(0)`.

## TypeScript Conventions

Use `import type { ... }` for type-only imports. Avoid `any`; prefer `unknown`, generics, or narrow assertions with a short comment. Strict mode is on (`strict`, `noImplicitAny`, `strictNullChecks`).

## Generated Code and Build

**Output:** Single bundle `dist/index.js`. Externalize `@clack/prompts`, `@clack/core`, `picocolors`. Preserve shebang `#!/usr/bin/env bun`. Do not commit `dist/` (gitignored).

**Rebuild** after `src/` or `templates/` changes and before publish: `bun run build`.
