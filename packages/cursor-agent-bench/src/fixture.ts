import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Fixture } from "#src/types";

export function validateFixture(f: Fixture): void {
  if (!f.id) throw new Error("fixture: id is required");
  if (!f.skill) throw new Error(`fixture ${f.id}: skill is required`);
  if (!f.description) throw new Error(`fixture ${f.id}: description is required`);
  if (!Array.isArray(f.turns) || f.turns.length === 0) {
    throw new Error(`fixture ${f.id}: turns must be non-empty array`);
  }
  if (f.maxTurns !== undefined && f.maxTurns < f.turns.length) {
    throw new Error(`fixture ${f.id}: maxTurns (${f.maxTurns}) < turns.length (${f.turns.length})`);
  }
  for (const [i, t] of f.turns.entries()) {
    if (!t.prompt) throw new Error(`fixture ${f.id} turn ${i}: prompt required`);
    if (!Array.isArray(t.assertions)) {
      throw new Error(`fixture ${f.id} turn ${i}: assertions must be array`);
    }
  }
}

export async function loadAllFixtures(dir: string): Promise<Fixture[]> {
  const abs = resolve(dir);
  const entries = await readdir(abs);
  const fixtures: Fixture[] = [];
  for (const file of entries) {
    if (!file.endsWith(".ts")) continue;
    try {
      const mod = await import(join(abs, file));
      const f = mod.default as Fixture | undefined;
      if (!f) throw new Error("missing default export");
      validateFixture(f);
      fixtures.push(f);
    } catch (e) {
      throw new Error(`${file}: ${(e as Error).message}`);
    }
  }
  return fixtures;
}

export async function loadFixtureById(dir: string, id: string): Promise<Fixture> {
  const all = await loadAllFixtures(dir);
  const found = all.find((f) => f.id === id);
  if (!found) throw new Error(`fixture not found: ${id}`);
  return found;
}
