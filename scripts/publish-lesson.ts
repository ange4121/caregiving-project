/**
 * Turn a local screen recording + lesson.json into a published lesson:
 * pixelated stills, phone-sized clips, captions, and manifest.json.
 *
 *   npm run publish-lesson -- --video <path> --lesson <lesson.json> --out public/lessons/<id>
 *
 * The raw recording is never copied. All pixelation is applied in one pass to
 * a temporary video (outside the repo); stills and clips come from that.
 */
import { spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { captionsFor } from "@/lib/captions";
import type { Lesson, Manifest, ManifestStep } from "@/lib/lesson/types";
import {
  buildFilterGraph,
  clipRanges,
  outputSize,
  validateSteps,
} from "./publish/plan";

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) =>
      reject(
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? new Error(`${cmd} not found. Install it with: brew install ffmpeg`)
          : e,
      ),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve(out)
        : reject(
            new Error(`${cmd} failed (exit ${code}):\n${err.slice(-2000)}`),
          ),
    );
  });
}

async function probe(video: string) {
  const json = await run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height:format=duration",
    "-of",
    "json",
    video,
  ]);
  const info = JSON.parse(json);
  return {
    width: info.streams[0].width as number,
    height: info.streams[0].height as number,
    durationMs: Math.round(parseFloat(info.format.duration) * 1000),
  };
}

const sec = (ms: number) => (ms / 1000).toFixed(3);
const kb = async (file: string) => Math.round((await stat(file)).size / 1024);

async function main() {
  const { values } = parseArgs({
    options: {
      video: { type: "string" },
      lesson: { type: "string" },
      out: { type: "string" },
    },
  });
  if (!values.video || !values.lesson || !values.out) {
    console.error(
      "Usage: npm run publish-lesson -- --video <path> --lesson <lesson.json> --out public/lessons/<id>",
    );
    process.exit(1);
  }
  const outDir = path.resolve(values.out);

  const lesson = JSON.parse(await readFile(values.lesson, "utf8")) as Lesson;
  const src = await probe(values.video);
  const problems = validateSteps(lesson.steps, src.durationMs);
  if (problems.length) {
    console.error("Lesson has problems:\n- " + problems.join("\n- "));
    process.exit(1);
  }

  const size = outputSize(src.width, src.height);
  const tmp = await mkdtemp(path.join(tmpdir(), "publish-lesson-"));
  const redacted = path.join(tmp, "redacted.mp4");

  try {
    console.log(
      `Pixelating and resizing ${path.basename(values.video)} → ${size.w}×${size.h}…`,
    );
    await run("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-i",
      values.video,
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
      console.log(
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
    console.log(`Done → ${path.relative(process.cwd(), outDir)}/manifest.json`);
    console.log(
      "Check every still and clip for anything private before committing.",
    );
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
