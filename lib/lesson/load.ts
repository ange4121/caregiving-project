import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Manifest } from "./types";

const LESSONS_DIR = path.join(process.cwd(), "public", "lessons");

/** Server-only: ids of every published lesson folder that has a manifest. */
export async function listLessonIds(): Promise<string[]> {
  const entries = await readdir(LESSONS_DIR, { withFileTypes: true }).catch(
    () => [],
  );
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/** Server-only: read a lesson's manifest, or null if it doesn't exist. */
export async function loadManifest(id: string): Promise<Manifest | null> {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  try {
    const raw = await readFile(
      path.join(LESSONS_DIR, id, "manifest.json"),
      "utf8",
    );
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}
