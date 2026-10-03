import en from "@/locales/en.json";
import zhHans from "@/locales/zh-Hans.json";
import zhHant from "@/locales/zh-Hant.json";
import type { ManifestStep } from "@/lib/lesson/types";

export type Lang = "en" | "zh-Hans" | "zh-Hant";

/**
 * English while the author is testing. Switch to "zh-Hans" before sending
 * lessons to parents.
 */
export const DEFAULT_LANG: Lang = "en";

export const LANGS: { lang: Lang; label: string }[] = [
  { lang: "en", label: "EN" },
  { lang: "zh-Hans", label: "简" },
  { lang: "zh-Hant", label: "繁" },
];

export type Strings = typeof zhHans;

const STRINGS: Record<Lang, Strings> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
};

export const stringsFor = (lang: Lang): Strings => STRINGS[lang];

export const isLang = (v: string | null): v is Lang =>
  v === "en" || v === "zh-Hans" || v === "zh-Hant";

export function captionFor(step: ManifestStep, lang: Lang): string {
  if (lang === "en") return step.caption_en;
  if (lang === "zh-Hant") return step.caption_zh_hant;
  return step.caption_zh_hans;
}
