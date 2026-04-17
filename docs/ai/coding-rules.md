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

**Standard imports:**

- **External packages** (`@clack/prompts`, `picocolors`): use the bare specifier.
- **Cross-package** (between `cli` and `templates`): use the workspace alias `@au-agentic/templates/...`.
- **Intra-package** (inside `packages/cli/src/` — including `__tests__/`): you **MUST** use the `imports` field aliases declared in `packages/cli/package.json`:
    - `#utils/*` resolves to `./src/utils/*.ts`
    - `#steps/*` resolves to `./src/steps/*.ts`
- **No `.js` extension on aliases.** Write `#utils/files`, not `#utils/files.js` — the wildcard expands to the `.ts` source so adding `.js` produces `files.js.ts` which fails to resolve.
- **Relative imports are forbidden once a path leaves the current directory.** `../anything` and `./sub/anything` MUST be rewritten as `#alias/...`. Same-directory siblings (`./helpers`) are the only allowed relative form.
- **Build-time JSON/text imports** (`../package.json`, template files) are exempt — they live outside `src/` and aliases do not cover them.

The `tsconfig.json` `paths` block mirrors the `imports` field for editor support; the runtime source of truth is always the `imports` field. See `docs/adr/0005-imports-field-alias-pattern.md` for rationale.

**Verifying compliance:** `rg "from ['\"]\.\./" packages/*/src` must return zero matches except for build-time JSON imports. Run this before claiming refactor work complete.

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

Use `import type { ... }` for type-only imports. Avoid `any`; prefer `unknown`, generics, or narrow assertions with a short comment. Strict mode is on (`strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`).

**Indexed access pattern:** Under `noUncheckedIndexedAccess`, every `Record<>`/array indexed read returns `T | undefined`. Chained writes like `obj[k1][k2] = v` won't compile even after `obj[k1] ??= {}` because TS doesn't narrow through indexed lvalues. Use locally narrowed variables instead:

```typescript
let inner = obj[key];
if (inner === undefined) {
  inner = {};
  obj[key] = inner;
}
inner[k2] = v;
```

(Avoid `(obj[k] ??= {})` one-liners — Biome's `noAssignInExpressions` rule rejects assignment-in-expression.)

## TypeScript Coverage

**Every `.ts` file in the repo MUST be reachable by some `tsconfig.json` whose typecheck is wired into `bun run verify`.** Current coverage map:

| Directory | Covered by | Pipeline entry |
|---|---|---|
| `packages/cli/src/**` | `packages/cli/tsconfig.json` (`include: ["src"]`) | `bun run typecheck` (turbo) |
| `packages/cli/scripts/**` | `packages/cli/scripts/tsconfig.json` (extends root) | `bun run typecheck` (chained `tsc -p scripts/`) |
| `scripts/**` (repo root) | `scripts/tsconfig.json` (extends root) | `bun run typecheck:scripts` (chained after turbo in `verify`) |

**When adding a new `.ts` directory outside the table above** (e.g. `tools/`, a new package, a new script root): add a tsconfig that extends `tsconfig.json` (root) and wire its `tsc --noEmit -p <dir>/` into either the package's `typecheck` script OR the root `verify` chain. Then update this table.

**Why this rule exists:** Biome covers all `.ts` files by default, but `tsc --noEmit` only sees files in its `include` glob. A directory missing from any tsconfig is silently uncovered — strict-mode bugs (e.g. `noUncheckedIndexedAccess` violations) live there until an IDE catches them. The contract is intentionally explicit so coverage gaps cannot drift in unnoticed.

## Linting and Formatting

- Run Biome to detect issues: `bun run lint`
- Fix auto-fixable issues: `bun run check` (or `biome check --write .`)
- Format code: `bun run format` (or `biome format --write .`)
- Commit with clean lint (enforced via pre-commit hook)

## Generated Code and Build

**Output:** Single bundle `dist/index.js`. Externalize `@clack/prompts`, `@clack/core`, `picocolors`. Preserve shebang `#!/usr/bin/env bun`. Do not commit `dist/` (gitignored).

**Rebuild** after `src/` or `templates/` changes and before publish: `bun run build`.
