"use client";

import { useEffect, useState } from "react";
import type {
  DisplayRect,
  ExpectedGesture,
  Point,
  Target,
} from "@/lib/gesture";
import {
  captionFor,
  DEFAULT_LANG,
  isLang,
  LANGS,
  stringsFor,
  type Lang,
  type Strings,
} from "@/lib/i18n";
import type { ManifestStep } from "@/lib/lesson/types";
import { faceTimeLink } from "@/lib/report";
import { parseShareFragment } from "@/lib/share";
import type { GhostGesture } from "./overlays";

// Shared pieces for the learner's lesson screens (start, watch, practice).

export interface LessonCtx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Strings;
  /** Child's phone / Apple ID from the share link, if any. */
  contact: string | null;
  /** What the parent calls the child ("小雨"), or a generic fallback. */
  name: string;
  inWeChat: boolean;
}

/** Language, contact, and browser come from the URL and user agent (client only). */
export function useLessonCtx(): LessonCtx {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [contact, setContact] = useState<string | null>(null);
  const [childName, setChildName] = useState<string | null>(null);
  const [inWeChat, setInWeChat] = useState(false);

  useEffect(() => {
    // ?lang= (for testing) beats #lang= (from the child's share link).
    const fromQuery = new URLSearchParams(window.location.search).get("lang");
    const share = parseShareFragment(window.location.hash);
    const fromUrl = isLang(fromQuery) ? fromQuery : share.lang;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isLang(fromUrl)) setLang(fromUrl);
    setContact(share.contact);
    setChildName(share.childName);
    setInWeChat(/MicroMessenger/i.test(navigator.userAgent));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const t = stringsFor(lang);
  return {
    lang,
    setLang,
    t,
    contact,
    name: childName ?? t.child_fallback,
    inWeChat,
  };
}

export function expectedOf(step: ManifestStep): ExpectedGesture | null {
  if (step.gesture === "tap" || step.gesture === "hold") {
    return { gesture: step.gesture };
  }
  if (step.gesture === "swipe" && step.swipe_direction) {
    return { gesture: "swipe", direction: step.swipe_direction };
  }
  return null;
}

export function targetOf(step: ManifestStep): Target | null {
  if (step.x === null || step.y === null) return null;
  return { x: step.x, y: step.y, radius: step.target_radius ?? 0 };
}

/** Where a demonstrated swipe ends: a fixed share of the still, in the swipe direction. */
export function swipeEnd(from: Point, dir: string, rect: DisplayRect): Point {
  const dy = rect.height * 0.22;
  const dx = rect.width * 0.35;
  if (dir === "down") return { x: from.x, y: from.y + dy };
  if (dir === "up") return { x: from.x, y: from.y - dy };
  if (dir === "left") return { x: from.x - dx, y: from.y };
  return { x: from.x + dx, y: from.y };
}

/** The ghost finger's action for a step, ending at `to` (screen px). */
export function ghostAction(
  expected: ExpectedGesture,
  to: Point,
  rect: DisplayRect,
): GhostGesture {
  return expected.gesture === "swipe"
    ? {
        gesture: "swipe",
        direction: expected.direction,
        end: swipeEnd(to, expected.direction, rect),
      }
    : { gesture: expected.gesture };
}

/** Full-height learner layout that respects the notch and home indicator. */
export function Shell({
  ctx,
  showHelp = true,
  children,
}: {
  ctx: LessonCtx;
  /** FaceTime-the-child button (only when the link carries a contact). */
  showHelp?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      lang={ctx.lang}
      className="flex h-dvh flex-col bg-neutral-950 text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex items-center gap-1 px-4 pt-1">
        {showHelp && ctx.contact && (
          <a
            href={faceTimeLink(ctx.contact)}
            className="flex h-11 items-center rounded-full border border-neutral-600 px-4 text-lg text-neutral-200 active:bg-neutral-800"
          >
            {ctx.t.help_short}
          </a>
        )}
        <div className="flex-1" />
        {LANGS.map((l) => (
          <button
            key={l.lang}
            onClick={() => ctx.setLang(l.lang)}
            aria-pressed={ctx.lang === l.lang}
            className={`h-11 min-w-11 rounded-full px-3 text-lg ${
              ctx.lang === l.lang
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

/** "第2步，共3步" + the caption, with the English caption under the Chinese. */
export function StepHeader({
  ctx,
  step,
  index,
  total,
  suffix,
}: {
  ctx: LessonCtx;
  step: ManifestStep;
  index: number;
  total: number;
  suffix?: string;
}) {
  return (
    <header className="px-5 pt-2">
      <p className="text-xl text-neutral-400">
        {ctx.t.progress
          .replace("{n}", String(index + 1))
          .replace("{total}", String(total))}
        {suffix && ` · ${suffix}`}
      </p>
      <h1 className="mt-1 text-[26px] font-semibold leading-snug">
        {captionFor(step, ctx.lang)}
      </h1>
      {ctx.lang !== "en" && (
        // Names the thing as it appears on screen, and teaches words like
        // "swipe" that Apple's own help uses.
        <p lang="en" className="mt-1 text-lg leading-snug text-neutral-400">
          {step.caption_en}
        </p>
      )}
    </header>
  );
}

export const primaryButton =
  "flex min-h-16 w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-center text-[22px] font-semibold text-neutral-900 active:bg-neutral-200";
export const secondaryButton =
  "flex min-h-16 w-full items-center justify-center rounded-2xl border border-neutral-600 px-4 py-3 text-center text-[22px] text-neutral-200 active:bg-neutral-800";
