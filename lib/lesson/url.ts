import { isLang, type Lang } from "@/lib/i18n";
import { parseShareFragment } from "@/lib/share";

export interface LessonUrl {
  /** Null = use the site default. */
  lang: Lang | null;
  /** Helper's phone / Apple ID, from a real share link. */
  contact: string | null;
  childName: string | null;
  /**
   * Opened from the public home page (`?demo=1`): the end screen shows what
   * the report-back and FaceTime buttons would do, instead of doing it.
   * A real share link (with a contact) is never a demo.
   */
  demo: boolean;
}

/** Read a lesson link: `?lang=` and `?demo=1` (query), `#lang=&to=&me=` (share fragment). */
export function readLessonUrl(search: string, hash: string): LessonUrl {
  const query = new URLSearchParams(search);
  const share = parseShareFragment(hash);
  const fromQuery = query.get("lang");
  return {
    // ?lang= (for testing) beats #lang= (from the child's share link).
    lang: isLang(fromQuery) ? fromQuery : share.lang,
    contact: share.contact,
    childName: share.childName,
    demo: query.get("demo") === "1" && !share.contact,
  };
}

/** The link the home page and library use: a demo of the lesson as the parent sees it. */
export const demoLessonHref = (id: string) => `/l/${id}?demo=1`;
