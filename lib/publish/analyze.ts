import {
  freezesToMoments,
  guessFromDiff,
  parseFreezeLog,
  type Moment,
} from "@/lib/editor/moments";
import { probe, run, sec } from "./ffmpeg";

// Server-only: find likely gesture moments in a recording with ffmpeg.

const ANALYZE_WIDTH = 180; // small frames are plenty for "did it change?"
const DIFF_WIDTH = 90;

async function grayFrame(video: string, ms: number, w: number, h: number) {
  const { stdout } = await run("ffmpeg", [
    "-v",
    "error",
    "-ss",
    sec(ms),
    "-i",
    video,
    "-frames:v",
    "1",
    "-vf",
    `scale=${w}:${h},format=gray`,
    "-f",
    "rawvideo",
    "-",
  ]);
  return new Uint8Array(stdout);
}

export async function findMoments(video: string): Promise<Moment[]> {
  const src = await probe(video);
  const { stderr } = await run("ffmpeg", [
    "-hide_banner",
    "-i",
    video,
    "-vf",
    `fps=15,scale=${ANALYZE_WIDTH}:-2,freezedetect=n=-50dB:d=0.4`,
    "-an",
    "-f",
    "null",
    "-",
  ]);
  const moments = freezesToMoments(parseFreezeLog(stderr), src.durationMs);

  const w = DIFF_WIDTH;
  const h = Math.round((DIFF_WIDTH * src.height) / src.width / 2) * 2;
  const out: Moment[] = [];
  for (const m of moments) {
    // Before: the still frame. After: ~130 ms into the change, when a
    // touched button is highlighted but the next screen hasn't arrived.
    const [before, after] = await Promise.all([
      grayFrame(video, m.t_ms, w, h),
      grayFrame(video, m.change_ms + 30, w, h),
    ]);
    out.push({ ...m, guess: guessFromDiff(before, after, w, h) });
  }
  return out;
}
