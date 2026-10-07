import { describe, expect, it } from "vitest";
import type { Manifest } from "@/lib/lesson/types";
import { lessonCards, recordedOn, typicalMistake } from "./home";

const m = (id: string, title_en: string, extra: Partial<Manifest> = {}) =>
  ({
    id,
    title_en,
    ios_version: "26",
    video: { width: 1, height: 2, duration_ms: 1 },
    steps: [
      { still: "step-0.jpg", gesture: "tap" },
      { still: "step-1.jpg", gesture: "hold" },
    ],
    ...extra,
  }) as unknown as Manifest;

describe("lessonCards", () => {
  it("puts the featured lesson first, then sorts by title", () => {
    const cards = lessonCards(
      [m("b", "Bigger text"), m("z", "Chinese keyboard"), m("w", "Wi-Fi")],
      "w",
    );
    expect(cards.map((c) => c.id)).toEqual(["w", "b", "z"]);
  });

  it("links Practice to the demo and Share to the share page", () => {
    const [c] = lessonCards(
      [m("wifi", "Wi-Fi", { title_zh_hans: "连上 Wi-Fi" })],
      "x",
    );
    expect(c).toEqual({
      id: "wifi",
      titleEn: "Wi-Fi",
      titleZh: "连上 Wi-Fi",
      steps: 2,
      iosVersion: "26",
      recordedOn: "iOS 26",
      thumb: "/lessons/wifi/step-0.jpg",
      gestures: ["tap", "hold"],
      practiceHref: "/l/wifi?demo=1",
      shareHref: "/share/wifi",
    });
  });
});

describe("recordedOn", () => {
  it("names the iPhone model when known", () => {
    expect(
      recordedOn({ iphone_model: "iPhone 16 Pro", ios_version: "26" }),
    ).toBe("iPhone 16 Pro · iOS 26");
    expect(recordedOn({ ios_version: "26" })).toBe("iOS 26");
    expect(recordedOn({ iphone_model: " ", ios_version: "18.6" })).toBe(
      "iOS 18.6",
    );
  });
});

describe("typicalMistake", () => {
  it("fits the gesture", () => {
    expect(typicalMistake("tap")).toBe("tap_too_long");
    expect(typicalMistake("hold")).toBe("hold_too_short");
    expect(typicalMistake("swipe")).toBe("swipe_too_short");
    expect(typicalMistake("self")).toBeNull();
    expect(typicalMistake(undefined)).toBeNull();
  });
});
