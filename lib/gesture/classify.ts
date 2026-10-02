import {
  HOLD_MIN_MS,
  STILL_MAX_PX,
  SWIPE_MIN_PX,
  TAP_MAX_MS,
} from "./thresholds";

export interface Point {
  x: number;
  y: number;
}

/** One pointer sample: position in CSS px, time in ms. */
export interface PointerSample extends Point {
  t: number;
}

export type SwipeDirection = "up" | "down" | "left" | "right";

/**
 * - tap / hold: finger stayed put (< 15 px), split by press duration.
 * - swipe: finger ended ≥ 40 px from where it started.
 * - wobble: finger moved, but not far enough to be a swipe.
 */
export type GestureKind = "tap" | "hold" | "swipe" | "wobble";

export interface Classification {
  kind: GestureKind;
  start: Point;
  end: Point;
  durationMs: number;
  /** Farthest the finger got from where it started, at any moment. */
  maxDistancePx: number;
  /** Distance from start to lift-off. */
  netDistancePx: number;
  /** Set only for swipes. */
  direction: SwipeDirection | null;
  /** Press landed in the 500–600 ms band: accepted as a tap, but worth logging. */
  ambiguousPress: boolean;
}

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

/** Dominant axis wins. Screen y grows downward. */
export function directionOf(from: Point, to: Point): SwipeDirection {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "down" : "up";
}

/**
 * Classify one press, from pointerdown (first sample) to pointerup (last sample).
 * Pure function: no DOM, no timers.
 */
export function classifyGesture(
  samples: readonly PointerSample[],
): Classification {
  if (samples.length === 0)
    throw new Error("classifyGesture needs at least one sample");

  const first = samples[0];
  const last = samples[samples.length - 1];
  const start = { x: first.x, y: first.y };
  const end = { x: last.x, y: last.y };
  const durationMs = last.t - first.t;
  const netDistancePx = distance(start, end);
  const maxDistancePx = Math.max(...samples.map((s) => distance(start, s)));

  let kind: GestureKind;
  if (netDistancePx >= SWIPE_MIN_PX) kind = "swipe";
  else if (maxDistancePx >= STILL_MAX_PX) kind = "wobble";
  else kind = durationMs >= HOLD_MIN_MS ? "hold" : "tap";

  return {
    kind,
    start,
    end,
    durationMs,
    maxDistancePx,
    netDistancePx,
    direction: kind === "swipe" ? directionOf(start, end) : null,
    ambiguousPress: kind === "tap" && durationMs >= TAP_MAX_MS,
  };
}
