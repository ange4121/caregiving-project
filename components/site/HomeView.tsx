import Link from "next/link";
import type { LessonCard } from "@/lib/home";
import { REPO_URL } from "@/lib/site";
import PrototypeBanner from "./PrototypeBanner";

const LOOP = [
  {
    title: "You record it",
    body: "Screen-record the task on your iPhone. The editor finds the steps; you name them and pixelate anything private.",
    where: "On your laptop",
  },
  {
    title: "Your parent practices",
    body: "One link, one task. They do each tap, hold, and swipe on pictures of the real screens and are told exactly what went wrong.",
    where: "On their iPhone, in Chinese",
  },
  {
    title: "They report back",
    body: "“I've got it” texts you a summary of how it went. “I need help” starts a FaceTime call to you.",
    where: "No accounts, no app to install",
  },
];

const MAKE_STEPS = [
  "Screen-record the task on your iPhone.",
  "Load it in the editor. It suggests each moment the screen changed; confirm the gesture and name the button.",
  "Drag boxes over anything private, then Publish (pixelated pictures and short clips).",
  "Send it from the share page: a ready-written Chinese message plus the link.",
];

/** The public home page: what this is, two ways in, and the lesson library. */
export default function HomeView({
  cards,
  helperVideoEmbed,
}: {
  cards: LessonCard[];
  helperVideoEmbed: string | null;
}) {
  const featured = cards[0];
  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <PrototypeBanner />
      <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          For adult children helping an aging parent with their iPhone
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          Show your parent a phone task once. They practice it on their own
          phone.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          You record the steps. Your parent gets a link, practices each step on
          pictures of the real screens, and is told exactly what went wrong
          (&ldquo;you held too long&rdquo;), in Chinese. When they&apos;re done,
          they text you back, or FaceTime you if they&apos;re stuck.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {featured && (
            <Link
              href={featured.practiceHref}
              className="rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white"
            >
              Try a lesson as the parent →
            </Link>
          )}
          <a
            href="#make"
            className="rounded-xl border border-neutral-300 px-5 py-3 font-semibold"
          >
            See how a helper makes one
          </a>
        </div>

        <section id="how" className="mt-10 grid gap-4 sm:grid-cols-3">
          {LOOP.map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl border border-neutral-200 p-5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 font-semibold text-white">
                {i + 1}
              </span>
              <h2 className="mt-3 text-lg font-semibold">{s.title}</h2>
              <p className="mt-1 text-neutral-600">{s.body}</p>
              <p className="mt-3 text-sm font-medium text-neutral-500">
                {s.where}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {featured && (
            <div className="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <h2 className="text-2xl font-semibold">
                Try a lesson as the parent
              </h2>
              <p className="mt-2 text-neutral-600">
                Watch it once, then practice. Get a step wrong on purpose to see
                the feedback. At the end you&apos;ll see what the parent&apos;s
                &ldquo;I&apos;ve got it&rdquo; text to the helper looks like.
              </p>
              <div className="mt-5 flex flex-1 items-end gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element -- static still */}
                <img
                  src={featured.thumb}
                  alt=""
                  className="h-44 w-auto rounded-xl border-4 border-neutral-900"
                />
                <div>
                  <p className="font-semibold">{featured.titleEn}</p>
                  <p className="text-sm text-neutral-600">
                    {featured.steps} steps
                  </p>
                  <Link
                    href={featured.practiceHref}
                    className="mt-3 inline-block rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white"
                  >
                    Try it →
                  </Link>
                  <p className="mt-2 text-xs text-neutral-500">
                    Works with a mouse; best on an iPhone.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div id="make" className="rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-2xl font-semibold">
              See how a helper makes one
            </h2>
            {helperVideoEmbed ? (
              <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-neutral-100">
                <iframe
                  src={helperVideoEmbed}
                  title="How a helper makes a lesson"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : null}
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-neutral-700">
              {MAKE_STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-neutral-600">
              <Link href="/editor" className="text-blue-700 underline">
                Open the editor
              </Link>{" "}
              to try marking steps by hand. Finding steps automatically and
              publishing run on the helper&apos;s laptop for now.
            </p>
          </div>
        </section>

        <section id="lessons" className="mt-14">
          <h2 className="text-2xl font-semibold">Lessons</h2>
          <p className="mt-1 max-w-2xl text-neutral-600">
            Open-library lessons: everyday phone tasks anyone can use. Lessons
            for a specific account, like a bank, stay private to one family and
            aren&apos;t shown here.
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <li
                key={c.id}
                className="flex gap-4 rounded-2xl border border-neutral-200 p-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static still */}
                <img
                  src={c.thumb}
                  alt=""
                  className="h-28 w-auto shrink-0 rounded-lg border-2 border-neutral-900"
                />
                <div className="flex min-w-0 flex-col">
                  <p className="font-semibold leading-snug">{c.titleEn}</p>
                  {c.titleZh && (
                    <p lang="zh-Hans" className="text-sm text-neutral-600">
                      {c.titleZh}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    {c.steps} steps · recorded on {c.recordedOn}
                  </p>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Link
                      href={c.practiceHref}
                      className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm"
                    >
                      Practice
                    </Link>
                    <Link
                      href={c.shareHref}
                      className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm text-white"
                    >
                      Share
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-16 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
          Open source (AGPL-3.0) ·{" "}
          <a href={REPO_URL} className="underline">
            GitHub
          </a>{" "}
          · Built for the Assembly Code Incubator, Cohort 02 (caregiving)
        </footer>
      </main>
    </div>
  );
}
