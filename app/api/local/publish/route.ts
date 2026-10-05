import path from "node:path";
import { slugify } from "@/lib/editor/draft";
import type { Lesson } from "@/lib/lesson/types";
import { publishLesson } from "@/lib/publish/publish";
import { localOnly, recordingPath } from "@/lib/server/local";

/** Run the publish script on a saved recording; writes public/lessons/<id>/. */
export async function POST(request: Request) {
  const blocked = localOnly(request);
  if (blocked) return blocked;
  const { token, lesson } = (await request.json()) as {
    token: string;
    lesson: Lesson;
  };
  const video = await recordingPath(token);
  if (!video) {
    return Response.json(
      { error: "Recording not found. Load it again." },
      { status: 404 },
    );
  }
  const id = slugify(lesson.id);
  if (!id)
    return Response.json({ error: "Lesson needs an id." }, { status: 400 });
  const outDir = path.join(process.cwd(), "public", "lessons", id);
  const log: string[] = [];
  try {
    const manifest = await publishLesson({
      video,
      lesson: { ...lesson, id },
      outDir,
      log: (l) => log.push(l),
    });
    return Response.json({ id, steps: manifest.steps.length, log });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e), log },
      { status: 500 },
    );
  }
}
