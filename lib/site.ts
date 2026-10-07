// Site-wide settings for the public demo.

/** Absolute base URL, for link previews (iMessage / WeChat cards). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://caregiving-project.vercel.app");

export const REPO_URL = "https://github.com/ange4121/caregiving-project";

/** README section on making a lesson (setup: Node.js, ffmpeg, the dev server). */
export const SETUP_URL = `${REPO_URL}#make-a-lesson`;

/**
 * Embed URL of the "how a helper makes a lesson" walkthrough (e.g. a Loom
 * embed link, https://www.loom.com/embed/<id>). Null until it's recorded; the
 * home page then shows the written steps instead of a video.
 */
export const HELPER_VIDEO_EMBED: string | null =
  "https://www.loom.com/embed/f4cd32655ce34453be50e45867cb5c74";

/** The lesson the home page offers first ("Try a lesson as the parent"). */
export const FEATURED_LESSON_ID = "making-text-size-bigger";
