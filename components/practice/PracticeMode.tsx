"use client";

import { useEffect, useRef, useState } from "react";
import {
  evaluateAttempt,
  hitRadiusPx,
  toScreen,
  type DisplayRect,
  type GestureError,
  type Point,
  type PointerSample,
} from "@/lib/gesture";
import type { Manifest } from "@/lib/lesson/types";
import {
  buildReportMessage,
  faceTimeLink,
  smsLink,
  type AttemptLog,
} from "@/lib/report";
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
import {
  CorrectMark,
  GhostFinger,
  LiveHoldRing,
  RegionHint,
  TargetPulse,
  TouchReplay,
  type GhostGesture,
} from "./overlays";
import PracticeStage from "./PracticeStage";

/** How long the green check shows before the clip plays. */
const CORRECT_PAUSE_MS = 700;
/** Misses before "watch it once" (hint level 3) appears. */
const WATCH_HINT_AFTER = 3;

interface Feedback {
  id: number;
  error: GestureError;
  samples: PointerSample[];
  replayMs: number;
  ghost: { from: Point; to: Point; action: GhostGesture; delay: number };
}

type Phase =
  | "practice" // waiting for her gesture
  | "correct" // green check
  | "clip" // the step's clip plays, then the next step
  | "demo" // "watch it once": the clip plays, then back to this step
  | "done";

export default function PracticeMode({
  manifest,
  assetBase,
  ctx,
}: {
  manifest: Manifest;
  assetBase: string;
  ctx: LessonCtx;
}) {
  const { t } = ctx;
  const steps = manifest.steps;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("practice");
  const [misses, setMisses] = useState(0);
  const [lastError, setLastError] = useState<GestureError | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const log = useRef<AttemptLog[]>([]);
  // Snapshot of the log when the lesson ends, for the report message.
  const [finalLog, setFinalLog] = useState<AttemptLog[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackId = useRef(0);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const step = steps[index];
  const expected = step ? expectedOf(step) : null;
  const target = step ? targetOf(step) : null;
  const clipSrc = step?.clip ? `${assetBase}/${step.clip}` : null;

  const goNext = () => {
    setFeedback(null);
    setMisses(0);
    setLastError(null);
    if (index + 1 < steps.length) {
      setIndex(index + 1);
      setPhase("practice");
    } else {
      setFinalLog([...log.current]);
      setPhase("done");
    }
  };

  /** After a correct step (or "I did it"): show what happens next, then move on. */
  const advance = () => (clipSrc ? setPhase("clip") : goNext());

  const restart = () => {
    log.current = [];
    setIndex(0);
    setMisses(0);
    setLastError(null);
    setFeedback(null);
    setPhase("practice");
  };

  const onAttempt = (samples: PointerSample[], rect: DisplayRect) => {
    if (!expected || !target) return;
    const result = evaluateAttempt(samples, expected, target, rect, {
      systemGesture: step.system_gesture,
    });
    const c = result.classification;
    log.current.push({
      step: index,
      ok: result.ok,
      error: result.error,
      durationMs: Math.round(c.durationMs),
      ambiguousPress: c.ambiguousPress,
    });

    if (result.ok) {
      setPhase("correct");
      timer.current = setTimeout(advance, CORRECT_PAUSE_MS);
      return;
    }

    const to = toScreen(target, rect);
    const replayMs = Math.min(Math.max(c.durationMs, 400), 1500);
    setMisses((m) => m + 1);
    setLastError(result.error);
    setFeedback({
      id: ++feedbackId.current,
      error: result.error!,
      samples,
      replayMs,
      ghost: {
        from: c.start,
        to,
        action: ghostAction(expected, to, rect),
        delay: replayMs + 300,
      },
    });
  };

  if (phase === "done") {
    const script = ctx.lang === "zh-Hant" ? "zh-Hant" : "zh-Hans";
    const report = buildReportMessage({
      script,
      titleZh:
        script === "zh-Hant" ? manifest.title_zh_hant : manifest.title_zh_hans,
      titleEn: manifest.title_en,
      log: finalLog,
    });
    return (
      <Shell ctx={ctx} showHelp={false}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="text-6xl">🎉</div>
          <h1 className="text-[28px] font-semibold">{t.done_title}</h1>
        </div>
        <footer className="flex flex-col gap-3 px-5 pb-4">
          {ctx.contact && (
            <>
              <a
                href={smsLink(ctx.contact, report)}
                className="flex min-h-16 items-center justify-center rounded-2xl bg-green-500 px-4 py-3 text-center text-[22px] font-semibold text-white active:bg-green-600"
              >
                {t.got_it.replace("{name}", ctx.name)}
              </a>
              <a href={faceTimeLink(ctx.contact)} className={primaryButton}>
                {t.need_help.replace("{name}", ctx.name)}
              </a>
              {ctx.inWeChat && (
                <p className="text-center text-lg text-neutral-400">
                  {t.wechat_hint}
                </p>
              )}
            </>
          )}
          <button onClick={restart} className={secondaryButton}>
            {t.practice_again}
          </button>
        </footer>
      </Shell>
    );
  }

  const playing = phase === "clip" || phase === "demo";
  const showRegion =
    phase === "practice" && (misses >= 2 || lastError === "wrong_place");
  const showPulse = phase === "practice" && misses >= 3;
  const offerWatch =
    phase === "practice" && clipSrc !== null && misses >= WATCH_HINT_AFTER;
  const footerText =
    phase === "correct"
      ? t.correct
      : feedback
        ? t.errors[feedback.error]
        : t.try_on_picture;

  return (
    <Shell ctx={ctx}>
      <StepHeader ctx={ctx} step={step} index={index} total={steps.length} />

      <PracticeStage
        key={index}
        stillSrc={`${assetBase}/${step.still}`}
        frame={manifest.video}
        disabled={phase !== "practice" || !expected}
        onPressStart={() => setFeedback(null)}
        onAttempt={onAttempt}
        clipSrc={clipSrc}
        clipPlaying={playing}
        onClipEnd={() => {
          if (phase === "clip") goNext();
          else setPhase("practice");
        }}
        renderPress={
          expected?.gesture === "hold"
            ? (at) => <LiveHoldRing at={at} />
            : undefined
        }
        renderSvg={(rect) => {
          if (!target || playing) return null;
          const center = toScreen(target, rect);
          const hitR = hitRadiusPx(target, rect);
          return (
            <>
              {showRegion && (
                <RegionHint center={center} r={Math.max(hitR * 2, 90)} />
              )}
              {showPulse && (
                <TargetPulse center={center} r={Math.min(hitR, 44)} />
              )}
              {feedback && (
                <TouchReplay
                  key={feedback.id}
                  samples={feedback.samples}
                  playMs={feedback.replayMs}
                />
              )}
              {phase === "correct" && <CorrectMark center={center} />}
            </>
          );
        }}
        renderHtml={() =>
          feedback &&
          !playing && (
            <GhostFinger
              key={feedback.id}
              from={feedback.ghost.from}
              to={feedback.ghost.to}
              action={feedback.ghost.action}
              delay={feedback.ghost.delay}
            />
          )
        }
      />

      <footer
        className="flex min-h-[132px] flex-col gap-3 px-5 pb-2 pt-3"
        aria-live="polite"
      >
        {expected ? (
          <>
            <p
              className={`text-[22px] leading-relaxed ${
                phase === "correct"
                  ? "font-semibold text-green-400"
                  : feedback
                    ? "text-amber-300"
                    : "text-neutral-400"
              }`}
            >
              {playing ? "" : footerText}
            </p>
            {offerWatch && (
              <button
                onClick={() => {
                  setFeedback(null);
                  setPhase("demo");
                }}
                className={secondaryButton}
              >
                {t.watch_once}
              </button>
            )}
          </>
        ) : (
          // "Do it yourself" step: nothing to check; the learner moves on.
          !playing && (
            <button onClick={advance} className={primaryButton}>
              {t.did_it}
            </button>
          )
        )}
      </footer>
    </Shell>
  );
}
