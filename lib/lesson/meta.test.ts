import { describe, expect, it } from "vitest";
import type { Manifest } from "./types";
import { lessonMetadata } from "./meta";

const manifest = (extra: Partial<Manifest> = {}): Manifest => ({
  id: "wifi",
  title_en: "Get onto Wi-Fi",
  ios_version: "26",
  video: { width: 1, height: 2, duration_ms: 1000 },
  steps: [
    {
      index: 0,
      t_ms: 0,
      gesture: "tap",
      x: 0.5,
      y: 0.5,
      swipe_direction: null,
      system_gesture: false,
      target_radius: 0.08,
      element_label: "Wi-Fi",
      note_en: "",
      blur: [],
      still: "step-0.jpg",
      clip: "clip-0.mp4",
      caption_en: 'Tap "Wi-Fi"',
      caption_zh_hans: '点一下 "Wi-Fi"',
      caption_zh_hant: '點一下 "Wi-Fi"',
    },
  ],
  ...extra,
});

describe("lessonMetadata", () => {
  it("uses the Chinese title when there is one", () => {
    const m = lessonMetadata(manifest({ title_zh_hans: "连上 Wi-Fi" }));
    expect(m.title).toBe("小练习 · 连上 Wi-Fi");
    expect(m.openGraph.title).toBe(m.title);
  });

  it("falls back to the English title", () => {
    expect(lessonMetadata(manifest()).title).toBe("小练习 · Get onto Wi-Fi");
  });

  it("previews the lesson's first screen", () => {
    expect(lessonMetadata(manifest()).openGraph.images[0].url).toBe(
      "/lessons/wifi/step-0.jpg",
    );
  });
});
