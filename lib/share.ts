import { isLang, type Lang } from "@/lib/i18n";

/**
 * What the child adds to a lesson link. It rides in the URL fragment (after
 * `#`), which browsers never send to the server, so the child's number stays
 * out of server logs and out of the repo.
 */
export interface ShareInfo {
  /** Language the parent sees. */
  lang: Lang;
  /** Child's phone number or Apple ID email, for Messages and FaceTime. */
  contact: string;
  /** What the parent calls the child, e.g. 小雨 or 女儿. Shown on the help button. */
  childName: string;
}

export type ParentScript = "zh-Hans" | "zh-Hant";

/** Phone numbers lose spaces, dashes, dots, and parentheses; emails are kept as typed. */
export function normalizeContact(raw: string): string {
  const v = raw.trim();
  if (v.includes("@")) return v;
  return v.replace(/[\s\-().]/g, "");
}

/** Loose check: an email, or a phone number with at least 7 digits. */
export function isValidContact(raw: string): boolean {
  const v = normalizeContact(raw);
  if (v.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return /^\+?\d{7,15}$/.test(v);
}

/** A phone number without a leading + (no country code). */
export function lacksCountryCode(raw: string): boolean {
  const v = normalizeContact(raw);
  return !v.includes("@") && /^\d+$/.test(v);
}

export function buildLessonLink(
  origin: string,
  lessonId: string,
  info: ShareInfo,
): string {
  const hash = new URLSearchParams();
  hash.set("lang", info.lang);
  const contact = normalizeContact(info.contact);
  if (contact) hash.set("to", contact);
  if (info.childName.trim()) hash.set("me", info.childName.trim());
  return `${origin}/l/${lessonId}#${hash.toString()}`;
}

/** Read the share info back out of `location.hash`. Missing fields are null. */
export function parseShareFragment(hash: string): {
  lang: Lang | null;
  contact: string | null;
  childName: string | null;
} {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const lang = params.get("lang");
  return {
    lang: isLang(lang) ? lang : null,
    contact: params.get("to") || null,
    childName: params.get("me") || null,
  };
}

/** Common ways to address a parent, with an English gloss for the author. */
export const PARENT_NAMES: { zh: string; en: string }[] = [
  { zh: "妈", en: "Mom" },
  { zh: "爸", en: "Dad" },
];

const TEMPLATES = {
  "zh-Hans": {
    withTitle: "{parent}，我给你做了一个小练习：{title}。有空的时候点开试试。",
    noTitle: "{parent}，我给你做了一个小练习。有空的时候点开试试。",
  },
  "zh-Hant": {
    withTitle: "{parent}，我給你做了一個小練習：{title}。有空的時候點開試試。",
    noTitle: "{parent}，我給你做了一個小練習。有空的時候點開試試。",
  },
};

/** The message the child sends, in the parent's script, with the link on its own line. */
export function buildShareMessage(opts: {
  script: ParentScript;
  parentName: string;
  title: string | undefined;
  link: string;
}): string {
  const t = TEMPLATES[opts.script];
  const parent = opts.parentName.trim() || "你好";
  const body = (opts.title ? t.withTitle : t.noTitle)
    .replace("{parent}", parent)
    .replace("{title}", opts.title ?? "");
  return `${body}\n${opts.link}`;
}

/** English version of the same message, so the author knows what they're sending. */
export function buildShareMessageEnglish(opts: {
  parentNameEn: string;
  titleEn: string;
}): string {
  const parent = opts.parentNameEn.trim() || "Hi";
  return `${parent}, I made you a little practice: ${opts.titleEn}. Try it when you have time.`;
}
