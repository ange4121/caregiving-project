"use client";

import { useEffect, useRef } from "react";
import type { Point, PointerSample, SwipeDirection } from "@/lib/gesture";
import { HOLD_MIN_MS } from "@/lib/gesture";

// All overlays draw in stage-local CSS px, inside one full-stage <svg> or as
// absolutely positioned elements in the stage.

const ATTEMPT = "#f59e0b"; // amber: what she did
const GHOST = "#ffffff"; // white: what to do
const OK = "#22c55e";

const polylineLength = (pts: readonly Point[]) =>
  pts.reduce(
    (sum, p, i) =>
      i === 0 ? 0 : sum + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y),
    0,
  );

/** Draw a stroke in over `ms` by animating its dash offset (no pathLength: older Safari). */
function useDrawIn(
  ref: React.RefObject<SVGElement | null>,
  length: number,
  shownFraction: number,
  ms: number,
  delay = 0,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || length <= 0) return;
    el.style.strokeDasharray = `${length} ${length}`;
    const anim = el.animate(
      [
        { strokeDashoffset: length },
        { strokeDashoffset: length * (1 - shownFraction) },
      ],
      { duration: ms, delay, fill: "both", easing: "linear" },
    );
    return () => anim.cancel();
  }, [ref, length, shownFraction, ms, delay]);
}

/**
 * Touch replay: a dot where she touched down, the trail if she moved,
 * and a ring that fills for as long as she held (full ring = 600 ms).
 */
export function TouchReplay({
  samples,
  playMs,
}: {
  samples: readonly PointerSample[];
  playMs: number;
}) {
  const trailRef = useRef<SVGPolylineElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const start = samples[0];
  const duration = samples[samples.length - 1].t - start.t;
  const ringR = 34;
  const ringC = 2 * Math.PI * ringR;
  const trailLen = polylineLength(samples);

  useDrawIn(trailRef, trailLen, 1, playMs);
  useDrawIn(ringRef, ringC, Math.min(duration / HOLD_MIN_MS, 1), playMs);

  return (
    <g>
      <circle
        cx={start.x}
        cy={start.y}
        r={ringR}
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={8}
      />
      <circle
        ref={ringRef}
        cx={start.x}
        cy={start.y}
        r={ringR}
        fill="none"
        stroke={ATTEMPT}
        strokeWidth={6}
        strokeLinecap="round"
        transform={`rotate(-90 ${start.x} ${start.y})`}
      />
      {trailLen > 0 && (
        <polyline
          ref={trailRef}
          points={samples.map((s) => `${s.x},${s.y}`).join(" ")}
          fill="none"
          stroke={ATTEMPT}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <circle
        cx={start.x}
        cy={start.y}
        r={12}
        fill={ATTEMPT}
        stroke="white"
        strokeWidth={3}
      />
    </g>
  );
}

export type GhostGesture =
  | { gesture: "tap" }
  | { gesture: "hold" }
  | { gesture: "swipe"; direction: SwipeDirection; end: Point };

/**
 * Ghost finger: starts where she actually touched, glides to the target,
 * and performs the right gesture there.
 */
export function GhostFinger({
  from,
  to,
  action,
  delay,
  onDone,
}: {
  from: Point;
  to: Point;
  action: GhostGesture;
  delay: number;
  /** Called once the demonstration has finished. */
  onDone?: () => void;
}) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  const fingerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const trailRef = useRef<SVGLineElement>(null);

  const APPEAR = 250;
  const MOVE = 650;
  const ACT =
    action.gesture === "tap" ? 350 : action.gesture === "hold" ? 900 : 550;
  const FADE = 300;
  const total = APPEAR + MOVE + ACT + FADE;
  const end = action.gesture === "swipe" ? action.end : to;
  const ringR = 34;
  const ringC = 2 * Math.PI * ringR;
  const swipeLen = Math.hypot(end.x - to.x, end.y - to.y);

  useEffect(() => {
    const finger = fingerRef.current;
    if (!finger) return;
    const at = (p: Point, scale = 1) =>
      `translate(${p.x - 24}px, ${p.y - 24}px) scale(${scale})`;
    const o = (ms: number) => ms / total;
    const t1 = APPEAR;
    const t2 = APPEAR + MOVE;
    const t3 = t2 + ACT;

    const frames: Keyframe[] = [
      { offset: 0, opacity: 0, transform: at(from) },
      { offset: o(t1), opacity: 1, transform: at(from) },
      { offset: o(t2), opacity: 1, transform: at(to) },
    ];
    if (action.gesture === "tap") {
      frames.push(
        { offset: o(t2 + 120), opacity: 1, transform: at(to, 0.75) },
        { offset: o(t3), opacity: 1, transform: at(to) },
      );
    } else if (action.gesture === "hold") {
      frames.push(
        { offset: o(t2 + 120), opacity: 1, transform: at(to, 0.8) },
        { offset: o(t3), opacity: 1, transform: at(to, 0.8) },
      );
    } else {
      frames.push(
        { offset: o(t2 + 100), opacity: 1, transform: at(to, 0.85) },
        { offset: o(t3), opacity: 1, transform: at(end, 0.85) },
      );
    }
    frames.push({ offset: 1, opacity: 0, transform: at(end) });

    const anims: Animation[] = [
      finger.animate(frames, {
        duration: total,
        delay,
        fill: "both",
        easing: "ease-in-out",
      }),
    ];
    if (action.gesture === "hold" && ringRef.current) {
      ringRef.current.style.strokeDasharray = `${ringC} ${ringC}`;
      anims.push(
        ringRef.current.animate(
          [
            { strokeDashoffset: ringC, opacity: 1 },
            { strokeDashoffset: 0, opacity: 1 },
          ],
          { duration: HOLD_MIN_MS, delay: delay + t2 + 120, fill: "both" },
        ),
      );
    }
    if (action.gesture === "swipe" && trailRef.current) {
      trailRef.current.style.strokeDasharray = `${swipeLen} ${swipeLen}`;
      anims.push(
        trailRef.current.animate(
          [{ strokeDashoffset: swipeLen }, { strokeDashoffset: 0 }],
          { duration: ACT - 100, delay: delay + t2 + 100, fill: "both" },
        ),
      );
    }
    anims[0].finished.then(() => onDoneRef.current?.()).catch(() => {});
    return () => anims.forEach((a) => a.cancel());
  }, [from, to, end, action, delay, total, ACT, ringC, swipeLen]);

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {action.gesture === "hold" && (
          <circle
            ref={ringRef}
            cx={to.x}
            cy={to.y}
            r={ringR}
            fill="none"
            stroke={GHOST}
            strokeWidth={6}
            strokeLinecap="round"
            transform={`rotate(-90 ${to.x} ${to.y})`}
            style={{ opacity: 0 }}
          />
        )}
        {action.gesture === "swipe" && (
          <>
            <defs>
              <marker
                id="ghost-arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={GHOST} />
              </marker>
            </defs>
            <line
              ref={trailRef}
              x1={to.x}
              y1={to.y}
              x2={end.x}
              y2={end.y}
              stroke={GHOST}
              strokeWidth={8}
              strokeLinecap="round"
              markerEnd="url(#ghost-arrow)"
              style={{ strokeDashoffset: swipeLen }}
            />
          </>
        )}
      </svg>
      <div
        ref={fingerRef}
        className="pointer-events-none absolute left-0 top-0 h-12 w-12 rounded-full border-4 border-white bg-white/40 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
        style={{ opacity: 0 }}
      />
    </>
  );
}

/** Soft spotlight over the area to look at (hint level 1). */
export function RegionHint({ center, r }: { center: Point; r: number }) {
  return (
    <circle
      cx={center.x}
      cy={center.y}
      r={r}
      fill="rgba(255,255,255,0.18)"
      stroke="rgba(255,255,255,0.8)"
      strokeWidth={3}
      strokeDasharray="10 8"
      className="animate-[fade-in_400ms_ease-out_both]"
    />
  );
}

/** Pulsing ring on the exact target (hint level 2). */
export function TargetPulse({ center, r }: { center: Point; r: number }) {
  return (
    <circle
      cx={center.x}
      cy={center.y}
      r={r}
      fill="none"
      stroke="#facc15"
      strokeWidth={5}
      className="animate-[target-pulse_1.2s_ease-in-out_infinite] [transform-box:fill-box] [transform-origin:center]"
    />
  );
}

/** Green ring + check at the target after a correct attempt. */
export function CorrectMark({ center }: { center: Point }) {
  const { x, y } = center;
  return (
    <g className="animate-[pop-in_300ms_ease-out_both] [transform-box:fill-box] [transform-origin:center]">
      <circle cx={x} cy={y} r={34} fill={OK} stroke="white" strokeWidth={4} />
      <path
        d={`M${x - 14},${y} L${x - 4},${y + 10} L${x + 15},${y - 11}`}
        fill="none"
        stroke="white"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** Live ring around the finger while pressing on a hold step: full = held long enough. */
export function LiveHoldRing({ at }: { at: Point }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <circle
      cx={at.x}
      cy={at.y}
      r={r}
      fill="none"
      stroke={GHOST}
      strokeWidth={7}
      strokeLinecap="round"
      transform={`rotate(-90 ${at.x} ${at.y})`}
      style={{
        strokeDasharray: `${c} ${c}`,
        strokeDashoffset: c,
        animation: `ring-fill ${HOLD_MIN_MS}ms linear forwards`,
      }}
    />
  );
}
