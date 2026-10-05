import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

// Server-only. The editor's "local helper": lets the browser hand a recording
// to ffmpeg on this same laptop. Works only on the dev server, and only for
// requests addressed to localhost, so phones on the Wi-Fi and the public
// deployment can't use it. Recordings live in the system temp folder, never
// in the repo.

const DIR = path.join(tmpdir(), "caregiving-recordings");
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Null if allowed; otherwise a response to return. */
export function localOnly(request: Request): Response | null {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }
  const host = (request.headers.get("host") ?? "").split(":")[0];
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    return Response.json(
      { error: "Open the editor at http://localhost to use this." },
      { status: 403 },
    );
  }
  return null;
}

/** Save an uploaded recording; returns a token to refer to it later. */
export async function saveRecording(
  body: ReadableStream<Uint8Array>,
  filename: string,
): Promise<string> {
  await mkdir(DIR, { recursive: true });
  // Clear out recordings older than a day.
  for (const f of await readdir(DIR)) {
    const p = path.join(DIR, f);
    if (Date.now() - (await stat(p)).mtimeMs > MAX_AGE_MS) await rm(p);
  }
  const ext = (path.extname(filename) || ".mp4").toLowerCase().slice(0, 6);
  const token = randomUUID();
  await pipeline(
    Readable.fromWeb(body as WebReadableStream<Uint8Array>),
    createWriteStream(path.join(DIR, token + ext.replace(/[^.a-z0-9]/g, ""))),
  );
  return token;
}

/** Path of a saved recording, or null for an unknown/stale token. */
export async function recordingPath(token: unknown): Promise<string | null> {
  if (typeof token !== "string" || !/^[0-9a-f-]{36}$/.test(token)) return null;
  const files = await readdir(DIR).catch(() => [] as string[]);
  const f = files.find((name) => name.startsWith(token));
  return f ? path.join(DIR, f) : null;
}
