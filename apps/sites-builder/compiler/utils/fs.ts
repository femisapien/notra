import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/** Every regular file below `root`, recursively, as absolute paths. */
export async function listFiles(root: string): Promise<string[]> {
  const result: string[] = [];
  const walk = async (dir: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.isFile()) {
        result.push(path);
      }
    }
  };
  await walk(root);
  return result;
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
