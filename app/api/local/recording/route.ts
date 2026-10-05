import { localOnly, saveRecording } from "@/lib/server/local";

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
