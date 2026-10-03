import { describe, expect, it } from "vitest";
import type { LessonStep } from "@/lib/lesson/types";
import {
  buildFilterGraph,
  clipRanges,
  outputSize,
  redactRanges,
  validateSteps,
} from "./plan";

const step = (t_ms: number, extra: Partial<LessonStep> = {}): LessonStep => ({
  index: 0,
  t_ms,
  gesture: "tap",
  x: 0.5,
  y: 0.5,
  swipe_direction: null,
  system_gesture: false,
  target_radius: 0.06,
  element_label: "X",
  note_en: "",
  blur: [],
  ...extra,
});

describe("outputSize", () => {
  it("scales to 720 wide with an even height", () => {
    expect(outputSize(1206, 2622)).toEqual({ w: 720, h: 1566 });
    expect(outputSize(1170, 2532)).toEqual({ w: 720, h: 1558 });
  });
  it("never upscales", () => {
    expect(outputSize(640, 1386)).toEqual({ w: 640, h: 1386 });
  });
});

describe("ranges", () => {
  const steps = [step(1000), step(3000), step(9000)];
  it("redaction runs from each step to the next, last to the end", () => {
    expect(redactRanges(steps, 20000)).toEqual([
      { startMs: 1000, endMs: 3000 },
      { startMs: 3000, endMs: 9000 },
      { startMs: 9000, endMs: 20000 },
    ]);
  });
  it("clips match, but the last clip is capped at 4 s", () => {
    expect(clipRanges(steps, 20000)[2]).toEqual({
      startMs: 9000,
      endMs: 13000,
    });
    expect(clipRanges(steps, 10000)[2]).toEqual({
      startMs: 9000,
      endMs: 10000,
    });
  });
});

describe("buildFilterGraph", () => {
  it("just normalizes when there's nothing to redact", () => {
    expect(buildFilterGraph([step(0)], 5000, { w: 720, h: 1566 })).toBe(
      "[0:v]fps=30,scale=720:1566,setsar=1,format=yuv420p[v0];[v0]null[vout]",
    );
  });

  it("pixelates each box only during its step", () => {
    const g = buildFilterGraph(
      [step(1000, { blur: [{ x: 0.1, y: 0.5, w: 0.5, h: 0.1 }] }), step(4000)],
      8000,
      { w: 720, h: 1566 },
    );
    expect(g).toContain("crop=360:157:72:783,pixelize=w=16:h=16");
    expect(g).toContain("overlay=72:783:enable='between(t,1.000,4.000)'[v1]");
    expect(g.endsWith("[v1]null[vout]")).toBe(true);
  });

  it("clamps boxes that run off the frame", () => {
    const g = buildFilterGraph(
      [step(0, { blur: [{ x: 0.9, y: 0.9, w: 0.5, h: 0.5 }] })],
      1000,
      { w: 100, h: 200 },
    );
    expect(g).toContain("crop=10:20:90:180");
  });
});

describe("validateSteps", () => {
  it("accepts a good lesson", () => {
    expect(validateSteps([step(0), step(500)], 1000)).toEqual([]);
  });
  it("names each problem", () => {
    expect(
      validateSteps(
        [step(800), step(500, { gesture: "swipe" }), step(2000, { x: null })],
        1000,
      ),
    ).toEqual([
      "Step 2: steps must be in time order.",
      "Step 2: swipe needs a direction.",
      "Step 3: time 2000 ms is outside the video.",
      "Step 3: needs a target position.",
    ]);
  });
});
