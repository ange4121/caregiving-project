"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DisplayRect, Point, PointerSample } from "@/lib/gesture";

// The phone frame keeps the learner's finger away from the real screen edges,
// where Safari's swipe-back and the iOS home gesture live.
const BEZEL = 10;
const MARGIN_X = 28;
const MARGIN_Y = 12;

interface Props {
  stillSrc: string;
  /** Video frame size, for the aspect ratio. */
  frame: { width: number; height: number };
  /** Ignore touches (e.g., while showing "correct"). */
  disabled: boolean;
  onPressStart: () => void;
  onAttempt: (samples: PointerSample[], rect: DisplayRect) => void;
  /** Rendered over the still, in stage-local px. Receives the still's rect. */
  renderSvg: (rect: DisplayRect) => React.ReactNode;
  renderHtml?: (rect: DisplayRect) => React.ReactNode;
  /** Shown under the finger while pressing (e.g., the hold ring). */
  renderPress?: (at: Point) => React.ReactNode;
}

/** Fit the still inside the stage, leaving room for margins and the bezel. */
function fitStill(w: number, h: number, frame: Props["frame"]): DisplayRect {
  const availW = Math.max(w - 2 * (MARGIN_X + BEZEL), 1);
  const availH = Math.max(h - 2 * (MARGIN_Y + BEZEL), 1);
  const scale = Math.min(availW / frame.width, availH / frame.height);
  const width = frame.width * scale;
  const height = frame.height * scale;
  return { left: (w - width) / 2, top: (h - height) / 2, width, height };
}

export default function PracticeStage({
  stillSrc,
  frame,
  disabled,
  onPressStart,
  onAttempt,
  renderSvg,
  renderHtml,
  renderPress,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const samplesRef = useRef<PointerSample[]>([]);
  const pointerIdRef = useRef<number | null>(null);
  const [pressAt, setPressAt] = useState<Point | null>(null);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // iOS: block the long-press callout, text magnifier, and page bounce on the
  // stage. Pointer events still fire; only the default touch behavior is cancelled.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("touchstart", block, { passive: false });
    el.addEventListener("touchmove", block, { passive: false });
    el.addEventListener("contextmenu", block);
    return () => {
      el.removeEventListener("touchstart", block);
      el.removeEventListener("touchmove", block);
      el.removeEventListener("contextmenu", block);
    };
  }, []);

  const rect = size ? fitStill(size.w, size.h, frame) : null;

  const local = (e: {
    clientX: number;
    clientY: number;
    timeStamp: number;
  }) => {
    const box = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top, t: e.timeStamp };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || !rect || pointerIdRef.current !== null) return;
    e.preventDefault();
    try {
      // Keep receiving moves even if the finger slides off the stage.
      stageRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone (or synthetic); samples still arrive via bubbling.
    }
    pointerIdRef.current = e.pointerId;
    const p = local(e);
    samplesRef.current = [p];
    setPressAt({ x: p.x, y: p.y });
    onPressStart();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events) samplesRef.current.push(local(ev));
  };

  const finish = (e: React.PointerEvent, cancelled: boolean) => {
    if (e.pointerId !== pointerIdRef.current) return;
    pointerIdRef.current = null;
    setPressAt(null);
    if (cancelled || !rect) return;
    samplesRef.current.push(local(e));
    onAttempt(samplesRef.current, rect);
  };

  return (
    <div
      ref={stageRef}
      className="practice-surface relative min-h-0 flex-1 overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
    >
      {rect && (
        <>
          <div
            className="absolute rounded-[2.2rem] bg-neutral-900 shadow-[0_0_0_2px_#525252,0_8px_30px_rgba(0,0,0,0.5)]"
            style={{
              left: rect.left - BEZEL,
              top: rect.top - BEZEL,
              width: rect.width + 2 * BEZEL,
              height: rect.height + 2 * BEZEL,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img: static still, no optimizer needed */}
          <img
            src={stillSrc}
            alt=""
            draggable={false}
            className="absolute rounded-[1.7rem]"
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            }}
          />
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {renderSvg(rect)}
            {pressAt && renderPress?.(pressAt)}
          </svg>
          {renderHtml?.(rect)}
        </>
      )}
    </div>
  );
}
