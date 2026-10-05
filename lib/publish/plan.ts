import type { LessonStep } from "@/lib/lesson/types";

// Pure planning for the publish script: time ranges and the ffmpeg filter
// graph. No I/O here, so it can be unit-tested.

/** Published media width in px (phones; keeps clips small). */
export const OUT_WIDTH = 720;
export const OUT_FPS = 30;
/** The last clip has no next step to stop at; cap it. */
export const LAST_CLIP_MAX_MS = 4000;

export interface Range {
  startMs: number;
  endMs: number;
}

/** Output size: 720 px wide (or narrower if the source is), even height. */
export function outputSize(width: number, height: number) {
  const w = Math.min(OUT_WIDTH, width - (width % 2));
  const h = Math.round((w * height) / width / 2) * 2;
  return { w, h };
}

/**
 * When each step's redaction boxes apply: from the step to the next step
 * (the last step runs to the end of the video).
 */
export function redactRanges(
  steps: readonly Pick<LessonStep, "t_ms">[],
  durationMs: number,
): Range[] {
  return steps.map((s, i) => ({
    startMs: s.t_ms,
    endMs: i + 1 < steps.length ? steps[i + 1].t_ms : durationMs,
  }));
}

/** Clip N runs from step N to step N+1; the last one is capped. */
export function clipRanges(
  steps: readonly Pick<LessonStep, "t_ms">[],
  durationMs: number,
): Range[] {
  return redactRanges(steps, durationMs).map((r, i) =>
    i === steps.length - 1
      ? { ...r, endMs: Math.min(r.endMs, r.startMs + LAST_CLIP_MAX_MS) }
      : r,
  );
}

const sec = (ms: number) => (ms / 1000).toFixed(3);

/**
 * ffmpeg filter graph: normalize fps and size, then pixelate every box during
 * its step's time range. Output label: [vout].
 */
export function buildFilterGraph(
  steps: readonly Pick<LessonStep, "t_ms" | "blur">[],
  durationMs: number,
  size: { w: number; h: number },
): string {
  const { w: W, h: H } = size;
  const block = Math.max(8, Math.round(W / 45));
  const parts = [
    `[0:v]fps=${OUT_FPS},scale=${W}:${H},setsar=1,format=yuv420p[v0]`,
  ];
  let k = 0;
  redactRanges(steps, durationMs).forEach((range, i) => {
    for (const b of steps[i].blur) {
      const x = Math.max(0, Math.floor(b.x * W));
      const y = Math.max(0, Math.floor(b.y * H));
      const bw = Math.min(W - x, Math.ceil(b.w * W));
      const bh = Math.min(H - y, Math.ceil(b.h * H));
      if (bw <= 0 || bh <= 0) continue;
      parts.push(
        `[v${k}]split[a${k}][b${k}]`,
        `[b${k}]crop=${bw}:${bh}:${x}:${y},pixelize=w=${block}:h=${block}[p${k}]`,
        `[a${k}][p${k}]overlay=${x}:${y}:enable='between(t,${sec(range.startMs)},${sec(range.endMs)})'[v${k + 1}]`,
      );
      k++;
    }
  });
  parts.push(`[v${k}]null[vout]`);
  return parts.join(";");
}

/** Basic checks before spending time on ffmpeg. Returns problems, if any. */
export function validateSteps(
  steps: readonly LessonStep[],
  durationMs: number,
): string[] {
  const problems: string[] = [];
  if (steps.length === 0) problems.push("Lesson has no steps.");
  steps.forEach((s, i) => {
    const n = `Step ${i + 1}`;
    if (s.t_ms < 0 || s.t_ms >= durationMs)
      problems.push(`${n}: time ${s.t_ms} ms is outside the video.`);
    if (i > 0 && s.t_ms <= steps[i - 1].t_ms)
      problems.push(`${n}: steps must be in time order.`);
    if (s.gesture !== "self" && (s.x === null || s.y === null))
      problems.push(
        `${n}: no position on screen. In the editor, go to the step and do the gesture on the video.`,
      );
    if (s.gesture === "swipe" && !s.swipe_direction)
      problems.push(`${n}: swipe needs a direction.`);
  });
  return problems;
}
