"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  classifyGesture,
  toScreen,
  type DisplayRect,
  type Point,
  type PointerSample,
} from "@/lib/gesture";
import {
  boxFromDrag,
  gestureFromClassification,
  SAME_TIME_MS,
  stepAtTime,
  type GestureFields,
} from "@/lib/editor/draft";
import { cutAt } from "@/lib/lesson/cuts";
import { SETUP_URL } from "@/lib/site";
import type { Lesson, RedactBox } from "@/lib/lesson/types";
import { LiveHoldRing } from "@/components/practice/overlays";

const FRAME_S = 1 / 30;

export const fmtTime = (ms: number) => {
  const s = ms / 1000;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

function fitRect(cw: number, ch: number, vw: number, vh: number): DisplayRect {
  const pad = 16;
  const scale = Math.min((cw - 2 * pad) / vw, (ch - 2 * pad) / vh);
  const width = vw * scale;
  const height = vh * scale;
  return { left: (cw - width) / 2, top: (ch - height) / 2, width, height };
}

interface Props {
  src: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  lesson: Lesson;
  selected: number | null;
  timeMs: number;
  onTime: (ms: number) => void;
  onLoaded: (meta: {
    width: number;
    height: number;
    durationMs: number;
  }) => void;
  onMark: (fields: GestureFields, tMs: number) => void;
  onSelect: (index: number) => void;
  /** Suggested touch point (normalized) for the current moment, if any. */
  guess?: Point | null;
  /** "steps": do gestures on the video. "pixelate": drag boxes over private info. */
  mode: "steps" | "pixelate";
  onMode: (mode: "steps" | "pixelate") => void;
  onBox: (stepIndex: number, box: RedactBox) => void;
  onRemoveBox: (stepIndex: number, boxIndex: number) => void;
  /** False on the live site: auto-find and Publish need the author's developer setup. */
  localHelper?: boolean | null;
  /** Leave `start`–`end` out of the published lesson (ms, any order). */
  onAddCut: (start: number, end: number) => void;
  onRemoveCut: (index: number) => void;
}

export default function VideoPanel({
  src,
  videoRef,
  lesson,
  selected,
  timeMs,
  onTime,
  onLoaded,
  onMark,
  onSelect,
  guess = null,
  mode,
  onMode,
  onBox,
  onRemoveBox,
  localHelper = null,
  onAddCut,
  onRemoveCut,
}: Props) {
  const cuts = useMemo(() => lesson.cuts ?? [], [lesson.cuts]);
  // "Cut from here…" was pressed at this time; waiting for "…to here".
  const [cutStart, setCutStart] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [press, setPress] = useState<{ start: Point; now: Point } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const samples = useRef<PointerSample[]>([]);
  const pointerId = useRef<number | null>(null);

  const { width: vw, height: vh, duration_ms } = lesson.video;
  const rect = size && vw ? fitRect(size.w, size.h, vw, vh) : null;
  // Boxes belong to the step whose range (this step → next step) we're in.
  const activeStep = stepAtTime(lesson, timeMs);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard: space = play/pause, ←/→ = one frame, shift+←/→ = one second.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      const tag = (e.target as HTMLElement).tagName;
      if (!v || ["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === " ") {
        e.preventDefault();
        if (v.paused) void v.play();
        else v.pause();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        v.pause();
        const d = (e.shiftKey ? 1 : FRAME_S) * (e.key === "ArrowLeft" ? -1 : 1);
        v.currentTime = Math.min(Math.max(v.currentTime + d, 0), v.duration);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videoRef]);

  // While playing, jump over cut sections (or stop at a trimmed end).
  useEffect(() => {
    const v = videoRef.current;
    if (!playing || !v || cuts.length === 0) return;
    let raf = 0;
    const tick = () => {
      // Look a frame or two ahead so the jump happens before the cut shows.
      const c = cutAt(cuts, v.currentTime * 1000 + 60);
      if (c) {
        if (c.end_ms >= duration_ms - 50) v.pause();
        else v.currentTime = c.end_ms / 1000;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, cuts, duration_ms, videoRef]);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), 3000);
    return () => clearTimeout(t);
  }, [hint]);

  const local = (e: {
    clientX: number;
    clientY: number;
    timeStamp: number;
  }) => {
    const box = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top, t: e.timeStamp };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const v = videoRef.current;
    if (!v || !rect || pointerId.current !== null) return;
    if (!v.paused) {
      v.pause();
      return; // First click on a playing video just pauses it.
    }
    if (mode === "pixelate" && activeStep === null) {
      setHint("Mark a step first. Boxes apply from a step until the next one.");
      return;
    }
    e.preventDefault();
    try {
      stageRef.current?.setPointerCapture(e.pointerId);
    } catch {}
    pointerId.current = e.pointerId;
    const p = local(e);
    samples.current = [p];
    setPress({ start: p, now: p });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    const p = local(e);
    samples.current.push(p);
    setPress((s) => (s ? { ...s, now: p } : s));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    pointerId.current = null;
    setPress(null);
    if (!rect || !videoRef.current) return;
    samples.current.push(local(e));
    if (mode === "pixelate") {
      const a = samples.current[0];
      const b = samples.current[samples.current.length - 1];
      const norm = (p: Point) => ({
        x: (p.x - rect.left) / rect.width,
        y: (p.y - rect.top) / rect.height,
      });
      const box = boxFromDrag(norm(a), norm(b));
      if (box && activeStep !== null) onBox(activeStep, box);
      else setHint("Drag to draw a box over the private part.");
      return;
    }
    const fields = gestureFromClassification(
      classifyGesture(samples.current),
      rect,
    );
    if (!fields) {
      setHint("Moved a little. Click, hold still, or drag farther.");
      return;
    }
    onMark(fields, Math.round(videoRef.current.currentTime * 1000));
  };

  // Steps marked at (about) this exact frame get drawn on the video.
  const here = lesson.steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => Math.abs(s.t_ms - timeMs) < SAME_TIME_MS);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 touch-none select-none overflow-hidden bg-neutral-100"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerId.current = null;
          setPress(null);
        }}
      >
        {!src && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="max-w-md text-center text-neutral-600">
              <p className="text-lg font-semibold text-neutral-900">
                Load an iPhone screen recording to start.
              </p>
              <p className="mt-2 text-sm">
                Use Chrome or Safari. The video stays in your browser; nothing
                is uploaded.
              </p>
              {localHelper === false && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
                  <p className="font-semibold">What works on the live site</p>
                  <ul className="mt-1 list-disc pl-5">
                    <li>Marking steps by doing them on the video</li>
                    <li>Naming steps and seeing the parent&apos;s wording</li>
                    <li>Drawing pixelation boxes, downloading lesson.json</li>
                  </ul>
                  <p className="mt-2 font-semibold">
                    What runs on the author&apos;s computer for now
                  </p>
                  <p className="mt-0.5">
                    A developer setup with Node.js and ffmpeg;{" "}
                    <a
                      href={SETUP_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      see the README
                    </a>
                    .
                  </p>
                  <ul className="mt-1 list-disc pl-5">
                    <li>Finding the steps automatically</li>
                    <li>Publish (pixelating and cutting the clips)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        {src && (
          <video
            ref={videoRef}
            src={src}
            playsInline
            muted
            preload="auto"
            className="absolute"
            style={
              rect
                ? {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }
                : { opacity: 0 }
            }
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              onLoaded({
                width: v.videoWidth,
                height: v.videoHeight,
                durationMs: Math.round(v.duration * 1000),
              });
            }}
            onTimeUpdate={(e) =>
              onTime(Math.round(e.currentTarget.currentTime * 1000))
            }
            onSeeked={(e) =>
              onTime(Math.round(e.currentTarget.currentTime * 1000))
            }
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}
        {rect &&
          activeStep !== null &&
          lesson.steps[activeStep].blur.map((b, k) => (
            <div
              key={k}
              className={`absolute border-2 border-dashed ${
                mode === "pixelate" ? "border-fuchsia-600" : "border-white/70"
              }`}
              style={{
                left: rect.left + b.x * rect.width,
                top: rect.top + b.y * rect.height,
                width: b.w * rect.width,
                height: b.h * rect.height,
                // A blur preview; publishing pixelates.
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              {mode === "pixelate" && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onRemoveBox(activeStep, k)}
                  aria-label="Remove box"
                  className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-fuchsia-600 text-sm font-bold leading-6 text-white"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        {rect && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {here.map(({ s, i }) => {
              if (s.x === null || s.y === null) return null;
              const c = toScreen({ x: s.x, y: s.y }, rect);
              const r = Math.max((s.target_radius ?? 0) * rect.width, 12);
              const color = i === selected ? "#2563eb" : "#64748b";
              const dir = s.swipe_direction;
              const len = rect.height * 0.15;
              const end =
                dir === "up"
                  ? { x: c.x, y: c.y - len }
                  : dir === "down"
                    ? { x: c.x, y: c.y + len }
                    : dir === "left"
                      ? { x: c.x - len, y: c.y }
                      : { x: c.x + len, y: c.y };
              return (
                <g key={i}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={r}
                    fill={`${color}33`}
                    stroke={color}
                    strokeWidth={3}
                    strokeDasharray={s.gesture === "hold" ? "6 4" : undefined}
                  />
                  <circle cx={c.x} cy={c.y} r={5} fill={color} />
                  {s.gesture === "swipe" && (
                    <line
                      x1={c.x}
                      y1={c.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={color}
                      strokeWidth={5}
                      strokeLinecap="round"
                    />
                  )}
                  <text
                    x={c.x + r + 6}
                    y={c.y + 6}
                    fill={color}
                    fontSize={18}
                    fontWeight={700}
                    stroke="white"
                    strokeWidth={4}
                    paintOrder="stroke"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
            {guess &&
              (() => {
                const g = toScreen(guess, rect);
                return (
                  <g>
                    <circle
                      cx={g.x}
                      cy={g.y}
                      r={22}
                      fill="rgba(37,99,235,0.25)"
                      stroke="#2563eb"
                      strokeWidth={3}
                      className="animate-[target-pulse_1.2s_ease-in-out_infinite] [transform-box:fill-box] [transform-origin:center]"
                    />
                    <circle cx={g.x} cy={g.y} r={5} fill="#2563eb" />
                    <text
                      x={g.x + 28}
                      y={g.y + 5}
                      fill="#1d4ed8"
                      fontSize={14}
                      fontWeight={700}
                      stroke="white"
                      strokeWidth={4}
                      paintOrder="stroke"
                    >
                      Enter = tap here
                    </text>
                  </g>
                );
              })()}
            {press && mode === "pixelate" && (
              <rect
                x={Math.min(press.start.x, press.now.x)}
                y={Math.min(press.start.y, press.now.y)}
                width={Math.abs(press.now.x - press.start.x)}
                height={Math.abs(press.now.y - press.start.y)}
                fill="rgba(192,38,211,0.2)"
                stroke="#c026d3"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            )}
            {press && mode === "steps" && (
              <>
                <line
                  x1={press.start.x}
                  y1={press.start.y}
                  x2={press.now.x}
                  y2={press.now.y}
                  stroke="#f59e0b"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                <circle
                  cx={press.start.x}
                  cy={press.start.y}
                  r={8}
                  fill="#f59e0b"
                />
                <g style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,.6))" }}>
                  <LiveHoldRing at={press.start} />
                </g>
              </>
            )}
          </svg>
        )}
        {src && cutAt(cuts, timeMs) && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
            ✂ This part is cut from the lesson
          </div>
        )}
        {hint && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white">
            {hint}
          </div>
        )}
      </div>

      {src && (
        <div className="border-t border-neutral-200 bg-white px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-neutral-500">✂ Cut:</span>
            <button
              onClick={() => onAddCut(0, timeMs)}
              disabled={timeMs <= 0}
              className="rounded-lg border border-neutral-300 px-2.5 py-1 hover:bg-neutral-50 disabled:opacity-40"
              title="Leave out everything before this moment"
            >
              Trim start to here
            </button>
            <button
              onClick={() => onAddCut(timeMs, duration_ms)}
              disabled={timeMs >= duration_ms}
              className="rounded-lg border border-neutral-300 px-2.5 py-1 hover:bg-neutral-50 disabled:opacity-40"
              title="Leave out everything after this moment"
            >
              Trim end from here
            </button>
            {cutStart === null ? (
              <button
                onClick={() => setCutStart(timeMs)}
                className="rounded-lg border border-neutral-300 px-2.5 py-1 hover:bg-neutral-50"
                title="Mark where a section to remove starts, then where it ends"
              >
                Cut a section: start here
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onAddCut(cutStart, timeMs);
                    setCutStart(null);
                  }}
                  disabled={Math.abs(timeMs - cutStart) < 100}
                  className="rounded-lg bg-red-600 px-2.5 py-1 font-semibold text-white disabled:opacity-40"
                >
                  …end cut here (from {fmtTime(cutStart)})
                </button>
                <button
                  onClick={() => setCutStart(null)}
                  className="text-neutral-500 underline"
                >
                  Cancel
                </button>
              </>
            )}
            {cuts.map((c, i) => (
              <span
                key={`${c.start_ms}-${c.end_ms}`}
                className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-mono text-xs text-red-800"
              >
                {fmtTime(c.start_ms)}–{fmtTime(c.end_ms)}
                <button
                  onClick={() => onRemoveCut(i)}
                  aria-label="Remove cut"
                  className="font-sans font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mb-2 flex items-center gap-2 text-sm">
            <div className="flex shrink-0 overflow-hidden whitespace-nowrap rounded-lg border border-neutral-300">
              <button
                onClick={() => onMode("steps")}
                className={`px-3 py-1 ${mode === "steps" ? "bg-neutral-900 text-white" : "bg-white"}`}
              >
                ✋ Mark steps
              </button>
              <button
                onClick={() => onMode("pixelate")}
                className={`px-3 py-1 ${mode === "pixelate" ? "bg-fuchsia-600 text-white" : "bg-white"}`}
              >
                ▦ Pixelate
              </button>
            </div>
            <span className="text-xs text-neutral-500">
              {mode === "pixelate"
                ? activeStep === null
                  ? "Mark a step first."
                  : `Drag over anything private. Applies from step ${activeStep + 1} until the next step.`
                : null}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                if (v.paused) void v.play();
                else v.pause();
              }}
              className="h-9 w-20 rounded-lg bg-neutral-900 text-sm font-semibold text-white"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <span className="w-16 font-mono text-sm tabular-nums text-neutral-700">
              {fmtTime(timeMs)}
            </span>
            <div className="relative flex-1">
              <input
                type="range"
                min={0}
                max={duration_ms || 1}
                step={1}
                value={timeMs}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (v) v.currentTime = Number(e.target.value) / 1000;
                }}
                className="w-full"
                aria-label="Scrub"
              />
              {duration_ms > 0 &&
                cuts.map((c) => (
                  <div
                    key={`cut-${c.start_ms}`}
                    className="pointer-events-none absolute top-1/2 h-3 -translate-y-1/2 rounded-sm bg-[repeating-linear-gradient(45deg,#dc2626_0_4px,#fecaca_4px_8px)] opacity-80"
                    style={{
                      left: `${(c.start_ms / duration_ms) * 100}%`,
                      width: `${((c.end_ms - c.start_ms) / duration_ms) * 100}%`,
                    }}
                  />
                ))}
              {duration_ms > 0 && cutStart !== null && (
                <div
                  className="pointer-events-none absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-red-600"
                  style={{ left: `${(cutStart / duration_ms) * 100}%` }}
                />
              )}
              {duration_ms > 0 &&
                lesson.steps.map((s, i) => (
                  <button
                    key={i}
                    title={`Step ${i + 1}`}
                    onClick={() => onSelect(i)}
                    className={`absolute -top-3 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white text-[9px] font-bold leading-3 text-white ${
                      i === selected ? "bg-blue-600" : "bg-neutral-500"
                    }`}
                    style={{ left: `${(s.t_ms / duration_ms) * 100}%` }}
                  >
                    {i + 1}
                  </button>
                ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Pause on the frame <em>before</em> the action, then do it on the
            video: <b>click</b> = tap, <b>press and hold</b> = hold, <b>drag</b>{" "}
            = swipe. Space = play/pause, ←/→ = one frame, shift+←/→ = one
            second.
          </p>
        </div>
      )}
    </div>
  );
}
