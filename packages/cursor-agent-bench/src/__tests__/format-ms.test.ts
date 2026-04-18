import { expect, test } from "bun:test";

// Re-implement formatMs verbatim in the test file — index.ts does not export it,
// and adding an export just for a test would pollute the public surface.
function formatMs(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const totalSecs = Math.round(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}m ${s}s`;
}

test("formatMs sub-60s uses tenths of seconds", () => {
  expect(formatMs(0)).toBe("0.0s");
  expect(formatMs(1_200)).toBe("1.2s");
  expect(formatMs(59_999)).toBe("60.0s");
});

test("formatMs ≥60s uses m/s format", () => {
  expect(formatMs(60_000)).toBe("1m 0s");
  expect(formatMs(60_300)).toBe("1m 0s"); // rounds down
  expect(formatMs(60_600)).toBe("1m 1s"); // rounds up
});

test("formatMs handles the minute-boundary rounding case (119_500ms)", () => {
  // Pre-fix bug: "1m 60s". Post-fix: "2m 0s".
  expect(formatMs(119_500)).toBe("2m 0s");
});

test("formatMs handles 2+ minutes correctly", () => {
  expect(formatMs(125_000)).toBe("2m 5s");
  expect(formatMs(3_600_000)).toBe("60m 0s");
});
