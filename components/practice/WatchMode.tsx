"use client";

import { useState } from "react";
import { toScreen } from "@/lib/gesture";
import type { Manifest } from "@/lib/lesson/types";
import {
  expectedOf,
  ghostAction,
  primaryButton,
  secondaryButton,
  Shell,
  StepHeader,
  targetOf,
  type LessonCtx,
} from "./lesson";
import { GhostFinger } from "./overlays";
import PracticeStage from "./PracticeStage";

type Phase =
  | "ghost" // the ghost finger shows the gesture on the still
  | "clip" // the step's clip plays: what happens next on the real phone
  | "after"; // waiting for the learner: watch again, or next

/**
 * Watch mode: for each step, the ghost finger demonstrates the gesture, then
 * the clip plays. Nothing advances on its own; the learner taps "next".
 */
export default function WatchMode({
  manifest,
  assetBase,
  ctx,
  onPractice,
}: {
  manifest: Manifest;
  assetBase: string;
  ctx: LessonCtx;
  onPractice: () => void;
}) {
  const { t } = ctx;
  const steps = manifest.steps;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ghost");
  const [run, setRun] = useState(0); // bump to replay the demonstration

  const step = steps[index];
  const expected = expectedOf(step);
  const target = targetOf(step);
  const clipSrc = step.clip ? `${assetBase}/${step.clip}` : null;
  const hasGhost = expected !== null && target !== null;
  const isLast = index === steps.length - 1;

  // A step with no gesture to show starts straight at its clip.
  const effectivePhase: Phase =
    phase === "ghost" && !hasGhost ? (clipSrc ? "clip" : "after") : phase;

  const afterGhost = () => setPhase(clipSrc ? "clip" : "after");
  const replay = () => {
    setRun((r) => r + 1);
    setPhase("ghost");
  };
  const next = () => {
    setIndex(index + 1);
    setRun((r) => r + 1);
    setPhase("ghost");
  };

  return (
    <Shell ctx={ctx}>
      <StepHeader
        ctx={ctx}
        step={step}
        index={index}
        total={steps.length}
        suffix={t.watching}
      />

      <PracticeStage
        key={`${index}-${run}`}
        stillSrc={`${assetBase}/${step.still}`}
        frame={manifest.video}
        disabled
        onPressStart={() => {}}
        onAttempt={() => {}}
        clipSrc={clipSrc}
        clipPlaying={effectivePhase === "clip"}
        clipHold={effectivePhase === "after"}
        onClipEnd={() => setPhase("after")}
        renderSvg={() => null}
        renderHtml={(rect) => {
          if (!hasGhost || effectivePhase !== "ghost") return null;
          const to = toScreen(target, rect);
          // The finger comes in from the bottom of the picture.
          const from = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height * 0.92,
          };
          return (
            <GhostFinger
              from={from}
              to={to}
              action={ghostAction(expected, to, rect)}
              delay={400}
              onDone={afterGhost}
            />
          );
        }}
      />

      <footer className="flex min-h-[132px] flex-col gap-3 px-5 pb-3 pt-3">
        {effectivePhase === "after" && (
          <>
            {isLast ? (
              <button onClick={onPractice} className={primaryButton}>
                {t.practice_now}
              </button>
            ) : (
              <button onClick={next} className={primaryButton}>
                {t.next}
              </button>
            )}
            <button onClick={replay} className={secondaryButton}>
              {t.watch_again}
            </button>
          </>
        )}
      </footer>
    </Shell>
  );
}
