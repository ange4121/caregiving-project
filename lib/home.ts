import { demoLessonHref } from "@/lib/lesson/url";
import type { Manifest } from "@/lib/lesson/types";

/** Which phone a lesson was recorded on: gestures and screens differ by model and iOS version. */
export function recordedOn(
  m: Pick<Manifest, "iphone_model" | "ios_version">,
): string {
  const ios = `iOS ${m.ios_version}`;
  return m.iphone_model?.trim() ? `${m.iphone_model.trim()} · ${ios}` : ios;
}

export interface LessonCard {
  id: string;
  titleEn: string;
  titleZh: string | null;
  steps: number;
  iosVersion: string;
  /** "iPhone 16 Pro · iOS 26", or just "iOS 26" when the model isn't known. */
  recordedOn: string;
  /** The lesson's first screen. */
  thumb: string;
  /** The first step's instruction, as the parent sees it (Simplified Chinese). */
  firstCaptionZh: string | null;
  /** Opens the lesson as the parent sees it, in demo mode. */
  practiceHref: string;
  /** The helper's "send this to my parent" page. */
  shareHref: string;
}

/** Library cards, with the featured lesson first and the rest by title. */
export function lessonCards(
  manifests: readonly Manifest[],
  featuredId: string,
): LessonCard[] {
  return manifests
    .map((m) => ({
      id: m.id,
      titleEn: m.title_en,
      titleZh: m.title_zh_hans ?? null,
      steps: m.steps.length,
      iosVersion: m.ios_version,
      recordedOn: recordedOn(m),
      thumb: `/lessons/${m.id}/${m.steps[0]?.still ?? "step-0.jpg"}`,
      firstCaptionZh: m.steps[0]?.caption_zh_hans ?? null,
      practiceHref: demoLessonHref(m.id),
      shareHref: `/share/${m.id}`,
    }))
    .sort((a, b) =>
      a.id === featuredId
        ? -1
        : b.id === featuredId
          ? 1
          : a.titleEn.localeCompare(b.titleEn),
    );
}
