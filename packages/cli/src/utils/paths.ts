import { homedir } from "os";
import { resolve } from "path";

export function expandTilde(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/")) return `${homedir()}${input.slice(1)}`;
  return input;
}

export function trimTrailingSlash(input: string): string {
  return input.replace(/\/+$/, "");
}

export function resolvePath(input: string): string {
  const trimmed = input.trim();
  const expanded = expandTilde(trimmed);
  const slashTrimmed = trimTrailingSlash(expanded);
  return resolve(slashTrimmed);
}
