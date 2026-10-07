"use client";

import { useEffect, useState } from "react";
import { recordedOn } from "@/lib/home";
import { lessonMetadata } from "@/lib/lesson/meta";
import type { Manifest } from "@/lib/lesson/types";
import ParentPhonePreview from "./ParentPhonePreview";
import {
  buildLessonLink,
  buildShareMessage,
  buildShareMessageEnglish,
  isValidContact,
  lacksCountryCode,
  normalizeContact,
  PARENT_NAMES,
  type ParentScript,
} from "@/lib/share";

/** Remembered on this device only, so the author doesn't retype it per lesson. */
const STORAGE_KEY = "share-form:v1";

interface Saved {
  parentName: string;
  parentNameEn: string;
  childName: string;
  contact: string;
  script: ParentScript;
}

/** For visitors: shows the preview without typing real details (555-01xx is a fictional range). */
const EXAMPLE: Saved = {
  parentName: "妈",
  parentNameEn: "Mom",
  childName: "小雨",
  contact: "+1 415 555 0123",
  script: "zh-Hans",
};

const EMPTY: Saved = {
  parentName: "妈",
  parentNameEn: "Mom",
  childName: "",
  contact: "",
  script: "zh-Hans",
};

/** The helper's saved details, or the example for a first-time visitor. */
function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EXAMPLE;
  } catch {
    return EXAMPLE;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure origins (e.g. the dev server over LAN IP).
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export default function ShareForm({
  manifest,
  stillSrc,
}: {
  manifest: Manifest;
  stillSrc: string;
}) {
  const [form, setForm] = useState<Saved>(EMPTY);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"message" | "link" | null>(null);
  const [canShare, setCanShare] = useState(false);

  // Client-only values: saved form, this site's address, Web Share support.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setForm(load());
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // The example number is fictional (555-01xx is reserved), so say so.
  const isExample =
    normalizeContact(form.contact) === normalizeContact(EXAMPLE.contact);

  const update = (patch: Partial<Saved>, remember = true) => {
    const next = { ...form, ...patch };
    setForm(next);
    setCopied(null);
    if (!remember) return; // Example details aren't saved over the helper's own.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: just don't remember.
    }
  };

  const link = buildLessonLink(origin, manifest.id, {
    lang: form.script,
    contact: form.contact,
    childName: form.childName,
  });
  const title =
    form.script === "zh-Hant" ? manifest.title_zh_hant : manifest.title_zh_hans;
  const message = buildShareMessage({
    script: form.script,
    parentName: form.parentName,
    title,
    link,
  });
  const messageEn = buildShareMessageEnglish({
    parentNameEn: form.parentNameEn,
    titleEn: manifest.title_en,
  });

  const contactOk = form.contact.trim() === "" || isValidContact(form.contact);
  const needsCountryCode = contactOk && lacksCountryCode(form.contact);
  const preset = PARENT_NAMES.find((p) => p.zh === form.parentName);

  const onCopy = async (what: "message" | "link") => {
    if (await copyText(what === "message" ? message : link)) setCopied(what);
  };

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-8 text-navy md:grid-cols-[1fr_320px]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-navy/60">
          Send a lesson
        </p>
        <div className="mt-3 flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static thumbnail */}
          <img
            src={stillSrc}
            alt=""
            className="h-28 w-auto rounded-lg border border-sand/60"
          />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              {manifest.title_en}
            </h1>
            <p className="mt-1 text-navy/75">
              {manifest.steps.length} steps · recorded on {recordedOn(manifest)}
            </p>
            <a
              href={`/l/${manifest.id}`}
              className="mt-2 inline-block text-navy underline decoration-coral decoration-2 underline-offset-4"
            >
              Try it yourself
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => update(EXAMPLE, false)}
          className="mt-6 rounded-full border border-sand px-3 py-1.5 text-sm hover:bg-peach/60"
        >
          Just looking? Use example details
        </button>

        <section className="mt-6 space-y-6">
          <Field
            label="What do you call your parent?"
            hint="Starts the message."
          >
            <div className="flex flex-wrap gap-2">
              {PARENT_NAMES.map((p) => (
                <Chip
                  key={p.zh}
                  active={form.parentName === p.zh}
                  onClick={() =>
                    update({ parentName: p.zh, parentNameEn: p.en })
                  }
                >
                  {p.zh} <span className="text-navy/60">({p.en})</span>
                </Chip>
              ))}
              <input
                value={preset ? "" : form.parentName}
                onChange={(e) =>
                  update({
                    parentName: e.target.value,
                    parentNameEn: e.target.value,
                  })
                }
                placeholder="Other"
                className="h-11 w-36 rounded-full border border-sand px-4"
              />
            </div>
          </Field>

          <Field
            label="What does your parent call you?"
            hint='Shown on their help button: "FaceTime 打给 ___". E.g. 小雨, 女儿 (daughter), 儿子 (son).'
          >
            <input
              value={form.childName}
              onChange={(e) => update({ childName: e.target.value })}
              placeholder="小雨"
              className="h-12 w-full rounded-xl border border-sand px-4 text-lg"
            />
          </Field>

          <Field
            label="Your phone number or Apple ID email"
            hint="Their two buttons at the end text you or FaceTime you. It travels inside the link only; it's never stored on the server."
          >
            <input
              value={form.contact}
              onChange={(e) => update({ contact: e.target.value })}
              placeholder="+1 415 555 0123"
              inputMode="email"
              autoComplete="tel"
              className={`h-12 w-full rounded-xl border px-4 text-lg ${
                contactOk ? "border-sand" : "border-red-500"
              }`}
            />
            {!contactOk && (
              <p className="mt-1 text-sm text-red-600">
                That doesn&apos;t look like a phone number or email.
              </p>
            )}
            {isExample && (
              <p className="mt-1 text-sm text-amber-700">
                Example number, not a real one (US 555-01xx numbers are reserved
                for fiction). Put in your own before sending.
              </p>
            )}
            {needsCountryCode && (
              <p className="mt-1 text-sm text-amber-700">
                Add your country code (e.g. +1) so FaceTime can find you.
              </p>
            )}
          </Field>

          <Field label="Which Chinese does your parent read?">
            <div className="flex gap-2">
              <Chip
                active={form.script === "zh-Hans"}
                onClick={() => update({ script: "zh-Hans" })}
              >
                简体 <span className="text-navy/60">(Simplified)</span>
              </Chip>
              <Chip
                active={form.script === "zh-Hant"}
                onClick={() => update({ script: "zh-Hant" })}
              >
                繁體 <span className="text-navy/60">(Traditional)</span>
              </Chip>
            </div>
          </Field>
        </section>

        <section className="mt-10 rounded-2xl border border-sand/60 bg-peach/60 p-5">
          <h2 className="font-semibold">Your message</h2>
          {isExample && (
            <p className="mt-1 text-sm text-amber-700">
              Example details. Put in your own before sending.
            </p>
          )}
          <p className="mt-3 whitespace-pre-wrap break-all text-lg leading-relaxed">
            {message}
          </p>
          <p className="mt-3 border-t border-sand/60 pt-3 text-navy/75">
            <span className="text-sm font-medium uppercase tracking-wide text-navy/60">
              In English
            </span>
            <br />
            {messageEn}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {canShare && (
              <button
                onClick={() =>
                  navigator.share({ text: message }).catch(() => {})
                }
                className="h-12 flex-1 rounded-xl bg-navy font-semibold text-white"
              >
                Share…
              </button>
            )}
            <button
              onClick={() => onCopy("message")}
              className={`h-12 flex-1 rounded-xl font-semibold ${
                canShare ? "border border-sand bg-white" : "bg-navy text-cream"
              }`}
            >
              {copied === "message" ? "Copied ✓" : "Copy message"}
            </button>
            <button
              onClick={() => onCopy("link")}
              className="h-12 flex-1 rounded-xl border border-sand bg-white font-semibold"
            >
              {copied === "link" ? "Copied ✓" : "Copy link only"}
            </button>
          </div>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-navy underline decoration-coral decoration-2 underline-offset-4"
          >
            Open the link as your parent will see it
          </a>
        </section>

        <p className="mt-6 text-sm text-navy/60">
          You send it yourself, from iMessage, WeChat, or WhatsApp. This app
          never messages your parent.
        </p>
      </div>

      <aside className="md:sticky md:top-8 md:self-start">
        <ParentPhonePreview
          from={form.childName.trim() || "Your child"}
          body={message.slice(0, message.lastIndexOf("\n"))}
          link={link}
          cardTitle={lessonMetadata(manifest).title}
          cardImage={stillSrc}
        />
      </aside>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-lg font-semibold">{label}</label>
      {hint && <p className="mb-2 text-sm text-navy/75">{hint}</p>}
      {!hint && <div className="mb-2" />}
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-11 rounded-full border px-4 ${
        active
          ? "border-navy bg-navy text-cream [&_span]:text-sand"
          : "border-sand bg-white"
      }`}
    >
      {children}
    </button>
  );
}
