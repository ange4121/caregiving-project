// Finding "moments" in a screen recording: the screen holds still, then
// changes. Each change is probably a gesture. Pure functions; the ffmpeg
// calls live in lib/publish/analyze.ts.

export interface Freeze {
  startMs: number;
  endMs: number;
}

export interface Moment {
  /** The last still frame before the change: where the author should mark. */
  t_ms: number;
  /** When the screen started changing. */
  change_ms: number;
  /** Where the change started (normalized 0–1), if it was local enough to guess. */
  guess: { x: number; y: number } | null;
}

/** Pull freeze periods out of ffmpeg `freezedetect` log output. */
export function parseFreezeLog(log: string): Freeze[] {
  const freezes: Freeze[] = [];
  let start: number | null = null;
  for (const m of log.matchAll(/freeze_(start|end): ([\d.]+)/g)) {
    const ms = Math.round(parseFloat(m[2]) * 1000);
    if (m[1] === "start") start = ms;
    else if (start !== null) {
      freezes.push({ startMs: start, endMs: ms });
      start = null;
    }
  }
  return freezes;
}

/** Merge freezes separated by a tiny gap (noise, not a real change). */
export function mergeFreezes(
  freezes: readonly Freeze[],
  gapMs = 150,
): Freeze[] {
  const out: Freeze[] = [];
  for (const f of freezes) {
    const last = out[out.length - 1];
    if (last && f.startMs - last.endMs <= gapMs) last.endMs = f.endMs;
    else out.push({ ...f });
  }
  return out;
}

/** Mark just before the change, but never before the still period began. */
const BEFORE_CHANGE_MS = 100;

/**
 * Each freeze that ends before the video does is a moment. A freeze that runs
 * to the end of the recording isn't followed by any change.
 */
export function freezesToMoments(
  freezes: readonly Freeze[],
  durationMs: number,
): Omit<Moment, "guess">[] {
  return mergeFreezes(freezes)
    .filter((f) => f.endMs < durationMs - 200)
    .map((f) => ({
      t_ms: Math.max(f.startMs, f.endMs - BEFORE_CHANGE_MS),
      change_ms: f.endMs,
    }));
}

/**
 * Guess where a touch landed by comparing a grayscale frame just before a
 * change with one just after. iOS highlights a button the instant it's
 * touched, so a small changed area points at the finger. If most of the
 * screen changed (a swipe, a new screen), there's no useful guess.
 */
export function guessFromDiff(
  before: Uint8Array,
  after: Uint8Array,
  width: number,
  height: number,
  {
    threshold = 24,
    ignoreTop = 0.07, // status bar clock and recording indicator
    maxArea = 0.35,
  } = {},
): { x: number; y: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let changed = 0;
  const top = Math.floor(height * ignoreTop);
  for (let y = top; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (Math.abs(before[i] - after[i]) > threshold) {
        changed++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (changed < 4) return null;
  const boxArea = ((maxX - minX + 1) * (maxY - minY + 1)) / (width * height);
  if (boxArea > maxArea) return null;
  return {
    x: (minX + maxX + 1) / 2 / width,
    y: (minY + maxY + 1) / 2 / height,
  };
}
