import type { Classification, DisplayRect } from "@/lib/gesture";
import { toNormalized } from "@/lib/gesture";
import type { Lesson, LessonStep, RedactBox } from "@/lib/lesson/types";

// Pure editing operations on a lesson draft. The editor UI calls these; they
// never mutate their input.

/** Default target size, as a fraction of frame width. The player never goes below 60 px anyway. */
export const DEFAULT_TARGET_RADIUS = 0.08;
/** Two marks closer than this are "the same moment": the second replaces the first. */
export const SAME_TIME_MS = 50;
/** A swipe starting this close to a frame edge is probably a system gesture. */
const EDGE_ZONE = 0.06;

export function emptyLesson(): Lesson {
  return {
    id: "",
    title_en: "",
    ios_version: "26",
    video: { width: 0, height: 0, duration_ms: 0 },
    steps: [],
  };
}

/** "Log in to Chase!" → "log-in-to-chase" */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const reindex = (steps: LessonStep[]) =>
  steps
    .slice()
    .sort((a, b) => a.t_ms - b.t_ms)
    .map((s, i) => ({ ...s, index: i }));

export type GestureFields = Pick<
  LessonStep,
  "gesture" | "x" | "y" | "swipe_direction" | "system_gesture"
>;

/**
 * Turn the author's click / hold / drag on the paused frame into step fields.
 * Returns null for a wobble (moved a little): ambiguous, so ask again.
 */
export function gestureFromClassification(
  c: Classification,
  rect: DisplayRect,
): GestureFields | null {
  if (c.kind === "wobble") return null;
  const p = toNormalized(c.start, rect);
  const x = Math.min(Math.max(p.x, 0), 1);
  const y = Math.min(Math.max(p.y, 0), 1);
  if (c.kind === "swipe") {
    const nearEdge =
      x < EDGE_ZONE || x > 1 - EDGE_ZONE || y < EDGE_ZONE || y > 1 - EDGE_ZONE;
    return {
      gesture: "swipe",
      x,
      y,
      swipe_direction: c.direction,
      system_gesture: nearEdge,
    };
  }
  return {
    gesture: c.kind,
    x,
    y,
    swipe_direction: null,
    system_gesture: false,
  };
}

/**
 * Mark a gesture at time `t_ms`. If a step already sits at that moment, its
 * gesture is redone (label, note, and boxes kept); otherwise a new step is added.
 * Returns the new lesson and the index of the affected step.
 */
export function markStep(
  lesson: Lesson,
  t_ms: number,
  fields: GestureFields,
): { lesson: Lesson; index: number } {
  const existing = lesson.steps.find(
    (s) => Math.abs(s.t_ms - t_ms) < SAME_TIME_MS,
  );
  let steps: LessonStep[];
  if (existing) {
    steps = lesson.steps.map((s) =>
      s === existing
        ? {
            ...s,
            ...fields,
            target_radius: s.target_radius ?? DEFAULT_TARGET_RADIUS,
          }
        : s,
    );
  } else {
    steps = [
      ...lesson.steps,
      {
        index: 0,
        t_ms,
        ...fields,
        target_radius: DEFAULT_TARGET_RADIUS,
        element_label: "",
        note_en: "",
        blur: [],
      },
    ];
  }
  const sorted = reindex(steps);
  const index = sorted.findIndex(
    (s) => Math.abs(s.t_ms - (existing?.t_ms ?? t_ms)) < 1,
  );
  return { lesson: { ...lesson, steps: sorted }, index };
}

/**
 * Add a "do it yourself" step at `t_ms` (no gesture is checked). If a step
 * already sits at this moment it's left alone and selected instead, so a
 * marked gesture is never overwritten by accident.
 */
export function addSelfStep(
  lesson: Lesson,
  t_ms: number,
): { lesson: Lesson; index: number; existed: boolean } {
  const existing = lesson.steps.findIndex(
    (s) => Math.abs(s.t_ms - t_ms) < SAME_TIME_MS,
  );
  if (existing !== -1) return { lesson, index: existing, existed: true };
  const r = markStep(lesson, t_ms, {
    gesture: "self",
    x: null,
    y: null,
    swipe_direction: null,
    system_gesture: false,
  });
  return { ...r, existed: false };
}

export function updateStep(
  lesson: Lesson,
  index: number,
  patch: Partial<LessonStep>,
): Lesson {
  const steps = lesson.steps.map((s, i) => {
    if (i !== index) return s;
    const next = { ...s, ...patch };
    // Keep the step internally consistent when the gesture type changes.
    if (next.gesture !== "swipe") {
      next.swipe_direction = null;
      next.system_gesture = false;
    } else if (!next.swipe_direction) {
      next.swipe_direction = "up";
    }
    // A "do it yourself" step keeps any position it had (the player ignores
    // it), so switching back to tap/hold/swipe doesn't lose the spot.
    if (next.gesture !== "self" && next.target_radius === null) {
      next.target_radius = DEFAULT_TARGET_RADIUS;
    }
    return next;
  });
  return { ...lesson, steps: reindex(steps) };
}

export function deleteStep(lesson: Lesson, index: number): Lesson {
  return {
    ...lesson,
    steps: reindex(lesson.steps.filter((_, i) => i !== index)),
  };
}

/** Smallest box worth keeping (fraction of the frame), so a stray click isn't a box. */
const MIN_BOX = 0.01;

/** Normalize a dragged rectangle (any corner order) to 0–1, or null if tiny. */
export function boxFromDrag(
  a: { x: number; y: number },
  b: { x: number; y: number },
): RedactBox | null {
  const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
  const x1 = clamp(Math.min(a.x, b.x));
  const y1 = clamp(Math.min(a.y, b.y));
  const x2 = clamp(Math.max(a.x, b.x));
  const y2 = clamp(Math.max(a.y, b.y));
  if (x2 - x1 < MIN_BOX || y2 - y1 < MIN_BOX) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export function addBox(lesson: Lesson, index: number, box: RedactBox): Lesson {
  return {
    ...lesson,
    steps: lesson.steps.map((s, i) =>
      i === index ? { ...s, blur: [...s.blur, box] } : s,
    ),
  };
}

export function removeBox(
  lesson: Lesson,
  index: number,
  boxIndex: number,
): Lesson {
  return {
    ...lesson,
    steps: lesson.steps.map((s, i) =>
      i === index ? { ...s, blur: s.blur.filter((_, k) => k !== boxIndex) } : s,
    ),
  };
}

/**
 * Copy a step's boxes onto the next step (skipping exact duplicates), for
 * private info that stays on screen across steps.
 */
export function copyBoxesToNext(lesson: Lesson, index: number): Lesson {
  const from = lesson.steps[index];
  const to = lesson.steps[index + 1];
  if (!from || !to) return lesson;
  const key = (b: RedactBox) => [b.x, b.y, b.w, b.h].join(",");
  const have = new Set(to.blur.map(key));
  const added = from.blur.filter((b) => !have.has(key(b)));
  return {
    ...lesson,
    steps: lesson.steps.map((s, i) =>
      i === index + 1 ? { ...s, blur: [...s.blur, ...added] } : s,
    ),
  };
}

/** The step whose time range (its time → next step's time) contains `t_ms`, if any. */
export function stepAtTime(lesson: Lesson, t_ms: number): number | null {
  let found: number | null = null;
  lesson.steps.forEach((s, i) => {
    if (s.t_ms <= t_ms + SAME_TIME_MS / 2) found = i;
  });
  return found;
}

/** What still needs doing before this draft can be published. */
export function draftProblems(lesson: Lesson): string[] {
  const problems: string[] = [];
  if (!lesson.title_en.trim()) problems.push("Give the lesson a title.");
  if (!lesson.id) problems.push("Lesson needs an id.");
  if (lesson.steps.length === 0) problems.push("Mark at least one step.");
  lesson.steps.forEach((s, i) => {
    const n = `Step ${i + 1}`;
    if (s.gesture !== "self" && (s.x === null || s.y === null))
      problems.push(
        `${n}: show where. Go to this step and do the gesture on the video.`,
      );
    if (s.gesture !== "self" && !s.element_label.trim())
      problems.push(`${n}: name the thing on screen (e.g. "Sign in").`);
    if (s.gesture === "self" && !s.note_en.trim() && !s.element_label.trim())
      problems.push(`${n}: say what to do (e.g. "type your password").`);
  });
  return problems;
}
