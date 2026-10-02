import {
  classifyGesture,
  type Classification,
  type PointerSample,
  type SwipeDirection,
} from "./classify";
import { hitsTarget, type DisplayRect, type Target } from "./geometry";

export type ExpectedGesture =
  | { gesture: "tap" }
  | { gesture: "hold" }
  | { gesture: "swipe"; direction: SwipeDirection };

/**
 * Each code maps to one row of the error-feedback table in CLAUDE.md.
 * The player turns codes into learner copy via /locales.
 */
export type GestureError =
  | "tap_too_long" // 你按得太久了…
  | "tap_moved" // 手指动了一点…
  | "hold_too_short" // 再按久一点…
  | "hold_moved" // 按住的时候手指不要动
  | "swipe_no_move" // 你按住了，但手指没有移动…
  | "swipe_too_short" // 滑得再长一点…
  | "swipe_wrong_direction" // 方向反了…
  | "wrong_place"; // 位置不对…

export interface Evaluation {
  ok: boolean;
  /** Null when ok. */
  error: GestureError | null;
  classification: Classification;
}

/** Which gesture mistake, if any, ignoring position. */
function gestureError(
  expected: ExpectedGesture,
  c: Classification,
): GestureError | null {
  switch (expected.gesture) {
    case "tap":
      if (c.kind === "tap") return null;
      if (c.kind === "hold") return "tap_too_long";
      return "tap_moved";
    case "hold":
      if (c.kind === "hold") return null;
      if (c.kind === "tap") return "hold_too_short";
      return "hold_moved";
    case "swipe":
      if (c.kind === "tap" || c.kind === "hold") return "swipe_no_move";
      if (c.kind === "wobble") return "swipe_too_short";
      return c.direction === expected.direction
        ? null
        : "swipe_wrong_direction";
  }
}

/**
 * Judge one attempt against a step.
 *
 * Gesture mistakes are reported before position mistakes: the gesture errors
 * are the specific, teachable ones, and we name one thing at a time.
 * Position is judged where the finger first touched down (for swipes, where
 * the swipe started).
 */
export function evaluateAttempt(
  samples: readonly PointerSample[],
  expected: ExpectedGesture,
  target: Target,
  rect: DisplayRect,
  { systemGesture = false }: { systemGesture?: boolean } = {},
): Evaluation {
  const classification = classifyGesture(samples);
  const gError = gestureError(expected, classification);
  if (gError) return { ok: false, error: gError, classification };

  const fromBezel = systemGesture && expected.gesture === "swipe";
  if (!hitsTarget(classification.start, target, rect, { fromBezel })) {
    return { ok: false, error: "wrong_place", classification };
  }
  return { ok: true, error: null, classification };
}
