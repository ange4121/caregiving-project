import Link from "next/link";
import { typicalMistake, type LessonCard } from "@/lib/home";
import { buildReportMessage } from "@/lib/report";
import { REPO_URL, SETUP_URL } from "@/lib/site";
import PrototypeBanner from "./PrototypeBanner";

/** The loop, in order. Each step links to where a visitor can see that piece. */
function loopSteps(featured: LessonCard | undefined) {
  return [
    {
      title: "You record it",
      body: "Screen-record the task on your iPhone. The editor finds the steps; you name them and pixelate anything private.",
      where: "On your laptop",
      link: { href: "#make", label: "Watch a helper make one (1½ min) ↓" },
    },
    {
      title: "You send it",
      body: "A ready-written message in Chinese with the link, sent from your own phone through iMessage, WeChat, or WhatsApp.",
      where: "The app never messages your parent",
      link: featured
        ? { href: featured.shareHref, label: "See the message →" }
        : null,
    },
    {
      title: "Your parent practices",
      body: "One link, one task. They do each tap, hold, and swipe on pictures of the real screens and are told exactly what went wrong.",
      where: "On their iPhone, in Chinese",
      link: featured
        ? { href: featured.practiceHref, label: "Try it as the parent →" }
        : null,
    },
  ];
}

/**
 * The text a parent sends at the end of a lesson, built by the same code the
 * lesson uses (here: step 2 took two tries).
 */
function sampleReport(featured: LessonCard | undefined) {
  // Step 2 took two tries, with a mistake that fits step 2's gesture.
  const mistake = typicalMistake(featured?.gestures[1]);
  const text = buildReportMessage({
    script: "zh-Hans",
    titleZh: featured?.titleZh ?? undefined,
    titleEn: featured?.titleEn ?? "Make the text bigger",
    log: [
      {
        step: 0,
        ok: true,
        error: null,
        durationMs: 120,
        ambiguousPress: false,
      },
      ...(mistake
        ? [
            {
              step: 1,
              ok: false,
              error: mistake,
              durationMs: 700,
              ambiguousPress: false,
            },
          ]
        : []),
      {
        step: 1,
        ok: true,
        error: null,
        durationMs: 120,
        ambiguousPress: false,
      },
    ],
  });
  const [zh, en] = text.split("\n—\n");
  return { zh, en };
}

const MAKE_STEPS = [
  "Screen-record the task on your iPhone.",
  "Load it in the editor. It suggests each moment the screen changed; confirm the gesture and name the button.",
  "Drag boxes over anything private, then Publish (pixelated pictures and short clips).",
  "Send it from the share page: a ready-written Chinese message plus the link.",
];

/** The public home page: what this is, two ways in, and the lesson library. */
const card =
  "rounded-2xl border border-sand/60 bg-white/70 transition-shadow hover:shadow-md";
const stepBadge =
  "flex h-8 w-8 items-center justify-center rounded-full bg-coral text-sm font-semibold text-navy";
const container = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12";

/** The public home page: what this is, the loop, two ways in, and the lesson library. */
export default function HomeView({
  cards,
  helperVideoEmbed,
}: {
  cards: LessonCard[];
  helperVideoEmbed: string | null;
}) {
  const featured = cards[0];
  const loop = loopSteps(featured);
  const report = sampleReport(featured);
  return (
    <div className="min-h-dvh bg-cream text-navy">
      <PrototypeBanner />

      <nav className={`${container} flex items-center gap-6 py-4 text-sm`}>
        <Link href="/" className="text-base font-semibold tracking-tight">
          Phone lessons
        </Link>
        <div className="ml-auto hidden items-center gap-6 text-navy/75 sm:flex">
          <a href="#how" className="hover:text-navy">
            How it works
          </a>
          <a href="#lessons" className="hover:text-navy">
            Lessons
          </a>
          <Link href="/editor" className="hover:text-navy">
            Editor
          </Link>
          <a href={REPO_URL} className="hover:text-navy">
            GitHub
          </a>
        </div>
      </nav>

      <header className={`${container} pt-8`}>
        <p className="text-sm font-semibold uppercase tracking-wide text-coral-deep">
          For adult children helping an aging parent with their iPhone
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Show your parent a phone task once. They practice it on their own
          phone.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/75">
          You record the steps. Your parent gets a link, practices each step on
          pictures of the real screens, and is told exactly what went wrong
          (&ldquo;you held too long&rdquo;), in Chinese. When they&apos;re done,
          they text you back, or FaceTime you if they&apos;re stuck.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {featured && (
            <Link
              href={featured.practiceHref}
              className="rounded-xl bg-navy px-5 py-3 font-semibold text-cream hover:bg-navy/90"
            >
              Try it as the parent →
            </Link>
          )}
          <a
            href="#make"
            className="rounded-xl border border-sand px-5 py-3 font-semibold hover:border-umber bg-white/60"
          >
            Watch a helper make one (1½ min)
          </a>
          <a
            href="#lessons"
            className="rounded-xl border border-sand px-5 py-3 font-semibold hover:border-umber bg-white/60"
          >
            Browse the sample lessons ↓
          </a>
        </div>
      </header>

      <main className={`${container} pb-16`}>
        <section id="how" className="scroll-mt-6 pt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loop.map((s, i) => (
              <div key={s.title} className={`${card} flex flex-col p-6`}>
                <span className={stepBadge}>{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 leading-relaxed text-navy/75">{s.body}</p>
                <p className="mt-3 text-sm font-medium text-navy/60">
                  {s.where}
                </p>
                {s.link && (
                  <Link
                    href={s.link.href}
                    className="mt-auto pt-5 font-semibold text-navy underline decoration-coral decoration-2 underline-offset-4 hover:decoration-navy"
                  >
                    {s.link.label}
                  </Link>
                )}
              </div>
            ))}
            <div className={`${card} flex flex-col p-6`}>
              <span className={stepBadge}>4</span>
              <h3 className="mt-4 text-lg font-semibold">They report back</h3>
              <p className="mt-1 text-navy/75">One tap at the end texts you:</p>
              <p
                lang="zh-Hans"
                className="mt-2 whitespace-pre-line rounded-2xl rounded-bl-md bg-green-500 px-3 py-2 text-sm leading-snug text-white"
              >
                {report.zh}
              </p>
              <p className="mt-1 whitespace-pre-line text-xs text-navy/60">
                {report.en}
              </p>
              <p className="mt-3 text-sm font-medium text-navy/60">
                Or they tap 📹 to FaceTime you.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2 lg:items-start">
          {featured && (
            <div className={`${card} flex flex-col bg-peach/60 p-6 sm:p-8`}>
              <h2 className="text-2xl font-semibold tracking-tight">
                Try a lesson as the parent
              </h2>
              <p className="mt-2 leading-relaxed text-navy/75">
                Watch it once, then practice. Get a step wrong on purpose to see
                the feedback. At the end you&apos;ll see what the parent&apos;s
                &ldquo;I&apos;ve got it&rdquo; text to the helper looks like.
              </p>
              <div className="mt-6 flex items-center gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element -- static still */}
                <img
                  src={featured.thumb}
                  alt=""
                  className="h-56 w-auto rounded-[1.4rem] border-[6px] border-navy shadow-lg"
                />
                <div>
                  <p className="text-lg font-semibold">{featured.titleEn}</p>
                  {featured.titleZh && (
                    <p lang="zh-Hans" className="text-navy/75">
                      {featured.titleZh}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-navy/60">
                    {featured.steps} steps
                  </p>
                  <Link
                    href={featured.practiceHref}
                    className="mt-4 inline-block rounded-xl bg-navy px-5 py-3 font-semibold text-cream hover:bg-navy/90"
                  >
                    Try it →
                  </Link>
                  <p className="mt-2 text-xs text-navy/60">
                    Works with a mouse; best on an iPhone.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div id="make" className={`${card} scroll-mt-6 p-6 sm:p-8`}>
            <h2 className="text-2xl font-semibold tracking-tight">
              See how a helper makes one
            </h2>
            {helperVideoEmbed ? (
              <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-peach">
                <iframe
                  src={helperVideoEmbed}
                  title="How a helper makes a lesson"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : null}
            <ol className="mt-5 space-y-3">
              {MAKE_STEPS.map((s, i) => (
                <li key={s} className="flex gap-3 text-navy/85">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-peach text-xs font-semibold text-navy">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-navy/75">
              <Link
                href="/editor"
                className="font-semibold text-navy underline decoration-coral decoration-2 underline-offset-4"
              >
                Open the editor
              </Link>{" "}
              to try marking steps by hand. Finding steps automatically and
              publishing run on the author&apos;s computer for now (a developer
              setup with Node.js and ffmpeg;{" "}
              <a href={SETUP_URL} className="underline">
                see the README
              </a>
              ).
            </p>
          </div>
        </section>

        <section id="lessons" className="scroll-mt-6 pt-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-coral-deep">
            Public library
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Lessons
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-navy/75">
            Open-library lessons: everyday phone tasks anyone can use. Lessons
            for a specific account, like a bank, stay private to one family and
            aren&apos;t shown here.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <li key={c.id} className={`${card} flex gap-5 p-5`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static still */}
                <img
                  src={c.thumb}
                  alt=""
                  className="h-36 w-auto shrink-0 rounded-xl border-4 border-navy"
                />
                <div className="flex min-w-0 flex-col">
                  <p className="text-lg font-semibold leading-snug">
                    {c.titleEn}
                  </p>
                  {c.titleZh && (
                    <p lang="zh-Hans" className="text-navy/75">
                      {c.titleZh}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-navy/60">
                    {c.steps} steps · recorded on {c.recordedOn}
                  </p>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Link
                      href={c.practiceHref}
                      className="rounded-full border border-sand px-4 py-1.5 text-sm font-medium hover:border-umber"
                    >
                      Practice
                    </Link>
                    <Link
                      href={c.shareHref}
                      className="rounded-full bg-navy px-4 py-1.5 text-sm font-medium text-cream hover:bg-navy/90"
                    >
                      Share
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-20 flex flex-wrap gap-x-2 border-t border-sand/60 pt-6 text-sm text-navy/60">
          <span>Open source (AGPL-3.0)</span>·
          <a href={REPO_URL} className="underline">
            GitHub
          </a>
        </footer>
      </main>
    </div>
  );
}
