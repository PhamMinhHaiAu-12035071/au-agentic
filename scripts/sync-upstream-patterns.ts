#!/usr/bin/env bun
/**
 * Manual sync of upstream PatternsDev/skills/javascript into
 * packages/templates/javascript-patterns. Run on demand:
 *   bun run sync:upstream-patterns
 * Does NOT commit; dev reviews diff manually.
 */
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

// Remaining orchestration logic added in Task 3
