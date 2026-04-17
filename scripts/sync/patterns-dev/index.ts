#!/usr/bin/env bun
/**
 * Manual sync of upstream PatternsDev/skills/javascript into
 * packages/templates/patterns-dev/javascript-patterns. Run on demand:
 *   bun run sync:upstream-patterns
 * Does NOT commit; dev reviews diff manually.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const UPSTREAM_REPO = "https://github.com/PatternsDev/skills";
const UPSTREAM_BRANCH = "main";

export function slugifyPattern(upstreamFolder: string): string {
  return upstreamFolder.replace(/-pattern$/, "");
}

export function transformUpstreamRef(upstreamContent: string, upstreamFolder: string): string {
  const frontmatterMatch = upstreamContent.match(/^---\n[\s\S]*?\n---\n/);
  const body = frontmatterMatch
    ? upstreamContent.slice(frontmatterMatch[0].length)
    : upstreamContent;
  const header = `<!-- Source: ${UPSTREAM_REPO}/tree/${UPSTREAM_BRANCH}/javascript/${upstreamFolder} | MIT — see ../LICENSE -->\n\n`;
  return header + body.replace(/^\s+/, "");
}

const REPO_ROOT = join(import.meta.dir, "../../..");
const TMP_DIR = join(REPO_ROOT, ".tmp/upstream-patterns");
const TARGET_ROOT = join(REPO_ROOT, "packages/templates/patterns-dev/javascript-patterns");

/**
 * Run a command with explicit argv (no shell interpretation).
 * Intentionally does NOT support string-form — prevents shell-injection by design.
 */
function sh(argv: string[]): string {
  const result = Bun.spawnSync({ cmd: argv, stderr: "inherit" });
  if (result.exitCode !== 0) throw new Error(`Command failed: ${argv.join(" ")}`);
  return new TextDecoder().decode(result.stdout);
}

function cloneUpstream(): void {
  // rmSync with force:true is idempotent for missing paths — no existsSync guard needed.
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  sh(["git", "clone", "--depth=1", `--branch=${UPSTREAM_BRANCH}`, UPSTREAM_REPO, TMP_DIR]);
}

function writeRef(
  tool: "claude" | "cursor" | "codex" | "copilot",
  slug: string,
  body: string,
): void {
  const path =
    tool === "copilot"
      ? join(TARGET_ROOT, "copilot/javascript-patterns", `${slug}.md`)
      : join(TARGET_ROOT, tool, "references", `${slug}.md`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function syncLicense(): void {
  const upstreamLicense = join(TMP_DIR, "LICENSE");
  if (!existsSync(upstreamLicense)) {
    console.warn(
      "  ⚠ upstream has no LICENSE — keeping local packages/templates/patterns-dev/javascript-patterns/LICENSE as source of truth",
    );
    return;
  }
  writeFileSync(join(TARGET_ROOT, "LICENSE"), readFileSync(upstreamLicense, "utf8"));
}

async function main(): Promise<void> {
  console.log("→ Cloning upstream…");
  cloneUpstream();

  console.log("→ Copying LICENSE…");
  syncLicense();

  const jsDir = join(TMP_DIR, "javascript");
  const folders = readdirSync(jsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (folders.length === 0) throw new Error("No pattern folders found in upstream");

  console.log(`→ Transforming ${folders.length} patterns…`);
  for (const folder of folders) {
    const slug = slugifyPattern(folder);
    const skillPath = join(jsDir, folder, "SKILL.md");
    if (!existsSync(skillPath)) {
      console.warn(`  ⚠ skipping ${folder} — no SKILL.md`);
      continue;
    }
    const body = transformUpstreamRef(readFileSync(skillPath, "utf8"), folder);
    for (const tool of ["claude", "cursor", "codex", "copilot"] as const) {
      writeRef(tool, slug, body);
    }
  }

  // Auto-cleanup the temp clone on success. On failure we leave it for debugging —
  // the next run's cloneUpstream() rmSync handles stale dirs anyway.
  rmSync(TMP_DIR, { recursive: true, force: true });

  console.log(`\n✓ Synced ${folders.length} patterns × 4 tools.`);
  console.log(`  Review diff: git diff packages/templates/patterns-dev/javascript-patterns/`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
