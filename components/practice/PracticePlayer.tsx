"use client";

import { useState } from "react";
import type { Manifest } from "@/lib/lesson/types";
import { primaryButton, secondaryButton, Shell, useLessonCtx } from "./lesson";
import PracticeMode from "./PracticeMode";
import WatchMode from "./WatchMode";

/**
 * The learner's lesson: a start screen, then Watch (see it done) or
 * Practice (do it, with feedback).
 */
export default function PracticePlayer({
  manifest,
  assetBase,
}: {
  manifest: Manifest;
  assetBase: string;
}) {
  const ctx = useLessonCtx();
  const { t, lang } = ctx;
  const [screen, setScreen] = useState<"start" | "watch" | "practice">("start");

  if (screen === "watch") {
    return (
      <WatchMode
        manifest={manifest}
        assetBase={assetBase}
        ctx={ctx}
        onPractice={() => setScreen("practice")}
      />
    );
  }
  if (screen === "practice") {
    return <PracticeMode manifest={manifest} assetBase={assetBase} ctx={ctx} />;
  }

  const titleZh =
    lang === "zh-Hant" ? manifest.title_zh_hant : manifest.title_zh_hans;
  const title = lang !== "en" && titleZh ? titleZh : manifest.title_en;
  const firstStill = `${assetBase}/${manifest.steps[0].still}`;

  return (
    <Shell ctx={ctx}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- static still */}
        <img
          src={firstStill}
          alt=""
          className="max-h-[38dvh] w-auto rounded-2xl border-4 border-neutral-800"
        />
        <div>
          <h1 className="text-[28px] font-semibold leading-snug">{title}</h1>
          {title !== manifest.title_en && (
            <p lang="en" className="mt-1 text-lg text-neutral-400">
              {manifest.title_en}
            </p>
          )}
          <p className="mt-2 text-xl text-neutral-400">
            {t.intro_steps.replace("{total}", String(manifest.steps.length))}
          </p>
        </div>
        <p className="text-xl text-neutral-300">{t.intro_note}</p>
      </div>
      <footer className="flex flex-col gap-3 px-5 pb-4">
        <button onClick={() => setScreen("watch")} className={primaryButton}>
          {t.watch_first}
        </button>
        <button
          onClick={() => setScreen("practice")}
          className={secondaryButton}
        >
          {t.start_practice}
        </button>
      </footer>
    </Shell>
  );
}
