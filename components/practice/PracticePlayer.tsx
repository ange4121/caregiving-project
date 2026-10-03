"use client";

import { useEffect, useRef, useState } from "react";
import {
  evaluateAttempt,
  hitRadiusPx,
  toScreen,
  type DisplayRect,
  type ExpectedGesture,
  type GestureError,
  type Point,
  type PointerSample,
  type Target,
} from "@/lib/gesture";
import type { Manifest, ManifestStep } from "@/lib/lesson/types";
import {
  captionFor,
  DEFAULT_LANG,
  isLang,
  LANGS,
  stringsFor,
  type Lang,
} from "@/lib/i18n";
import {
  buildReportMessage,
  faceTimeLink,
  smsLink,
  type AttemptLog,
} from "@/lib/report";
import { parseShareFragment } from "@/lib/share";
import PracticeStage from "./PracticeStage";
import {
  CorrectMark,
  GhostFinger,
  LiveHoldRing,
  RegionHint,
  TargetPulse,
  TouchReplay,
  type GhostGesture,
} from "./overlays";

const CORRECT_PAUSE_MS = 1100;

interface Feedback {
  id: number;
  error: GestureError;
  samples: PointerSample[];
  replayMs: number;
  ghost: { from: Point; to: Point; action: GhostGesture; delay: number };
}

function expectedOf(step: ManifestStep): ExpectedGesture | null {
  if (step.gesture === "tap" || step.gesture === "hold") {
    return { gesture: step.gesture };
  }
  if (step.gesture === "swipe" && step.swipe_direction) {
    return { gesture: "swipe", direction: step.swipe_direction };
  }
  return null;
}

function targetOf(step: ManifestStep): Target | null {
  if (step.x === null || step.y === null) return null;
  return { x: step.x, y: step.y, radius: step.target_radius ?? 0 };
}

/** Where the ghost's swipe ends: a fixed share of the still, in the swipe direction. */
function swipeEnd(from: Point, dir: string, rect: DisplayRect): Point {
  const dy = rect.height * 0.22;
  const dx = rect.width * 0.35;
  if (dir === "down") return { x: from.x, y: from.y + dy };
  if (dir === "up") return { x: from.x, y: from.y - dy };
  if (dir === "left") return { x: from.x - dx, y: from.y };
  return { x: from.x + dx, y: from.y };
}

export default function PracticePlayer({
  manifest,
  assetBase,
}: {
  manifest: Manifest;
  assetBase: string;
}) {
  const steps = manifest.steps;
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const t = stringsFor(lang);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"practice" | "correct" | "done">(
    "practice",
  );
  const [misses, setMisses] = useState(0);
  const [lastError, setLastError] = useState<GestureError | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const log = useRef<AttemptLog[]>([]);
  // Snapshot of the log when the lesson ends, for the report message.
  const [finalLog, setFinalLog] = useState<AttemptLog[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackId = useRef(0);
  // From the child's share link; null when the link was opened without one.
  const [contact, setContact] = useState<string | null>(null);
  const [childName, setChildName] = useState<string | null>(null);
  const [inWeChat, setInWeChat] = useState(false);

  useEffect(() => {
    // ?lang= (for testing) beats #lang= (from the child's share link).
    const fromQuery = new URLSearchParams(window.location.search).get("lang");
    const share = parseShareFragment(window.location.hash);
    const fromUrl = isLang(fromQuery) ? fromQuery : share.lang;
    // URL and browser are only known on the client.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isLang(fromUrl)) setLang(fromUrl);
    setContact(share.contact);
    setChildName(share.childName);
    setInWeChat(/MicroMessenger/i.test(navigator.userAgent));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const name = childName ?? t.child_fallback;
  const helpHref = contact ? faceTimeLink(contact) : null;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const step = steps[index];
  const expected = step ? expectedOf(step) : null;
  const target = step ? targetOf(step) : null;

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
      timer.current = setTimeout(goNext, CORRECT_PAUSE_MS);
      return;
    }

    const to = toScreen(target, rect);
    const action: GhostGesture =
      expected.gesture === "swipe"
        ? {
            gesture: "swipe",
            direction: expected.direction,
            end: swipeEnd(to, expected.direction, rect),
          }
        : { gesture: expected.gesture };
    const replayMs = Math.min(Math.max(c.durationMs, 400), 1500);
    setMisses((m) => m + 1);
    setLastError(result.error);
    setFeedback({
      id: ++feedbackId.current,
      error: result.error!,
      samples,
      replayMs,
      ghost: { from: c.start, to, action, delay: replayMs + 300 },
    });
  };

  if (phase === "done") {
    const script = lang === "zh-Hant" ? "zh-Hant" : "zh-Hans";
    const report = buildReportMessage({
      script,
      titleZh:
        script === "zh-Hant" ? manifest.title_zh_hant : manifest.title_zh_hans,
      titleEn: manifest.title_en,
      log: finalLog,
    });
    return (
      <Shell lang={lang} onLang={setLang}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="text-6xl">🎉</div>
          <h1 className="text-[28px] font-semibold">{t.done_title}</h1>
        </div>
        <footer className="flex flex-col gap-3 px-5 pb-4">
          {contact && (
            <>
              <a
                href={smsLink(contact, report)}
                className="flex min-h-16 items-center justify-center rounded-2xl bg-green-500 px-4 py-3 text-center text-[22px] font-semibold text-white active:bg-green-600"
              >
                {t.got_it.replace("{name}", name)}
              </a>
              <a
                href={faceTimeLink(contact)}
                className="flex min-h-16 items-center justify-center rounded-2xl bg-white px-4 py-3 text-center text-[22px] font-semibold text-neutral-900 active:bg-neutral-200"
              >
                {t.need_help.replace("{name}", name)}
              </a>
              {inWeChat && (
                <p className="text-center text-lg text-neutral-400">
                  {t.wechat_hint}
                </p>
              )}
            </>
          )}
          <button
            onClick={restart}
            className="h-16 w-full rounded-2xl border border-neutral-600 text-[22px] text-neutral-200 active:bg-neutral-800"
          >
            {t.practice_again}
          </button>
        </footer>
      </Shell>
    );
  }

  const showRegion = misses >= 2 || lastError === "wrong_place";
  const showPulse = misses >= 3;
  const footerText =
    phase === "correct"
      ? t.correct
      : feedback
        ? t.errors[feedback.error]
        : t.try_on_picture;

  return (
    <Shell
      lang={lang}
      onLang={setLang}
      help={helpHref ? { href: helpHref, label: t.help_short } : null}
    >
      <header className="px-5 pt-2">
        <p className="text-xl text-neutral-400">
          {t.progress
            .replace("{n}", String(index + 1))
            .replace("{total}", String(steps.length))}
        </p>
        <h1 className="mt-1 text-[26px] font-semibold leading-snug">
          {captionFor(step, lang)}
        </h1>
        {lang !== "en" && (
          // English under the Chinese: names the thing as it appears on screen,
          // and teaches words like "swipe" that Apple's own help uses.
          <p lang="en" className="mt-1 text-lg leading-snug text-neutral-400">
            {step.caption_en}
          </p>
        )}
      </header>

      <PracticeStage
        key={index}
        stillSrc={`${assetBase}/${step.still}`}
        frame={manifest.video}
        disabled={phase !== "practice" || !expected}
        onPressStart={() => setFeedback(null)}
        onAttempt={onAttempt}
        renderPress={
          expected?.gesture === "hold"
            ? (at) => <LiveHoldRing at={at} />
            : undefined
        }
        renderSvg={(rect) => {
          if (!target) return null;
          const center = toScreen(target, rect);
          const hitR = hitRadiusPx(target, rect);
          return (
            <>
              {showRegion && phase === "practice" && (
                <RegionHint center={center} r={Math.max(hitR * 2, 90)} />
              )}
              {showPulse && phase === "practice" && (
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
          feedback && (
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
        className="flex min-h-[132px] items-start px-5 pb-2 pt-3"
        aria-live="polite"
      >
        {expected ? (
          <p
            className={`text-[22px] leading-relaxed ${
              phase === "correct"
                ? "font-semibold text-green-400"
                : feedback
                  ? "text-amber-300"
                  : "text-neutral-400"
            }`}
          >
            {footerText}
          </p>
        ) : (
          // "Do it yourself" step: nothing to check; the learner moves on.
          <button
            onClick={goNext}
            className="h-16 w-full rounded-2xl bg-white text-[22px] font-semibold text-neutral-900 active:bg-neutral-200"
          >
            {t.did_it}
          </button>
        )}
      </footer>
    </Shell>
  );
}

/** Full-height learner layout that respects the notch and home indicator. */
function Shell({
  lang,
  onLang,
  help = null,
  children,
}: {
  lang: Lang;
  onLang: (lang: Lang) => void;
  /** FaceTime-the-child button, shown during the lesson when the link has a contact. */
  help?: { href: string; label: string } | null;
  children: React.ReactNode;
}) {
  return (
    <div
      lang={lang}
      className="flex h-dvh flex-col bg-neutral-950 text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex items-center gap-1 px-4 pt-1">
        {help && (
          <a
            href={help.href}
            className="flex h-11 items-center rounded-full border border-neutral-600 px-4 text-lg text-neutral-200 active:bg-neutral-800"
          >
            {help.label}
          </a>
        )}
        <div className="flex-1" />
        {LANGS.map((l) => (
          <button
            key={l.lang}
            onClick={() => onLang(l.lang)}
            aria-pressed={lang === l.lang}
            className={`h-11 min-w-11 rounded-full px-3 text-lg ${
              lang === l.lang
                ? "bg-white font-semibold text-neutral-900"
                : "text-neutral-400"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
