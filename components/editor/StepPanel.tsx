"use client";

import { useEffect, useRef } from "react";
import { captionsFor } from "@/lib/captions";
import type { SwipeDirection } from "@/lib/gesture";
import type { LessonStep } from "@/lib/lesson/types";
import { fmtTime } from "./VideoPanel";

const GESTURE_LABEL: Record<LessonStep["gesture"], string> = {
  tap: "Tap",
  hold: "Hold",
  swipe: "Swipe",
  self: "Do it yourself",
};
const ARROW: Record<SwipeDirection, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

interface Props {
  steps: LessonStep[];
  selected: number | null;
  onSelect: (index: number) => void;
  onChange: (index: number, patch: Partial<LessonStep>) => void;
  onDelete: (index: number) => void;
  /** Enter in the label field: move on (to the next suggested moment). */
  onLabelEnter?: () => void;
  onCopyBoxes: (index: number) => void;
  onPixelate: (index: number) => void;
}

export default function StepPanel({
  steps,
  selected,
  onSelect,
  onChange,
  onDelete,
  onLabelEnter,
  onCopyBoxes,
  onPixelate,
}: Props) {
  const step = selected !== null ? steps[selected] : null;
  const labelRef = useRef<HTMLInputElement>(null);
  const needsLabel =
    step !== null && step.gesture !== "self" && !step.element_label;

  // A freshly marked step needs a name: put the cursor there.
  useEffect(() => {
    if (needsLabel) labelRef.current?.focus();
  }, [selected, needsLabel]);

  return (
    <div className="flex flex-col">
      <ol>
        {steps.length === 0 && (
          <li className="p-4 text-sm text-neutral-500">
            No steps yet. Pause the video and do the first gesture on it.
          </li>
        )}
        {steps.map((s, i) => (
          <li key={`${s.t_ms}-${i}`}>
            <button
              onClick={() => onSelect(i)}
              className={`flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-2.5 text-left ${
                i === selected ? "bg-blue-50" : "hover:bg-neutral-50"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  i === selected ? "bg-blue-600" : "bg-neutral-500"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {s.element_label || s.note_en || (
                    <span className="text-amber-600">Name this step</span>
                  )}
                </span>
                <span className="block text-xs text-neutral-500">
                  {GESTURE_LABEL[s.gesture]}
                  {s.swipe_direction ? ` ${ARROW[s.swipe_direction]}` : ""}
                  {s.system_gesture ? " · from edge" : ""} · {fmtTime(s.t_ms)}
                  {s.blur.length > 0 && ` · ▦ ${s.blur.length}`}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {step && selected !== null && (
        <div className="space-y-3 border-t border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Step {selected + 1}{" "}
              <span className="font-normal text-neutral-500">
                at {fmtTime(step.t_ms)}
              </span>
            </h3>
            <button
              onClick={() => onDelete(selected)}
              className="text-sm text-red-600 hover:underline"
            >
              Delete step
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {(["tap", "hold", "swipe", "self"] as const).map((g) => (
              <button
                key={g}
                onClick={() => onChange(selected, { gesture: g })}
                className={`h-8 rounded-full border px-3 text-sm ${
                  step.gesture === g
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white"
                }`}
              >
                {GESTURE_LABEL[g]}
              </button>
            ))}
          </div>

          {step.gesture !== "self" && (step.x === null || step.y === null) && (
            <p className="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">
              <b>Where?</b> This step has no spot on the screen yet. Stay on
              this frame and do the gesture on the video.
            </p>
          )}

          {step.gesture === "swipe" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {(["up", "down", "left", "right"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => onChange(selected, { swipe_direction: d })}
                    aria-label={`Swipe ${d}`}
                    className={`h-8 w-8 rounded-lg border ${
                      step.swipe_direction === d
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {ARROW[d]}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={step.system_gesture}
                  onChange={(e) =>
                    onChange(selected, { system_gesture: e.target.checked })
                  }
                />
                Starts from the screen edge (e.g. Control Center)
              </label>
            </div>
          )}

          {step.gesture !== "self" && (
            <label className="block">
              <span className="text-sm font-medium">
                What&apos;s it called on screen?
              </span>
              <input
                ref={labelRef}
                value={step.element_label}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && step.element_label.trim()) {
                    e.currentTarget.blur();
                    onLabelEnter?.();
                  }
                }}
                onChange={(e) =>
                  onChange(selected, { element_label: e.target.value })
                }
                placeholder='Exactly as shown, e.g. "Sign in"'
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium">
              {step.gesture === "self"
                ? "What should they do themselves?"
                : "Note (optional)"}
            </span>
            <input
              value={step.note_en}
              onChange={(e) => onChange(selected, { note_en: e.target.value })}
              placeholder={
                step.gesture === "self" ? "e.g. type your password" : ""
              }
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-neutral-600">
              ▦ {step.blur.length} private{" "}
              {step.blur.length === 1 ? "area" : "areas"} pixelated
            </span>
            <button
              onClick={() => onPixelate(selected)}
              className="rounded-full border border-fuchsia-300 bg-white px-2.5 py-0.5 text-fuchsia-700"
            >
              Add / edit
            </button>
            {step.blur.length > 0 && selected + 1 < steps.length && (
              <button
                onClick={() => onCopyBoxes(selected)}
                className="rounded-full border border-neutral-300 bg-white px-2.5 py-0.5"
                title="For private info that stays on screen"
              >
                Copy to step {selected + 2}
              </button>
            )}
          </div>

          <CaptionPreview step={step} />

          {step.gesture !== "self" && (
            <p className="text-xs text-neutral-500">
              To redo the gesture, stay on this frame and do it again on the
              video.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CaptionPreview({ step }: { step: LessonStep }) {
  const c = captionsFor(step);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Your parent will see
      </p>
      <p className="mt-1 text-lg font-semibold" lang="zh-Hans">
        {c.caption_zh_hans}
      </p>
      <p className="text-neutral-600">{c.caption_en}</p>
    </div>
  );
}
