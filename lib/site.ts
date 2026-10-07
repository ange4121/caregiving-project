// Site-wide settings for the public demo.

/** Absolute base URL, for link previews (iMessage / WeChat cards). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://caregiving-project.vercel.app");

export const REPO_URL = "https://github.com/ange4121/caregiving-project";

/**
 * Embed URL of the "how a helper makes a lesson" walkthrough (e.g. a Loom
 * embed link, https://www.loom.com/embed/<id>). Null until it's recorded; the
 * home page then shows the written steps instead of a video.
 */
export const HELPER_VIDEO_EMBED: string | null = null;

/** The lesson the home page offers first ("Try a lesson as the parent"). */
export const FEATURED_LESSON_ID = "join-wifi";
