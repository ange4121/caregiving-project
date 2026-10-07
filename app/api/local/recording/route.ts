import { localOnly, saveRecording } from "@/lib/server/local";

/** Editor asks: is the local helper available here? (404 on the live site.) */
export async function GET(request: Request) {
  const blocked = localOnly(request);
  if (blocked) return blocked;
  return Response.json({ local: true });
}

/** Editor → this laptop: store the recording in the temp folder for ffmpeg. */
export async function POST(request: Request) {
  const blocked = localOnly(request);
  if (blocked) return blocked;
  if (!request.body) {
    return Response.json({ error: "No file" }, { status: 400 });
  }
  const name = decodeURIComponent(
    request.headers.get("x-filename") ?? "video.mp4",
  );
  const token = await saveRecording(request.body, name);
  return Response.json({ token });
}
