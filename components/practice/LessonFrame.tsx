"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { readLessonUrl } from "@/lib/lesson/url";
import { SITE_URL } from "@/lib/site";

/**
 * What the QR code should open. "localhost" means the phone itself, so a QR
 * made on the author's laptop points at the live site instead (the lesson
 * must be pushed for that to work). Other addresses (the live site, a Wi-Fi
 * IP like 10.0.0.42) are reachable from a phone as they are.
 */
export function qrTarget(href: string, siteUrl: string): string {
  const u = new URL(href);
  if (["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)) {
    return new URL(u.pathname + u.search, siteUrl).toString();
  }
  return href;
}

/**
 * On a phone: just the lesson. On a laptop (lg and up): the lesson at phone
 * width, with a side panel for visitors explaining what they're looking at and
 * a QR code to open it on a phone. Real share links (with a helper's contact)
 * never show the panel: those are for parents.
 */
export default function LessonFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [isShareLink, setIsShareLink] = useState(false);

  useEffect(() => {
    const url = readLessonUrl(window.location.search, window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL is client-only
    setIsShareLink(url.contact !== null);
    QRCode.toString(qrTarget(window.location.href, SITE_URL), {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrSvg)
      .catch(() => setQrSvg(null));
  }, []);

  return (
    <div className="lg:flex lg:h-dvh lg:items-center lg:justify-center lg:gap-12 lg:bg-neutral-100">
      <div className="lg:h-dvh lg:w-[430px] lg:shrink-0 lg:overflow-hidden lg:shadow-2xl">
        {children}
      </div>
      {!isShareLink && (
        <aside className="hidden max-w-xs text-neutral-800 lg:block">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-900">
            Live prototype
          </span>
          <h2 className="mt-3 text-2xl font-semibold leading-snug">
            You&apos;re seeing what the parent sees.
          </h2>
          <p className="mt-2 text-neutral-600">
            Practice with your mouse here: click to tap, press and hold, or drag
            to swipe. Make a mistake on purpose to see the feedback.
          </p>
          <p className="mt-2 text-neutral-600">
            Parents get it in Chinese. Switch with 简 / 繁 at the top.
          </p>
          {qrSvg && (
            <figure className="mt-5">
              <div
                className="h-44 w-44 rounded-xl bg-white p-2 shadow"
                // Generated locally by the qrcode library from this page's URL.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <figcaption className="mt-2 text-sm text-neutral-600">
                Or scan to try it on your iPhone, the way a parent would.
              </figcaption>
            </figure>
          )}
          <Link href="/" className="mt-6 inline-block text-blue-700 underline">
            ← How it works and all lessons
          </Link>
        </aside>
      )}
    </div>
  );
}
