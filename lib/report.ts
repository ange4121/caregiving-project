import type { GestureError } from "@/lib/gesture";

/** One judged attempt, as the player logs it. */
export interface AttemptLog {
  /** 0-based step index. */
  step: number;
  ok: boolean;
  error: GestureError | null;
  durationMs: number;
  ambiguousPress: boolean;
}

export interface StepSummary {
  /** 1-based, as the learner sees it. */
  stepNumber: number;
  tries: number;
  /** The mistake she made most on this step. */
  mainError: GestureError;
}

/** Steps that took more than one try, in order. */
export function summarizeAttempts(log: readonly AttemptLog[]): StepSummary[] {
  const byStep = new Map<number, AttemptLog[]>();
  for (const a of log) {
    byStep.set(a.step, [...(byStep.get(a.step) ?? []), a]);
  }
  const out: StepSummary[] = [];
  for (const [step, attempts] of [...byStep].sort((a, b) => a[0] - b[0])) {
    const errors = attempts.flatMap((a) => (a.error ? [a.error] : []));
    if (errors.length === 0) continue;
    const counts = new Map<GestureError, number>();
    for (const e of errors) counts.set(e, (counts.get(e) ?? 0) + 1);
    // Most frequent; ties go to the one she made first.
    const mainError = errors.reduce((best, e) =>
      counts.get(e)! > counts.get(best)! ? e : best,
    );
    out.push({ stepNumber: step + 1, tries: attempts.length, mainError });
  }
  return out;
}

const ERROR_SHORT: Record<
  GestureError,
  { "zh-Hans": string; "zh-Hant": string; en: string }
> = {
  tap_too_long: {
    "zh-Hans": "按太久",
    "zh-Hant": "按太久",
    en: "held too long",
  },
  tap_moved: {
    "zh-Hans": "手指动了",
    "zh-Hant": "手指動了",
    en: "finger moved",
  },
  hold_too_short: {
    "zh-Hans": "放手太早",
    "zh-Hant": "放手太早",
    en: "let go too early",
  },
  hold_moved: {
    "zh-Hans": "按住时手指动了",
    "zh-Hant": "按住時手指動了",
    en: "moved while holding",
  },
  swipe_no_move: {
    "zh-Hans": "没有滑",
    "zh-Hant": "沒有滑",
    en: "didn't slide",
  },
  swipe_too_short: {
    "zh-Hans": "滑得太短",
    "zh-Hant": "滑得太短",
    en: "swipe too short",
  },
  swipe_wrong_direction: {
    "zh-Hans": "方向反了",
    "zh-Hant": "方向反了",
    en: "wrong direction",
  },
  wrong_place: {
    "zh-Hans": "位置不对",
    "zh-Hant": "位置不對",
    en: "wrong spot",
  },
};

const TEXT = {
  "zh-Hans": {
    finished: "我练完了：{title} ✓",
    firstTry: "每一步都一次做对了",
    step: "第{n}步试了{k}次（{err}）",
  },
  "zh-Hant": {
    finished: "我練完了：{title} ✓",
    firstTry: "每一步都一次做對了",
    step: "第{n}步試了{k}次（{err}）",
  },
};

/**
 * The text the parent sends the child from the end screen: Chinese first
 * (in the parent's voice), then English for the child.
 */
export function buildReportMessage(opts: {
  script: "zh-Hans" | "zh-Hant";
  titleZh: string | undefined;
  titleEn: string;
  log: readonly AttemptLog[];
}): string {
  const t = TEXT[opts.script];
  const steps = summarizeAttempts(opts.log);

  const zh = [t.finished.replace("{title}", opts.titleZh ?? opts.titleEn)];
  const en = [`I finished: ${opts.titleEn} ✓`];
  if (steps.length === 0) {
    zh.push(t.firstTry);
    en.push("Every step right on the first try");
  }
  for (const s of steps) {
    zh.push(
      t.step
        .replace("{n}", String(s.stepNumber))
        .replace("{k}", String(s.tries))
        .replace("{err}", ERROR_SHORT[s.mainError][opts.script]),
    );
    en.push(
      `Step ${s.stepNumber}: ${s.tries} tries (${ERROR_SHORT[s.mainError].en})`,
    );
  }
  return [...zh, "—", ...en].join("\n");
}

/** `sms:` link that opens Messages to the child with the text filled in (iOS form). */
export function smsLink(contact: string, body: string): string {
  return `sms:${contact}&body=${encodeURIComponent(body)}`;
}

/** `facetime:` link: iOS asks "Call / Cancel", then starts a video call. */
export function faceTimeLink(contact: string): string {
  return `facetime:${contact}`;
}
