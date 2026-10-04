import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/** Every regular file below `root`, recursively, as absolute paths. */
export async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Writes `content` to `path`, creating parent directories first. */
export async function writeFileEnsured(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}
