import { access, constants, mkdir, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function hasWritePermission(path: string): Promise<boolean> {
  try {
    await access(path, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function writeTemplate(content: string, destPath: string): Promise<void> {
  await ensureDir(dirname(destPath));
  await writeFile(destPath, content, "utf-8");
}
