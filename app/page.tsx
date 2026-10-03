import Link from "next/link";
import { listLessonIds, loadManifest } from "@/lib/lesson/load";

export default async function Home() {
  const ids = await listLessonIds();
  const lessons = (await Promise.all(ids.map(loadManifest))).filter(
    (m) => m !== null,
  );

  return (
    <div className="min-h-dvh bg-white">
      <main className="mx-auto w-full max-w-xl px-5 py-10 text-neutral-900">
        <h1 className="text-3xl font-semibold">Phone lessons</h1>
        <p className="mt-2 text-lg text-neutral-600">
          Turn an iPhone screen recording into a lesson your parent can
          practice. Work in progress.
        </p>

        <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Lessons
        </h2>
        <ul className="mt-3 divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
          {lessons.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="font-semibold">{m.title_en}</p>
                <p className="text-sm text-neutral-600">
                  {m.steps.length} steps · iOS {m.ios_version}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/l/${m.id}`}
                  className="rounded-full border border-neutral-300 px-4 py-2"
                >
                  Try
                </Link>
                <Link
                  href={`/share/${m.id}`}
                  className="rounded-full bg-neutral-900 px-4 py-2 text-white"
                >
                  Send
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
