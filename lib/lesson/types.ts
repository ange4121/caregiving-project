import type { SwipeDirection } from "@/lib/gesture";

/** A redaction box, normalized 0–1. The key is `blur`, but publishing pixelates. */
export interface RedactBox {
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * Optional time window (original recording ms). Without it, the box applies
   * from its step until the next step. Use it to cover something that's only
   * on screen briefly, without pixelating the rest of the step.
   */
  from_ms?: number;
  to_ms?: number;
}

/** One step as exported by the editor (`lesson.json`). Coordinates are normalized 0–1. */
export interface LessonStep {
  index: number;
  t_ms: number;
  /** `self` = "do it yourself" step: no gesture is checked. */
  gesture: "tap" | "hold" | "swipe" | "self";
  x: number | null;
  y: number | null;
  swipe_direction: SwipeDirection | null;
  system_gesture: boolean;
  /** Fraction of the frame width. */
  target_radius: number | null;
  element_label: string;
  note_en: string;
  blur: RedactBox[];
}

import type { Cut } from "./cuts";

export interface Lesson {
  id: string;
  title_en: string;
  /** Optional Chinese titles, used in the share and report messages. */
  title_zh_hans?: string;
  title_zh_hant?: string;
  ios_version: string;
  /** The iPhone it was recorded on, e.g. "iPhone 16 Pro". Shown with the iOS version. */
  iphone_model?: string;
  video: { width: number; height: number; duration_ms: number };
  steps: LessonStep[];
  /** Parts of the recording left out when publishing (original recording time). */
  cuts?: Cut[];
}

/** What the publish script writes; the player reads only this. */
export interface ManifestStep extends LessonStep {
  /** Path relative to the lesson folder. */
  still: string;
  /** Path relative to the lesson folder; null until clips exist. */
  clip: string | null;
  caption_en: string;
  caption_zh_hans: string;
  caption_zh_hant: string;
}

export interface Manifest extends Omit<Lesson, "steps"> {
  steps: ManifestStep[];
}
