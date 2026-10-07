import type { Manifest } from "./types";

/**
 * Link-preview text and image for a lesson: what iMessage and WeChat show when
 * the helper pastes the link. Written for the parent (Chinese first), with the
 * lesson's first screen as the picture. Paths are relative; the root layout's
 * `metadataBase` makes them absolute.
 */
export function lessonMetadata(m: Manifest) {
  const title = `小练习 · ${m.title_zh_hans ?? m.title_en}`;
  const description = `一步一步，在自己的手机上练一练。Practice step by step: ${m.title_en}.`;
  const image = `/lessons/${m.id}/${m.steps[0]?.still ?? "step-0.jpg"}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website" as const,
      images: [{ url: image, alt: m.title_en }],
    },
  };
}
