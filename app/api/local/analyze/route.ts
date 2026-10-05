import { findMoments } from "@/lib/publish/analyze";
import { localOnly, recordingPath } from "@/lib/server/local";

/** Find likely gesture moments (screen still → changes) in a saved recording. */
export async function POST(request: Request) {
  const blocked = localOnly(request);
  if (blocked) return blocked;
  const { token } = await request.json();
  const video = await recordingPath(token);
  if (!video) {
    return Response.json({ error: "Recording not found" }, { status: 404 });
  }
  try {
    return Response.json({ moments: await findMoments(video) });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
