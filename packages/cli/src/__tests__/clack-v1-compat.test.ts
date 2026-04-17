import { describe, expect, test } from "bun:test";
import * as clack from "@clack/prompts";

/**
 * DEC-033 — CLI regression after @clack/prompts 0.9.1 -> 1.2.0 bump.
 * Locks the surface the wizard uses so renames/removals fail loudly here
 * instead of at runtime on a user's terminal.
 */

describe("clack v1 compat — no unused exports", () => {
  // Symbols the wizard imports today. Grep guard:
  //   rg -o "p\\.\\w+" packages/cli/src --no-filename | sort -u
  const requiredSymbols = [
    "intro",
    "outro",
    "cancel",
    "text",
    "select",
    "multiselect",
    "confirm",
    "isCancel",
    "spinner",
    "note",
    "log",
  ] as const;

  for (const sym of requiredSymbols) {
    test(`exports ${sym}`, () => {
      expect((clack as Record<string, unknown>)[sym]).toBeDefined();
    });
  }

  test("log has error method", () => {
    expect(clack.log.error).toBeTypeOf("function");
  });

  test("spinner returns start/stop handle", () => {
    const s = clack.spinner();
    expect(s.start).toBeTypeOf("function");
    expect(s.stop).toBeTypeOf("function");
  });
});
