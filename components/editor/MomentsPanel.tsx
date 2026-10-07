"use client";

import type { Moment } from "@/lib/editor/moments";
import { cutAt, type Cut } from "@/lib/lesson/cuts";
import type { LessonStep } from "@/lib/lesson/types";
import { fmtTime } from "./VideoPanel";

/** A moment counts as done once a step sits within this distance of it. */
const NEAR_MS = 300;

export type MomentStatus = "pending" | "done" | "skipped";

export function momentStatus(
  m: Moment,
  i: number,
  steps: readonly LessonStep[],
  skipped: readonly number[],
  cuts: readonly Cut[] = [],
): MomentStatus {
  // A moment inside a cut section won't be in the lesson.
  if (cutAt(cuts, m.t_ms)) return "skipped";
  if (steps.some((s) => Math.abs(s.t_ms - m.t_ms) < NEAR_MS)) return "done";
  if (skipped.includes(i)) return "skipped";
  return "pending";
}

export type HelperState =
  "idle" | "uploading" | "analyzing" | "ready" | "unavailable" | "error";

interface Props {
  helper: HelperState;
  moments: Moment[];
  steps: LessonStep[];
  skipped: number[];
  cuts: Cut[];
  current: number | null;
  onGo: (i: number) => void;
  onSkip: (i: number) => void;
  onAccept: (i: number) => void;
}

export default function MomentsPanel({
  helper,
  moments,
  steps,
  skipped,
  cuts,
  current,
  onGo,
  onSkip,
  onAccept,
}: Props) {
  if (helper === "idle") return null;
  if (helper === "uploading" || helper === "analyzing") {
    return (
      <div className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-600">
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent align-middle" />
        {helper === "uploading"
          ? "Handing the recording to ffmpeg on this laptop…"
          : "Finding moments where the screen changes…"}
      </div>
    );
  }
  if (helper === "unavailable") {
    return (
      <div className="border-b border-neutral-200 px-4 py-3 text-xs text-neutral-500">
        Auto-find and Publish run on the author&apos;s computer for now (a
        developer setup with Node.js and ffmpeg). You can still mark steps by
        hand.
      </div>
    );
  }
  if (helper === "error") {
    return (
      <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
        Couldn&apos;t analyze this recording. Mark steps by hand.
      </div>
    );
  }

  const statuses = moments.map((m, i) =>
    momentStatus(m, i, steps, skipped, cuts),
  );
  const reviewed = statuses.filter((s) => s !== "pending").length;
  const cur = current !== null ? moments[current] : null;
  const curStatus = current !== null ? statuses[current] : null;

  return (
    <div className="border-b border-neutral-200 px-4 py-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Suggested moments</h2>
        <span className="text-xs text-neutral-500">
          {reviewed} of {moments.length} reviewed
        </span>
      </div>
      <p className="mt-0.5 text-xs text-neutral-500">
        The screen changed at each of these. Was it a step?
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {moments.map((m, i) => (
          <button
            key={m.t_ms}
            onClick={() => onGo(i)}
            title={statuses[i]}
            className={`h-7 rounded-full border px-2.5 font-mono text-xs ${
              i === current ? "ring-2 ring-blue-500 ring-offset-1" : ""
            } ${
              statuses[i] === "done"
                ? "border-green-600 bg-green-50 text-green-800"
                : statuses[i] === "skipped"
                  ? "border-neutral-200 text-neutral-400 line-through"
                  : "border-neutral-400 bg-white"
            }`}
          >
            {fmtTime(m.t_ms)}
          </button>
        ))}
      </div>

      {cur && current !== null && curStatus === "pending" && (
        <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm">
          <p>
            <b>Moment {current + 1}</b> at {fmtTime(cur.t_ms)}.{" "}
            {cur.guess
              ? "Looks like a tap on the dot. Press Enter to accept, or do the real gesture on the video."
              : "Do the gesture on the video (a swipe, maybe)."}
          </p>
          <div className="mt-2 flex gap-2">
            {cur.guess && (
              <button
                onClick={() => onAccept(current)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Tap here <kbd className="ml-1 opacity-70">↵</kbd>
              </button>
            )}
            <button
              onClick={() => onSkip(current)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
            >
              Not a step <kbd className="ml-1 opacity-60">S</kbd>
            </button>
          </div>
        </div>
      )}
      {reviewed === moments.length && moments.length > 0 && (
        <p className="mt-2 text-xs text-green-700">
          All reviewed. Name each step below.
        </p>
      )}
    </div>
  );
}
