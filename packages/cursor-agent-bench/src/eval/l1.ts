import type { Assertion, AssertionResult } from "#src/types";

interface Context {
  output: string;
  exitCode: number;
}

export function evalAssertion(a: Assertion, ctx: Context): AssertionResult {
  const base = { kind: a.kind, description: a.description };
  switch (a.kind) {
    case "includes": {
      const ok = ctx.output.includes(String(a.pattern));
      return {
        ...base,
        ok,
        reason: ok ? undefined : `pattern "${String(a.pattern)}" not found in output`,
      };
    }
    case "notIncludes": {
      const ok = !ctx.output.includes(String(a.pattern));
      return {
        ...base,
        ok,
        reason: ok ? undefined : `pattern "${String(a.pattern)}" unexpectedly present`,
      };
    }
    case "regex": {
      const re = a.pattern instanceof RegExp ? a.pattern : new RegExp(String(a.pattern));
      const ok = re.test(ctx.output);
      return {
        ...base,
        ok,
        reason: ok ? undefined : `regex ${re} did not match output`,
      };
    }
    case "exitCode": {
      const expected = Number(a.pattern);
      if (!Number.isFinite(expected)) {
        return {
          ...base,
          ok: false,
          reason: `exitCode pattern must be numeric, got: ${String(a.pattern)}`,
        };
      }
      const ok = ctx.exitCode === expected;
      return {
        ...base,
        ok,
        reason: ok ? undefined : `exitCode ${ctx.exitCode} !== ${expected}`,
      };
    }
    default:
      return { ...base, ok: false, reason: `unknown assertion kind: ${String(a.kind)}` };
  }
}
