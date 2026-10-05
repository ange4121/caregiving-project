import { describe, expect, it } from "vitest";
import {
  freezesToMoments,
  guessFromDiff,
  mergeFreezes,
  parseFreezeLog,
} from "./moments";

describe("parseFreezeLog", () => {
  it("pairs starts and ends", () => {
    const log = `
[freezedetect @ 0x1] lavfi.freezedetect.freeze_start: 0.466667
[freezedetect @ 0x1] lavfi.freezedetect.freeze_duration: 2.6
[freezedetect @ 0x1] lavfi.freezedetect.freeze_end: 3.066667
[freezedetect @ 0x1] lavfi.freezedetect.freeze_start: 4.333333
[freezedetect @ 0x1] lavfi.freezedetect.freeze_end: 5.133333
[freezedetect @ 0x1] lavfi.freezedetect.freeze_start: 18.466667`;
    expect(parseFreezeLog(log)).toEqual([
      { startMs: 467, endMs: 3067 },
      { startMs: 4333, endMs: 5133 },
    ]);
  });
});

describe("mergeFreezes", () => {
  it("joins freezes split by a tiny gap", () => {
    expect(
      mergeFreezes([
        { startMs: 5600, endMs: 7733 },
        { startMs: 7733, endMs: 10667 },
        { startMs: 11133, endMs: 12400 },
      ]),
    ).toEqual([
      { startMs: 5600, endMs: 10667 },
      { startMs: 11133, endMs: 12400 },
    ]);
  });
});

describe("freezesToMoments", () => {
  it("marks just before each change, skipping a freeze that runs to the end", () => {
    expect(
      freezesToMoments(
        [
          { startMs: 467, endMs: 3067 },
          { startMs: 5000, endMs: 5050 },
          { startMs: 18467, endMs: 22200 },
        ],
        22220,
      ),
    ).toEqual([
      { t_ms: 2967, change_ms: 3067 },
      { t_ms: 5000, change_ms: 5050 },
    ]);
  });
});

describe("guessFromDiff", () => {
  const W = 40;
  const H = 80;
  const frame = () => new Uint8Array(W * H).fill(100);

  it("finds a small highlighted area", () => {
    const a = frame();
    const b = frame();
    for (let y = 40; y < 48; y++)
      for (let x = 8; x < 16; x++) b[y * W + x] = 40; // button darkens
    expect(guessFromDiff(a, b, W, H)).toEqual({ x: 12 / W, y: 44 / H });
  });

  it("ignores the status bar", () => {
    const a = frame();
    const b = frame();
    b[2 * W + 5] = 0; // clock tick
    expect(guessFromDiff(a, b, W, H)).toBeNull();
  });

  it("gives up when most of the screen changed", () => {
    const a = frame();
    const b = new Uint8Array(W * H).fill(10);
    expect(guessFromDiff(a, b, W, H)).toBeNull();
  });
});
