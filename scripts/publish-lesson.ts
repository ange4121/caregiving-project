/**
 * Command-line publish. The editor's Publish button does the same thing.
 *
 *   npm run publish-lesson -- --video <path> --lesson <lesson.json> --out public/lessons/<id>
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import type { Lesson } from "@/lib/lesson/types";
import { publishLesson } from "@/lib/publish/publish";

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
  const lesson = JSON.parse(await readFile(values.lesson, "utf8")) as Lesson;
  const outDir = path.resolve(values.out);
  await publishLesson({
    video: values.video,
    lesson,
    outDir,
    log: console.log,
  });
  console.log(`Done → ${path.relative(process.cwd(), outDir)}/manifest.json`);
  console.log(
    "Check every still and clip for anything private before committing.",
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
