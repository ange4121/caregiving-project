"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  addSelfStep,
  deleteStep,
  draftProblems,
  emptyLesson,
  markStep,
  slugify,
  updateStep,
} from "@/lib/editor/draft";
import type { Moment } from "@/lib/editor/moments";
import type { Lesson } from "@/lib/lesson/types";
import MomentsPanel, { momentStatus, type HelperState } from "./MomentsPanel";
import StepPanel from "./StepPanel";
import VideoPanel, { fmtTime } from "./VideoPanel";

/** The draft (not the video) is saved in this browser so a refresh loses nothing. */
const DRAFT_KEY = "editor-draft:v1";

interface Saved {
  lesson: Lesson;
  videoName: string | null;
  idEdited: boolean;
  moments?: Moment[];
  skipped?: number[];
}

export default function Editor() {
  const [lesson, setLesson] = useState<Lesson>(emptyLesson);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [idEdited, setIdEdited] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [timeMs, setTimeMs] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Local helper (ffmpeg on this laptop): token for the uploaded recording.
  const [token, setToken] = useState<string | null>(null);
  const [helper, setHelper] = useState<HelperState>("idle");
  const [moments, setMoments] = useState<Moment[]>([]);
  const [skipped, setSkipped] = useState<number[]>([]);
  const [currentMoment, setCurrentMoment] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<
    { ok: true; id: string } | { ok: false; error: string } | null
  >(null);

  // Restore the draft once, on the client.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        /* eslint-disable react-hooks/set-state-in-effect */
        setLesson(saved.lesson);
        setVideoName(saved.videoName);
        setIdEdited(saved.idEdited);
        setMoments(saved.moments ?? []);
        setSkipped(saved.skipped ?? []);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const saved: Saved = { lesson, videoName, idEdited, moments, skipped };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(saved));
    } catch {}
  }, [lesson, videoName, idEdited, moments, skipped, loaded]);

  /** Hand the file to ffmpeg on this laptop; find moments unless we already have them. */
  const startHelper = async (file: File, findMoments: boolean) => {
    setToken(null);
    setHelper("uploading");
    try {
      const up = await fetch("/api/local/recording", {
        method: "POST",
        body: file,
        headers: { "x-filename": encodeURIComponent(file.name) },
      });
      if (!up.ok) {
        setHelper("unavailable");
        return;
      }
      const { token } = await up.json();
      setToken(token);
      if (!findMoments) {
        setHelper("ready");
        return;
      }
      setHelper("analyzing");
      const res = await fetch("/api/local/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error(await res.text());
      const found = (await res.json()).moments as Moment[];
      setMoments(found);
      setSkipped([]);
      setHelper("ready");
      if (found.length) goMoment(0, found);
    } catch {
      setHelper("error");
    }
  };

  const loadFile = (file: File) => {
    if (
      lesson.steps.length > 0 &&
      videoName !== file.name &&
      !confirm(
        `Your draft has ${lesson.steps.length} steps for "${videoName}". Start a new lesson with "${file.name}"?`,
      )
    ) {
      return;
    }
    const sameFile = videoName === file.name;
    if (!sameFile) {
      setLesson(emptyLesson());
      setIdEdited(false);
      setSelected(null);
      setMoments([]);
      setSkipped([]);
      setCurrentMoment(null);
    }
    setVideoName(file.name);
    // Object URL: the browser reads the file in place; nothing is uploaded.
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(file));
    void startHelper(file, !(sameFile && moments.length > 0));
  };

  const seekTo = (ms: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = ms / 1000;
  };

  const goMoment = (i: number, list = moments) => {
    setCurrentMoment(i);
    setSelected(null);
    // Wait a tick if the video element is still loading its metadata.
    const go = () => seekTo(list[i].t_ms);
    if (videoRef.current?.readyState) go();
    else
      videoRef.current?.addEventListener("loadedmetadata", go, { once: true });
  };

  /** The next moment after `from` that still needs a decision. */
  const goNextPending = (from: number | null, skippedNow = skipped) => {
    const start = from === null ? 0 : from + 1;
    for (let k = 0; k < moments.length; k++) {
      const i = (start + k) % moments.length;
      if (momentStatus(moments[i], i, lesson.steps, skippedNow) === "pending") {
        goMoment(i);
        return;
      }
    }
    setCurrentMoment(null);
  };

  const skipMoment = (i: number) => {
    const next = skipped.includes(i) ? skipped : [...skipped, i];
    setSkipped(next);
    goNextPending(i, next);
  };

  const acceptMoment = (i: number) => {
    const m = moments[i];
    if (!m.guess) return;
    const r = markStep(lesson, m.t_ms, {
      gesture: "tap",
      x: m.guess.x,
      y: m.guess.y,
      swipe_direction: null,
      system_gesture: false,
    });
    setLesson(r.lesson);
    setSelected(r.index);
  };

  // Enter = accept the suggested tap, S = not a step (outside text fields).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag)) return;
      if (currentMoment === null) return;
      const status = momentStatus(
        moments[currentMoment],
        currentMoment,
        lesson.steps,
        skipped,
      );
      if (status !== "pending") return;
      if (e.key === "Enter") {
        e.preventDefault();
        acceptMoment(currentMoment);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        skipMoment(currentMoment);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cur = currentMoment !== null ? moments[currentMoment] : null;
  const guessHere =
    cur &&
    cur.guess &&
    Math.abs(timeMs - cur.t_ms) < 60 &&
    momentStatus(cur, currentMoment!, lesson.steps, skipped) === "pending"
      ? cur.guess
      : null;

  const select = (i: number) => {
    setSelected(i);
    seekTo(lesson.steps[i].t_ms);
  };

  const setTitle = (title_en: string) =>
    setLesson((l) => ({
      ...l,
      title_en,
      id: idEdited ? l.id : slugify(title_en),
    }));

  const download = () => {
    const blob = new Blob([JSON.stringify(lesson, null, 2) + "\n"], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${lesson.id || "lesson"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const publish = async () => {
    if (!token) return;
    setPublishing(true);
    setPublished(null);
    try {
      const res = await fetch("/api/local/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, lesson }),
      });
      const body = await res.json();
      setPublished(
        res.ok ? { ok: true, id: body.id } : { ok: false, error: body.error },
      );
    } catch (e) {
      setPublished({ ok: false, error: String(e) });
    } finally {
      setPublishing(false);
    }
  };

  const problems = draftProblems(lesson);
  const needsVideo = !src && lesson.steps.length > 0 && videoName;

  return (
    <div className="flex h-dvh flex-col bg-white text-neutral-900">
      <header className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <Link href="/" className="font-semibold">
          Phone lessons
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="font-medium">Editor</span>
        <label className="ml-auto cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
          {src ? "Change recording" : "Load recording"}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
              e.target.value = "";
            }}
          />
        </label>
        <button
          onClick={download}
          disabled={lesson.steps.length === 0}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Download lesson.json
        </button>
        <button
          onClick={publish}
          disabled={!token || problems.length > 0 || publishing}
          title={
            !token
              ? "Publishing works when the editor runs on your laptop"
              : problems[0]
          }
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {publishing ? "Publishing…" : "Publish"}
        </button>
      </header>

      {published?.ok && (
        <div className="flex flex-wrap items-center gap-3 border-b border-green-200 bg-green-50 px-4 py-2 text-sm">
          <span>
            ✓ Published to <code>public/lessons/{published.id}/</code>. Check
            the pictures and clips for anything private, then commit and push to
            put it online.
          </span>
          <a
            href={`/l/${published.id}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-green-800 underline"
          >
            Try it
          </a>
          <a
            href={`/share/${published.id}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-green-800 underline"
          >
            Send
          </a>
        </div>
      )}
      {published && !published.ok && (
        <div className="whitespace-pre-wrap border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          Publishing failed: {published.error}
        </div>
      )}

      {needsVideo && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm">
          Your draft is saved. Load <b>{videoName}</b> again to keep editing.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <VideoPanel
          src={src}
          videoRef={videoRef}
          lesson={lesson}
          selected={selected}
          timeMs={timeMs}
          onTime={setTimeMs}
          onLoaded={({ width, height, durationMs }) =>
            setLesson((l) => ({
              ...l,
              video: { width, height, duration_ms: durationMs },
            }))
          }
          onMark={(fields, t) => {
            const r = markStep(lesson, t, fields);
            setLesson(r.lesson);
            setSelected(r.index);
          }}
          onSelect={select}
          guess={guessHere}
        />

        <aside className="flex w-[380px] shrink-0 flex-col overflow-y-auto border-l border-neutral-200">
          <div className="space-y-2 border-b border-neutral-200 p-4">
            <input
              value={lesson.title_en}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title, e.g. Log in to Chase"
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 font-semibold"
            />
            <div className="flex gap-2 text-sm">
              <label className="flex flex-1 items-center gap-1">
                <span className="text-neutral-500">id</span>
                <input
                  value={lesson.id}
                  onChange={(e) => {
                    setIdEdited(true);
                    setLesson((l) => ({ ...l, id: slugify(e.target.value) }));
                  }}
                  className="h-8 min-w-0 flex-1 rounded border border-neutral-300 px-2 font-mono text-xs"
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="text-neutral-500">iOS</span>
                <input
                  value={lesson.ios_version}
                  onChange={(e) =>
                    setLesson((l) => ({ ...l, ios_version: e.target.value }))
                  }
                  className="h-8 w-14 rounded border border-neutral-300 px-2"
                />
              </label>
            </div>
          </div>

          <MomentsPanel
            helper={helper}
            moments={moments}
            steps={lesson.steps}
            skipped={skipped}
            current={currentMoment}
            onGo={(i) => goMoment(i)}
            onSkip={skipMoment}
            onAccept={acceptMoment}
          />

          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <h2 className="font-semibold">Steps</h2>
            <button
              disabled={!src}
              onClick={() => {
                const r = addSelfStep(lesson, timeMs);
                setLesson(r.lesson);
                setSelected(r.index);
              }}
              className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50 disabled:opacity-40"
            >
              + &ldquo;Do it yourself&rdquo; at {fmtTime(timeMs)}
            </button>
          </div>

          <StepPanel
            steps={lesson.steps}
            selected={selected}
            onSelect={select}
            onLabelEnter={() =>
              moments.length > 0 && goNextPending(currentMoment)
            }
            onChange={(i, patch) => setLesson((l) => updateStep(l, i, patch))}
            onDelete={(i) => {
              setLesson((l) => deleteStep(l, i));
              setSelected(null);
            }}
          />

          {lesson.steps.length > 0 && problems.length > 0 && (
            <div className="border-t border-neutral-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
              <p className="font-semibold">Before publishing:</p>
              <ul className="list-disc pl-4">
                {problems.slice(0, 4).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
