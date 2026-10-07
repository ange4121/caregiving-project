import Link from "next/link";

/** Says plainly what's live and what isn't (CLAUDE.md: never present an unbuilt feature as working). */
export default function PrototypeBanner({
  tone = "light",
}: {
  tone?: "light" | "amber";
}) {
  return (
    <div
      role="note"
      className={`border-b px-4 py-2 text-center text-sm ${
        tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-sand/60 bg-peach text-navy"
      }`}
    >
      <b>Live prototype.</b> These lessons are real and work on any iPhone.
      Making a lesson currently runs on the author&apos;s own computer, so
      recordings never leave it.{" "}
      <Link href="/#how" className="underline">
        How it works
      </Link>
    </div>
  );
}
