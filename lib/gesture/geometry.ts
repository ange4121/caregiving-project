import type { Point } from "./classify";
import { MIN_HIT_RADIUS_PX } from "./thresholds";

/** Where the still is drawn on the learner's screen, in CSS px. */
export interface DisplayRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Normalized (0–1, relative to the video frame) → screen CSS px. */
export function toScreen(p: Point, rect: DisplayRect): Point {
  return { x: rect.left + p.x * rect.width, y: rect.top + p.y * rect.height };
}

/** Screen CSS px → normalized (0–1). Values outside 0–1 mean "off the still". */
export function toNormalized(p: Point, rect: DisplayRect): Point {
  return {
    x: (p.x - rect.left) / rect.width,
    y: (p.y - rect.top) / rect.height,
  };
}

/** Pull a screen point onto the still's edge if it's outside (e.g., on the drawn bezel). */
export function clampToRect(p: Point, rect: DisplayRect): Point {
  return {
    x: Math.min(Math.max(p.x, rect.left), rect.left + rect.width),
    y: Math.min(Math.max(p.y, rect.top), rect.top + rect.height),
  };
}

export interface Target {
  /** Normalized 0–1. */
  x: number;
  y: number;
  /** Fraction of the frame width. */
  radius: number;
}

/** Hit radius in CSS px: the target's own size, but never below 60 px. */
export function hitRadiusPx(target: Target, rect: DisplayRect): number {
  return Math.max(MIN_HIT_RADIUS_PX, target.radius * rect.width);
}

/**
 * Did a touch at `touch` (screen px) land on the target?
 * `fromBezel`: for system-gesture steps, a touch on the drawn phone's bezel
 * counts as touching the still's nearest edge.
 */
export function hitsTarget(
  touch: Point,
  target: Target,
  rect: DisplayRect,
  { fromBezel = false }: { fromBezel?: boolean } = {},
): boolean {
  const p = fromBezel ? clampToRect(touch, rect) : touch;
  const center = toScreen(target, rect);
  return (
    Math.hypot(p.x - center.x, p.y - center.y) <= hitRadiusPx(target, rect)
  );
}
