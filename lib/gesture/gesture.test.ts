import { describe, expect, it } from "vitest";
import {
  classifyGesture,
  directionOf,
  evaluateAttempt,
  hitRadiusPx,
  hitsTarget,
  toNormalized,
  toScreen,
  type DisplayRect,
  type PointerSample,
  type Target,
} from "./index";

/** A press that stays at (x, y) for `ms`. */
const press = (ms: number, x = 100, y = 100): PointerSample[] => [
  { x, y, t: 0 },
  { x, y, t: ms },
];

/** A straight move by (dx, dy) over `ms`, sampled at the midpoint too. */
const move = (
  dx: number,
  dy: number,
  ms = 200,
  x = 100,
  y = 100,
): PointerSample[] => [
  { x, y, t: 0 },
  { x: x + dx / 2, y: y + dy / 2, t: ms / 2 },
  { x: x + dx, y: y + dy, t: ms },
];

describe("classifyGesture", () => {
  it("short still press is a tap", () => {
    const c = classifyGesture(press(120));
    expect(c.kind).toBe("tap");
    expect(c.ambiguousPress).toBe(false);
  });

  it("499 ms is a clean tap; 500–599 ms is a tap flagged as ambiguous", () => {
    expect(classifyGesture(press(499)).ambiguousPress).toBe(false);
    for (const ms of [500, 550, 599]) {
      const c = classifyGesture(press(ms));
      expect(c.kind).toBe("tap");
      expect(c.ambiguousPress).toBe(true);
    }
  });

  it("600 ms or more is a hold", () => {
    expect(classifyGesture(press(600)).kind).toBe("hold");
    expect(classifyGesture(press(2000)).kind).toBe("hold");
  });

  it("small drift under 15 px still counts as still", () => {
    expect(classifyGesture(move(10, 5, 100)).kind).toBe("tap");
    expect(classifyGesture(move(10, 5, 900)).kind).toBe("hold");
  });

  it("15–40 px of movement is a wobble", () => {
    expect(classifyGesture(move(15, 0)).kind).toBe("wobble");
    expect(classifyGesture(move(0, -39)).kind).toBe("wobble");
  });

  it("wandering away and coming back is a wobble, not a tap", () => {
    const samples = [
      { x: 100, y: 100, t: 0 },
      { x: 125, y: 100, t: 100 },
      { x: 101, y: 100, t: 200 },
    ];
    const c = classifyGesture(samples);
    expect(c.kind).toBe("wobble");
    expect(c.maxDistancePx).toBe(25);
    expect(c.netDistancePx).toBe(1);
  });

  it("40 px or more is a swipe, with direction", () => {
    expect(classifyGesture(move(40, 0)).direction).toBe("right");
    expect(classifyGesture(move(-80, 10)).direction).toBe("left");
    expect(classifyGesture(move(5, 120)).direction).toBe("down");
    expect(classifyGesture(move(-20, -60)).direction).toBe("up");
  });

  it("direction is only set for swipes", () => {
    expect(classifyGesture(move(20, 0)).direction).toBeNull();
    expect(classifyGesture(press(100)).direction).toBeNull();
  });

  it("a single sample is a zero-length tap", () => {
    expect(classifyGesture([{ x: 1, y: 1, t: 5 }]).kind).toBe("tap");
  });

  it("rejects an empty trace", () => {
    expect(() => classifyGesture([])).toThrow();
  });
});

describe("directionOf", () => {
  it("dominant axis wins; ties go horizontal", () => {
    expect(directionOf({ x: 0, y: 0 }, { x: 10, y: 10 })).toBe("right");
    expect(directionOf({ x: 0, y: 0 }, { x: -10, y: 10 })).toBe("left");
    expect(directionOf({ x: 0, y: 0 }, { x: 3, y: -10 })).toBe("up");
  });
});

// A still drawn 300 × 650 px, 20 px in from the left and 100 px from the top.
const rect: DisplayRect = { left: 20, top: 100, width: 300, height: 650 };

describe("geometry", () => {
  it("round-trips between normalized and screen coordinates", () => {
    const n = { x: 0.25, y: 0.5 };
    const s = toScreen(n, rect);
    expect(s).toEqual({ x: 95, y: 425 });
    expect(toNormalized(s, rect)).toEqual(n);
  });

  it("hit radius is never below 60 px", () => {
    expect(hitRadiusPx({ x: 0.5, y: 0.5, radius: 0.06 }, rect)).toBe(60); // 0.06 × 300 = 18
    expect(hitRadiusPx({ x: 0.5, y: 0.5, radius: 0.3 }, rect)).toBe(90);
  });

  it("hits within the radius, misses outside it", () => {
    const target: Target = { x: 0.5, y: 0.5, radius: 0.06 }; // center (170, 425)
    expect(hitsTarget({ x: 170, y: 425 }, target, rect)).toBe(true);
    expect(hitsTarget({ x: 230, y: 425 }, target, rect)).toBe(true); // exactly 60
    expect(hitsTarget({ x: 231, y: 425 }, target, rect)).toBe(false);
  });

  it("fromBezel pulls a touch on the bezel onto the still's edge", () => {
    // Control Center: top-right corner of the still, at (320, 100).
    const target: Target = { x: 1, y: 0, radius: 0.06 };
    const onBezel = { x: 330, y: 40 }; // above and right of the still
    expect(hitsTarget(onBezel, target, rect)).toBe(false);
    expect(hitsTarget(onBezel, target, rect, { fromBezel: true })).toBe(true);
  });
});

describe("evaluateAttempt", () => {
  const target: Target = { x: 0.5, y: 0.5, radius: 0.06 }; // center (170, 425)
  const at = { x: 170, y: 425 };
  const tapAt = (ms: number, p = at) => press(ms, p.x, p.y);

  it("accepts the right gesture in the right place", () => {
    expect(
      evaluateAttempt(tapAt(100), { gesture: "tap" }, target, rect).ok,
    ).toBe(true);
    expect(
      evaluateAttempt(tapAt(800), { gesture: "hold" }, target, rect).ok,
    ).toBe(true);
    expect(
      evaluateAttempt(
        move(0, -100, 200, at.x, at.y),
        { gesture: "swipe", direction: "up" },
        target,
        rect,
      ).ok,
    ).toBe(true);
  });

  it("accepts an ambiguous-band press as a tap, and exposes the flag for logging", () => {
    const r = evaluateAttempt(tapAt(550), { gesture: "tap" }, target, rect);
    expect(r.ok).toBe(true);
    expect(r.classification.ambiguousPress).toBe(true);
  });

  it.each([
    ["held too long", tapAt(700), { gesture: "tap" } as const, "tap_too_long"],
    [
      "finger moved",
      move(20, 0, 100, at.x, at.y),
      { gesture: "tap" } as const,
      "tap_moved",
    ],
    [
      "dragged instead",
      move(80, 0, 100, at.x, at.y),
      { gesture: "tap" } as const,
      "tap_moved",
    ],
    [
      "lifted early",
      tapAt(300),
      { gesture: "hold" } as const,
      "hold_too_short",
    ],
    [
      "moved while holding",
      move(25, 0, 900, at.x, at.y),
      { gesture: "hold" } as const,
      "hold_moved",
    ],
    [
      "held, no move",
      tapAt(900),
      { gesture: "swipe", direction: "up" } as const,
      "swipe_no_move",
    ],
    [
      "quick tap, no move",
      tapAt(100),
      { gesture: "swipe", direction: "up" } as const,
      "swipe_no_move",
    ],
    [
      "too short",
      move(0, -25, 200, at.x, at.y),
      { gesture: "swipe", direction: "up" } as const,
      "swipe_too_short",
    ],
    [
      "wrong way",
      move(0, 100, 200, at.x, at.y),
      { gesture: "swipe", direction: "up" } as const,
      "swipe_wrong_direction",
    ],
  ])("%s → %s", (_label, samples, expected, error) => {
    const r = evaluateAttempt(samples, expected, target, rect);
    expect(r.ok).toBe(false);
    expect(r.error).toBe(error);
  });

  it("right gesture, wrong place", () => {
    const r = evaluateAttempt(
      tapAt(100, { x: 40, y: 150 }),
      { gesture: "tap" },
      target,
      rect,
    );
    expect(r.error).toBe("wrong_place");
  });

  it("reports the gesture mistake before the position mistake", () => {
    const r = evaluateAttempt(
      tapAt(900, { x: 40, y: 150 }),
      { gesture: "tap" },
      target,
      rect,
    );
    expect(r.error).toBe("tap_too_long");
  });

  it("judges a swipe's position by where it started", () => {
    const fromTarget = move(0, -200, 200, at.x, at.y);
    const endsOnTarget = move(0, -100, 200, at.x, at.y + 100);
    const swipeUp = { gesture: "swipe", direction: "up" } as const;
    expect(evaluateAttempt(fromTarget, swipeUp, target, rect).ok).toBe(true);
    expect(evaluateAttempt(endsOnTarget, swipeUp, target, rect).error).toBe(
      "wrong_place",
    );
  });

  it("system-gesture swipes may start on the bezel", () => {
    const corner: Target = { x: 1, y: 0, radius: 0.06 }; // (320, 100)
    const swipeDown = { gesture: "swipe", direction: "down" } as const;
    const fromBezel = move(0, 150, 200, 330, 40);
    expect(evaluateAttempt(fromBezel, swipeDown, corner, rect).error).toBe(
      "wrong_place",
    );
    expect(
      evaluateAttempt(fromBezel, swipeDown, corner, rect, {
        systemGesture: true,
      }).ok,
    ).toBe(true);
  });
});
