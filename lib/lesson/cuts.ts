// Cuts: parts of the recording left out of the published lesson (a trimmed
// start or end, or a section in the middle). Stored in the lesson in original
// recording time; the recording itself is never edited. Pure functions.

export interface Cut {
  start_ms: number;
  end_ms: number;
}

/** Shorter than this isn't worth a cut (and is probably a mis-click). */
export const MIN_CUT_MS = 100;

/** Clamp to the video, drop tiny cuts, sort, and merge overlapping ones. */
export function normalizeCuts(cuts: readonly Cut[], durationMs: number): Cut[] {
  const clamped = cuts
    .map((c) => ({
      start_ms: Math.max(0, Math.min(c.start_ms, c.end_ms)),
      end_ms: Math.min(durationMs, Math.max(c.start_ms, c.end_ms)),
    }))
    .filter((c) => c.end_ms - c.start_ms >= MIN_CUT_MS)
    .sort((a, b) => a.start_ms - b.start_ms);
  const out: Cut[] = [];
  for (const c of clamped) {
    const last = out[out.length - 1];
    if (last && c.start_ms <= last.end_ms) {
      last.end_ms = Math.max(last.end_ms, c.end_ms);
    } else {
      out.push({ ...c });
    }
  }
  return out;
}

/** The cut containing `t` (start inclusive, end exclusive), if any. */
export function cutAt(cuts: readonly Cut[], t: number): Cut | null {
  return cuts.find((c) => t >= c.start_ms && t < c.end_ms) ?? null;
}

/**
 * Original recording time → time in the published (cut) video. A time inside
 * a cut maps to where that cut was.
 */
export function toOutputTime(t: number, cuts: readonly Cut[]): number {
  let removed = 0;
  for (const c of cuts) {
    if (t >= c.end_ms) removed += c.end_ms - c.start_ms;
    else if (t > c.start_ms) removed += t - c.start_ms;
  }
  return t - removed;
}

/** Length of the published video after cuts. */
export function keptDurationMs(cuts: readonly Cut[], durationMs: number) {
  return toOutputTime(durationMs, normalizeCuts(cuts, durationMs));
}
