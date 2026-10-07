import Link from "next/link";
import type { LessonCard } from "@/lib/home";
import { buildReportMessage } from "@/lib/report";
import zhHans from "@/locales/zh-Hans.json";
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
  const text = buildReportMessage({
    script: "zh-Hans",
    titleZh: featured?.titleZh ?? undefined,
    titleEn: featured?.titleEn ?? "Get onto Wi-Fi",
    log: [
      {
        step: 0,
        ok: true,
        error: null,
        durationMs: 120,
        ambiguousPress: false,
      },
      {
        step: 1,
        ok: false,
        error: "hold_too_short",
        durationMs: 300,
        ambiguousPress: false,
      },
      {
        step: 1,
        ok: true,
        error: null,
        durationMs: 800,
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
/** Hero picture: the real lesson in a phone, with the moments that matter around it. */
function HeroPhone({
  featured,
  reportZh,
}: {
  featured: LessonCard;
  reportZh: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[540px] py-4">
      <div className="mx-auto w-[230px] rounded-[2.6rem] bg-neutral-900 p-2 shadow-2xl ring-1 ring-black/10 sm:w-[250px]">
        <div className="overflow-hidden rounded-[2.1rem] bg-neutral-950 text-white">
          <div className="px-4 pb-2 pt-4" lang="zh-Hans">
            <p className="text-[11px] text-neutral-400">
              第1步，共{featured.steps}步
            </p>
            <p className="text-sm font-semibold leading-snug">
              {featured.firstCaptionZh ?? featured.titleZh ?? featured.titleEn}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static still */}
          <img src={featured.thumb} alt="" className="block w-full" />
        </div>
      </div>

      <div className="absolute left-0 top-[36%] hidden w-48 -rotate-2 rounded-2xl border border-amber-200 bg-white p-3 shadow-lg sm:block">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          Feedback on the exact mistake
        </p>
        <p lang="zh-Hans" className="mt-1 text-sm font-medium text-neutral-900">
          {zhHans.errors.tap_too_long}
        </p>
        <p className="text-xs text-neutral-500">
          You pressed too long. Like a doorbell: touch it and let go.
        </p>
      </div>

      <div className="absolute bottom-12 right-0 hidden w-48 rotate-2 sm:block">
        <p className="mb-1 text-right text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          Then they text you
        </p>
        <p
          lang="zh-Hans"
          className="whitespace-pre-line rounded-2xl rounded-br-md bg-green-500 px-3 py-2 text-sm leading-snug text-white shadow-lg"
        >
          {reportZh}
        </p>
      </div>
    </div>
  );
}

const card =
  "rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md";
const stepBadge =
  "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white";
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
    <div className="min-h-dvh bg-white text-neutral-900">
      <PrototypeBanner />

      <nav className={`${container} flex items-center gap-6 py-4 text-sm`}>
        <Link href="/" className="text-base font-semibold tracking-tight">
          Phone lessons
        </Link>
        <div className="ml-auto hidden items-center gap-6 text-neutral-600 sm:flex">
          <a href="#how" className="hover:text-neutral-900">
            How it works
          </a>
          <a href="#lessons" className="hover:text-neutral-900">
            Lessons
          </a>
          <Link href="/editor" className="hover:text-neutral-900">
            Editor
          </Link>
          <a href={REPO_URL} className="hover:text-neutral-900">
            GitHub
          </a>
        </div>
      </nav>

      <section className="bg-gradient-to-b from-emerald-50 via-amber-50/50 to-white">
        <div
          className={`${container} grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_540px] lg:py-16`}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              For adult children helping an aging parent with their iPhone
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Show your parent a phone task once. They practice it on their own
              phone.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-600">
              You record the steps. Your parent gets a link, practices each step
              on pictures of the real screens, and is told exactly what went
              wrong (&ldquo;you held too long&rdquo;), in Chinese. When
              they&apos;re done, they text you back, or FaceTime you if
              they&apos;re stuck.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {featured && (
                <Link
                  href={featured.practiceHref}
                  className="rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-neutral-800"
                >
                  Try it as the parent →
                </Link>
              )}
              <a
                href="#make"
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 font-semibold hover:border-neutral-400"
              >
                Watch a helper make one (1½ min)
              </a>
              <a
                href="#lessons"
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 font-semibold hover:border-neutral-400"
              >
                Browse the sample lessons ↓
              </a>
            </div>
          </div>
          {featured && <HeroPhone featured={featured} reportZh={report.zh} />}
        </div>
      </section>

      <main className={`${container} pb-16`}>
        <section id="how" className="scroll-mt-6 pt-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            How it works
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            One family loop, four steps
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loop.map((s, i) => (
              <div key={s.title} className={`${card} flex flex-col p-6`}>
                <span className={stepBadge}>{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 leading-relaxed text-neutral-600">
                  {s.body}
                </p>
                <p className="mt-3 text-sm font-medium text-neutral-500">
                  {s.where}
                </p>
                {s.link && (
                  <Link
                    href={s.link.href}
                    className="mt-auto pt-5 font-semibold text-emerald-700 hover:underline"
                  >
                    {s.link.label}
                  </Link>
                )}
              </div>
            ))}
            <div className={`${card} flex flex-col p-6`}>
              <span className={stepBadge}>4</span>
              <h3 className="mt-4 text-lg font-semibold">They report back</h3>
              <p className="mt-1 text-neutral-600">
                One tap at the end texts you:
              </p>
              <p
                lang="zh-Hans"
                className="mt-2 whitespace-pre-line rounded-2xl rounded-bl-md bg-green-500 px-3 py-2 text-sm leading-snug text-white"
              >
                {report.zh}
              </p>
              <p className="mt-1 whitespace-pre-line text-xs text-neutral-500">
                {report.en}
              </p>
              <p className="mt-3 text-sm font-medium text-neutral-500">
                Or they tap 📹 to FaceTime you.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2 lg:items-start">
          {featured && (
            <div className={`${card} flex flex-col bg-neutral-50 p-6 sm:p-8`}>
              <h2 className="text-2xl font-semibold tracking-tight">
                Try a lesson as the parent
              </h2>
              <p className="mt-2 leading-relaxed text-neutral-600">
                Watch it once, then practice. Get a step wrong on purpose to see
                the feedback. At the end you&apos;ll see what the parent&apos;s
                &ldquo;I&apos;ve got it&rdquo; text to the helper looks like.
              </p>
              <div className="mt-6 flex items-center gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element -- static still */}
                <img
                  src={featured.thumb}
                  alt=""
                  className="h-56 w-auto rounded-[1.4rem] border-[6px] border-neutral-900 shadow-lg"
                />
                <div>
                  <p className="text-lg font-semibold">{featured.titleEn}</p>
                  {featured.titleZh && (
                    <p lang="zh-Hans" className="text-neutral-600">
                      {featured.titleZh}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-neutral-500">
                    {featured.steps} steps
                  </p>
                  <Link
                    href={featured.practiceHref}
                    className="mt-4 inline-block rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white hover:bg-neutral-800"
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

          <div id="make" className={`${card} scroll-mt-6 p-6 sm:p-8`}>
            <h2 className="text-2xl font-semibold tracking-tight">
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
            <ol className="mt-5 space-y-3">
              {MAKE_STEPS.map((s, i) => (
                <li key={s} className="flex gap-3 text-neutral-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-neutral-600">
              <Link
                href="/editor"
                className="font-semibold text-emerald-700 underline"
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
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Public library
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Lessons
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-neutral-600">
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
                  className="h-36 w-auto shrink-0 rounded-xl border-4 border-neutral-900"
                />
                <div className="flex min-w-0 flex-col">
                  <p className="text-lg font-semibold leading-snug">
                    {c.titleEn}
                  </p>
                  {c.titleZh && (
                    <p lang="zh-Hans" className="text-neutral-600">
                      {c.titleZh}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-neutral-500">
                    {c.steps} steps · recorded on {c.recordedOn}
                  </p>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Link
                      href={c.practiceHref}
                      className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium hover:border-neutral-400"
                    >
                      Practice
                    </Link>
                    <Link
                      href={c.shareHref}
                      className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      Share
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-20 flex flex-wrap gap-x-2 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
          <span>Open source (AGPL-3.0)</span>·
          <a href={REPO_URL} className="underline">
            GitHub
          </a>
        </footer>
      </main>
    </div>
  );
}
