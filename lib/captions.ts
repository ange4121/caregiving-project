import type { SwipeDirection } from "@/lib/gesture";
import type { LessonStep } from "@/lib/lesson/types";

// Caption templates: fixed wording + the on-screen English label verbatim.
// Starting copy; the Chinese needs a native reader's review.

export interface Captions {
  caption_en: string;
  caption_zh_hans: string;
  caption_zh_hant: string;
}

const DIR: Record<SwipeDirection, { en: string; zh: string }> = {
  up: { en: "up", zh: "上" },
  down: { en: "down", zh: "下" },
  left: { en: "left", zh: "左" },
  right: { en: "right", zh: "右" },
};

type Place =
  | "top-left corner"
  | "top-right corner"
  | "bottom-left corner"
  | "bottom-right corner"
  | "top edge"
  | "bottom edge"
  | "left edge"
  | "right edge";

const PLACE_ZH: Record<Place, { hans: string; hant: string }> = {
  "top-left corner": { hans: "左上角", hant: "左上角" },
  "top-right corner": { hans: "右上角", hant: "右上角" },
  "bottom-left corner": { hans: "左下角", hant: "左下角" },
  "bottom-right corner": { hans: "右下角", hant: "右下角" },
  "top edge": { hans: "顶部", hant: "頂部" },
  "bottom edge": { hans: "底部", hant: "底部" },
  "left edge": { hans: "左边", hant: "左邊" },
  "right edge": { hans: "右边", hant: "右邊" },
};

/** Which screen edge or corner a system gesture starts from (normalized x, y). */
export function placeOf(x: number, y: number): Place {
  const top = y < 0.15;
  const bottom = y > 0.85;
  const left = x < 0.33;
  const right = x > 0.67;
  if (top && left) return "top-left corner";
  if (top && right) return "top-right corner";
  if (bottom && left) return "bottom-left corner";
  if (bottom && right) return "bottom-right corner";
  if (top) return "top edge";
  if (bottom) return "bottom edge";
  return x < 0.5 ? "left edge" : "right edge";
}

const quote = (label: string) => `"${label.trim()}"`;

export function captionsFor(
  step: Pick<
    LessonStep,
    | "gesture"
    | "element_label"
    | "note_en"
    | "swipe_direction"
    | "system_gesture"
    | "x"
    | "y"
  >,
): Captions {
  const label = step.element_label.trim();

  switch (step.gesture) {
    case "tap":
      return {
        caption_en: `Tap ${quote(label)}`,
        caption_zh_hans: `点一下 ${quote(label)}`,
        caption_zh_hant: `點一下 ${quote(label)}`,
      };
    case "hold":
      return {
        caption_en: `Press and hold ${quote(label)}`,
        caption_zh_hans: `长按 ${quote(label)}`,
        caption_zh_hant: `長按 ${quote(label)}`,
      };
    case "swipe": {
      const d = DIR[step.swipe_direction ?? "up"];
      if (step.system_gesture && step.x !== null && step.y !== null) {
        const place = placeOf(step.x, step.y);
        const zh = PLACE_ZH[place];
        return {
          caption_en: `Swipe ${d.en} from the ${place} of the screen`,
          caption_zh_hans: `从屏幕${zh.hans}往${d.zh}滑`,
          caption_zh_hant: `從螢幕${zh.hant}往${d.zh}滑`,
        };
      }
      if (!label) {
        return {
          caption_en: `Swipe ${d.en}`,
          caption_zh_hans: `往${d.zh}滑`,
          caption_zh_hant: `往${d.zh}滑`,
        };
      }
      return {
        caption_en: `Swipe ${d.en} on ${quote(label)}`,
        caption_zh_hans: `在 ${quote(label)} 上往${d.zh}滑`,
        caption_zh_hant: `在 ${quote(label)} 上往${d.zh}滑`,
      };
    }
    case "self": {
      // The note is English until translation exists (nice-to-have).
      const what = step.note_en.trim() || label;
      return {
        caption_en: `Do this yourself: ${what}`,
        caption_zh_hans: `自己做这一步：${what}`,
        caption_zh_hant: `自己做這一步：${what}`,
      };
    }
  }
}
