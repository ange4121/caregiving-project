import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { captionsFor } from "@/lib/captions";
import type { Lesson, Manifest, ManifestStep } from "@/lib/lesson/types";
import { probe, run, sec } from "./ffmpeg";
import {
  buildFilterGraph,
  clipRanges,
  outputSize,
  validateSteps,
} from "./plan";

/**
 * Server-only. Turn a local recording + lesson into a published lesson folder:
 * pixelated stills, phone-sized clips, captions, and manifest.json.
 *
 * The raw recording is never copied. All pixelation is applied in one pass to
 * a temporary video in the system temp folder; stills and clips come from that.
 */
export async function publishLesson(opts: {
  video: string;
  lesson: Lesson;
  outDir: string;
  log?: (line: string) => void;
}): Promise<Manifest> {
  const log = opts.log ?? (() => {});
  const { lesson, outDir } = opts;
  const src = await probe(opts.video);
  const problems = validateSteps(lesson.steps, src.durationMs);
  if (problems.length) {
    throw new Error("Lesson has problems:\n- " + problems.join("\n- "));
  }

  const size = outputSize(src.width, src.height);
  const tmp = await mkdtemp(path.join(tmpdir(), "publish-lesson-"));
  const redacted = path.join(tmp, "redacted.mp4");
  const kb = async (f: string) => Math.round((await stat(f)).size / 1024);

  try {
    log(`Pixelating and resizing → ${size.w}×${size.h}…`);
    await run("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-i",
      opts.video,
      "-filter_complex",
      buildFilterGraph(lesson.steps, src.durationMs, size),
      "-map",
      "[vout]",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "18",
      redacted,
    ]);

    // Start clean so removed steps don't leave old files behind.
    await mkdir(outDir, { recursive: true });
    for (const f of await readdir(outDir)) {
      if (/^(step-\d+\.jpg|clip-\d+\.mp4|manifest\.json)$/.test(f)) {
        await rm(path.join(outDir, f));
      }
    }

    const clips = clipRanges(lesson.steps, src.durationMs);
    const steps: ManifestStep[] = [];
    for (const [i, step] of lesson.steps.entries()) {
      const still = `step-${i}.jpg`;
      const clip = `clip-${i}.mp4`;
      await run("ffmpeg", [
        "-v",
        "error",
        "-y",
        "-ss",
        sec(step.t_ms),
        "-i",
        redacted,
        "-frames:v",
        "1",
        "-q:v",
        "3",
        path.join(outDir, still),
      ]);
      const r = clips[i];
      await run("ffmpeg", [
        "-v",
        "error",
        "-y",
        "-ss",
        sec(r.startMs),
        "-i",
        redacted,
        "-t",
        sec(r.endMs - r.startMs),
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "26",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        path.join(outDir, clip),
      ]);
      steps.push({ ...step, index: i, still, clip, ...captionsFor(step) });
      log(
        `  step ${i + 1}: ${step.gesture.padEnd(5)} ${still} (${await kb(path.join(outDir, still))} KB), ${clip} ${sec(r.endMs - r.startMs)}s (${await kb(path.join(outDir, clip))} KB)`,
      );
    }

    const manifest: Manifest = {
      ...lesson,
      video: {
        width: src.width,
        height: src.height,
        duration_ms: src.durationMs,
      },
      steps,
    };
    await writeFile(
      path.join(outDir, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    return manifest;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
