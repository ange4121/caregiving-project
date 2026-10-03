import { describe, expect, it } from "vitest";
import { captionsFor, placeOf } from "./captions";

const base = {
  element_label: "Sign in",
  note_en: "",
  swipe_direction: null,
  system_gesture: false,
  x: 0.5,
  y: 0.5,
};

describe("captionsFor", () => {
  it("tap", () => {
    expect(captionsFor({ ...base, gesture: "tap" })).toEqual({
      caption_en: 'Tap "Sign in"',
      caption_zh_hans: '点一下 "Sign in"',
      caption_zh_hant: '點一下 "Sign in"',
    });
  });

  it("hold", () => {
    expect(
      captionsFor({ ...base, gesture: "hold", element_label: " Wi-Fi " }),
    ).toEqual({
      caption_en: 'Press and hold "Wi-Fi"',
      caption_zh_hans: '长按 "Wi-Fi"',
      caption_zh_hant: '長按 "Wi-Fi"',
    });
  });

  it("swipe on an element", () => {
    expect(
      captionsFor({
        ...base,
        gesture: "swipe",
        swipe_direction: "left",
        element_label: "Photos",
      }),
    ).toEqual({
      caption_en: 'Swipe left on "Photos"',
      caption_zh_hans: '在 "Photos" 上往左滑',
      caption_zh_hant: '在 "Photos" 上往左滑',
    });
  });

  it("swipe without a label", () => {
    expect(
      captionsFor({
        ...base,
        gesture: "swipe",
        swipe_direction: "up",
        element_label: "",
      }).caption_zh_hans,
    ).toBe("往上滑");
  });

  it("system swipe names the edge or corner it starts from", () => {
    expect(
      captionsFor({
        ...base,
        gesture: "swipe",
        swipe_direction: "down",
        system_gesture: true,
        x: 0.85,
        y: 0.02,
      }),
    ).toEqual({
      caption_en: "Swipe down from the top-right corner of the screen",
      caption_zh_hans: "从屏幕右上角往下滑",
      caption_zh_hant: "從螢幕右上角往下滑",
    });
  });

  it("do it yourself uses the note, falling back to the label", () => {
    expect(
      captionsFor({ ...base, gesture: "self", note_en: "type your password" })
        .caption_zh_hans,
    ).toBe("自己做这一步：type your password");
    expect(captionsFor({ ...base, gesture: "self" }).caption_en).toBe(
      "Do this yourself: Sign in",
    );
  });
});

describe("placeOf", () => {
  it("finds corners and edges", () => {
    expect(placeOf(0.1, 0.05)).toBe("top-left corner");
    expect(placeOf(0.5, 0.98)).toBe("bottom edge");
    expect(placeOf(0.02, 0.5)).toBe("left edge");
    expect(placeOf(0.97, 0.5)).toBe("right edge");
  });
});
