/**
 * The share message as it lands on the parent's phone: an incoming chat
 * bubble, then the link-preview card (the same title and first screen the
 * lesson page advertises to iMessage / WeChat).
 */
export default function ParentPhonePreview({
  from,
  body,
  link,
  cardTitle,
  cardImage,
}: {
  /** Who it's from, as the parent's phone would show it. */
  from: string;
  body: string;
  link: string;
  cardTitle: string;
  cardImage: string;
}) {
  let host = "";
  let shortLink = link;
  try {
    const u = new URL(link);
    host = u.host;
    // Phones show long links cut short; the details after # don't matter here.
    shortLink = `${u.host}${u.pathname}${u.hash ? "…" : ""}`;
  } catch {
    // Link not built yet (first render).
  }
  return (
    <figure className="mx-auto w-[300px]">
      <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-neutral-900 bg-white shadow-xl">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 pb-2 pt-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-300 text-lg">
            {from.slice(0, 1)}
          </div>
          <p className="mt-1 text-xs text-neutral-600">{from}</p>
        </div>
        <div className="space-y-2 px-3 py-4" lang="zh-Hans">
          <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-neutral-200 px-3 py-2 text-[15px] leading-snug">
            {body}{" "}
            <span className="break-all text-blue-600 underline">
              {shortLink}
            </span>
          </p>
          <div className="max-w-[85%] overflow-hidden rounded-2xl bg-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- static still */}
            <img
              src={cardImage}
              alt=""
              className="h-36 w-full object-cover object-top"
            />
            <div className="px-3 py-2">
              <p className="text-sm font-semibold leading-snug">{cardTitle}</p>
              <p className="text-xs text-neutral-500">{host}</p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-neutral-500">
        How it looks on your parent&apos;s phone
      </figcaption>
    </figure>
  );
}
