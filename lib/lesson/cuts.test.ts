import { describe, expect, it } from "vitest";
import { cutAt, keptDurationMs, normalizeCuts, toOutputTime } from "./cuts";

describe("normalizeCuts", () => {
  it("clamps, sorts, merges overlaps, and drops tiny cuts", () => {
    expect(
      normalizeCuts(
        [
          { start_ms: 8000, end_ms: 6000 }, // backwards
          { start_ms: 7000, end_ms: 9000 }, // overlaps the first
          { start_ms: -500, end_ms: 1000 }, // before the start
          { start_ms: 20000, end_ms: 99999 }, // past the end
          { start_ms: 3000, end_ms: 3050 }, // too short
        ],
        25000,
      ),
    ).toEqual([
      { start_ms: 0, end_ms: 1000 },
      { start_ms: 6000, end_ms: 9000 },
      { start_ms: 20000, end_ms: 25000 },
    ]);
  });
});

describe("cut time", () => {
  const cuts = [
    { start_ms: 0, end_ms: 2000 },
    { start_ms: 10000, end_ms: 14000 },
  ];

  it("finds the cut containing a time", () => {
    expect(cutAt(cuts, 500)).toEqual(cuts[0]);
    expect(cutAt(cuts, 2000)).toBeNull(); // end is exclusive
    expect(cutAt(cuts, 12000)).toEqual(cuts[1]);
  });

  it("maps recording time to published time", () => {
    expect(toOutputTime(2000, cuts)).toBe(0);
    expect(toOutputTime(5000, cuts)).toBe(3000);
    expect(toOutputTime(12000, cuts)).toBe(8000); // inside a cut → its start
    expect(toOutputTime(15000, cuts)).toBe(9000);
  });

  it("computes the published length", () => {
    expect(keptDurationMs(cuts, 20000)).toBe(14000);
    expect(keptDurationMs([], 20000)).toBe(20000);
  });
});
