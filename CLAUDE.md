# CLAUDE.md

> Working name: **TBD**. Built for the Assembly Code Incubator, Cohort 02 (caregiving). Application due **Oct 7, 2026**. Code is open source under **AGPL-3.0**.
>
> **Application goal:** show something promising and in progress, not finished. Build what captures the essence first: a parent practicing a real lesson and getting specific feedback, sent by and reported back to the child. Polish and breadth come later.

## What this is

A tool that lets an adult child turn an iPhone screen recording into a short phone lesson their aging parent can **practice**, with feedback on their specific mistake, in Chinese, shared as a link.

**Thesis:** Immigrant parents are losing independence because essential life now runs through phones, portals, and paperwork in a second language. The trusted helper is their adult child, who has no tools.

**What lasts (build around these):**
1. **The trusted family channel.** The child makes or picks the lesson, sends it, and sees how it went. AI and platforms can guide; they can't be the person the parent trusts.
2. **Practice with feedback.** The parent does the action on real screens and is told exactly what went wrong ("you held too long"), not just "try again."

The editor is how lessons get made. Practice is what's new. The family is what lasts.

## Landscape (why this doesn't exist yet)

Full research, reasoning, and sources: `docs/market-research.md`. Summary:


- **Apple FaceTime (iOS 18+):** screen share, Ask to Share, drawing, remote control. Live only. Asking a parent to understand Ask to Share, screen sharing, and drawing is itself a hurdle. Nothing is saved or practiced, and doing it for them via remote control teaches nothing.
- **Apple Tips app:** a few gesture practice screens; no library of everyday iPhone skills, no feedback on specific errors.
- **Be Connected (Australian government):** a strong topic library, but built like a course catalog (Totara LMS, enrolment, completion criteria). Generic device, separate practice area. It recognizes helpers ("Help others", "Young mentors") but gives them content, not tools.
- **UrMorning:** AI replaces the family helper. English-first.
- **Chinese Android phones (Huawei, Xiaomi, OPPO):** family remote help built into the OS. Live only, Android only.
- **Scribe / Tango:** prove the "recording → step guide" format, but they're SOP tools for employees on desktop. Not this audience.

## Users

- **Author (adult child).** Records on their iPhone, edits on a laptop. English-first. Controls everything that gets sent.
- **Learner (parent).** iPhone. Reads Chinese (Simplified or Traditional). Their apps may be in English. No account, no app install. Opens links from iMessage, WeChat, or WhatsApp.

## Product principles (these break ties)

1. **The child is in control.** The app never messages the parent. It prepares text and links; the child sends them.
2. **The parent never sees a catalog.** One link = one task.
3. **Practice, not watching.** Every lesson can be practiced, not just viewed.
4. **Feedback names the specific error.**
5. **Manual first, AI optional.** Every core flow works with zero AI.
6. **Explanation only when needed.** Concept help attaches to the step that needs it; never a course up front.
7. **Privacy by construction.** Blur is burned in. Raw recordings never leave the author's laptop.
8. **Pace belongs to the learner.** Nothing advances without the learner's action.

## MVP scope (Oct 7)

### Must have

**1. Practice mode (the hero)**
- For each step: show the step's still, prompt in Chinese (e.g., `点一下 "Sign in"`), take the learner's gesture on the still.
- Every still is shown **inside a drawn phone frame** with margins on all sides (like Apple Tips' "Practice Key Gestures"). This keeps the learner's finger away from the real screen edges, where Safari's edge-swipe-back and the iOS home gesture would fire.
- Check **position** and **gesture type** (tap / hold / swipe + direction) with the shared classifier. A touch hits the target if its distance from the target is ≤ `max(60 CSS px, target_radius × displayed still width)`.
- Correct → brief confirmation, then play the clip to the next step.
- Wrong → **touch replay** (dot where she touched, trail if she moved, ring showing how long she held) + one sentence naming the error + **ghost finger replayed from where she actually touched**. Hint ladder on repeated misses: (1) region hint, (2) target pulse, (3) replay the author's clip.
- System-gesture steps (e.g., swipe down from top-right for Control Center) let the swipe start on the drawn phone's bezel, so the learner swipes from the picture's edge, not the real screen edge.
- **"Do it yourself" steps** (gesture `self`): for actions we don't check, like typing a password or Face ID. Show the still, the caption, and "看一遍" (replay the clip); the learner taps "我做好了" (I've done it) to continue. No gesture checking.
- End screen: two buttons, both going straight to the child. The child's number travels in the link's `#fragment` (added by the author when sharing), so it never reaches the server or the repo.
  - **"我会了" (I've got it)** opens Messages to the child's number with a ready-written text, e.g. "我练完了：登录 Chase ✓（第3步按太久2次）". The parent just taps send. This closes the "child sees how it went" loop with no server, and the app still never messages anyone by itself.
  - **"我需要帮助" (I need help)** starts a FaceTime video call to the child (`facetime:`). The label says what will happen, e.g. "📹 我需要帮助 — 用 FaceTime 打给小雨" (child's name from the link fragment, falling back to "孩子"). iOS shows a one-tap "Call / Cancel" confirmation, then the call starts. The child can decline and call back. No figuring out how to get to FaceTime.
  - If WeChat's in-app browser blocks these links, show "点右上角 ⋯，用 Safari 打开" (open in Safari). Check this early.

**Error feedback (starting copy, to be reviewed by a native reader):**

| She did | Intended | Feedback |
|---|---|---|
| Pressed ≥ 600 ms | Tap | 你按得太久了，像按门铃一样，碰一下就放开 |
| Moved ≥ 15 px | Tap | 手指动了一点，放轻松，点下去就抬起来 |
| Lifted before ring filled | Hold | 再按久一点，等圆圈满了再放开 |
| Moved while holding | Hold | 按住的时候手指不要动 |
| Held but didn't move | Swipe | 你按住了，但手指没有移动。按住以后要往这边滑 |
| Moved 15–40 px (too short) | Swipe | 滑得再长一点，往这边滑 |
| Moved the wrong way | Swipe | 方向反了，往这边滑 |
| Right gesture, wrong place | Any | 位置不对，再看看屏幕 (then region hint) |

**2. Watch mode**
- Still + caption → "看一遍" (replay clip) / "下一步" (next). Same player, no gesture checking.

**3. Annotation editor (desktop, limited)**
- Load a local recording (object URL; never uploaded).
- Scrub and pause; **annotate by doing** on the paused frame: click = tap, press-and-hold = hold, drag = swipe (direction recorded).
- Three checked gesture types, plus a "do it yourself" step (no gesture; e.g., type your password). Per-step "system gesture" checkbox (lets the swipe start on the drawn bezel).
- Caption template: gesture + element label → `Tap "Sign in"`. Optional short note. English only; the author is not asked to write Chinese.
- Redaction boxes: a rectangle attached to a step; applies from that step until the next. **Pixelated, not blurred** (blurred text can sometimes be read back). Before export, the author reviews the output with boxes applied, including the clips between steps.
- **Side-by-side preview** for the selected step: the author's view (English caption) next to the parent's view (the still in the phone frame with the Chinese prompt, exactly as the player renders it). Reuses the player component.
- Delete a step. No reorder, no undo history.
- Export `lesson.json`.

**4. Publish script (local, native ffmpeg)**

`npm run publish-lesson -- --video <path> --lesson <lesson.json> --out public/lessons/<id>`
- Burns pixelation into the video; extracts one still per step; cuts one clip per step; generates captions (EN, zh-Hans, zh-Hant); writes `manifest.json`.
- **Clip N** runs from step N's `t_ms` to step N+1's `t_ms` (the last clip runs to the end of the video). It shows the step being done.
- Re-encodes for phones: H.264, about 720 px wide (iPhone recordings are high-res HEVC, too heavy for a parent's data plan). The player uses `playsinline muted` so clips play inside the page, including in WeChat.
- Never writes the unredacted video into the repo.

**5. Chinese captions**
- Template = fixed Chinese verb + the on-screen English label verbatim: `点一下 "Sign in"`. **No Chinese gloss of the label in the MVP** (English first); AI-generated glosses come later (see Nice to have).
- Language switch in the player: EN / 简 / 繁, also settable with `?lang=en|zh-Hans|zh-Hant`. **Default is English while Shuxin tests (`DEFAULT_LANG` in `lib/i18n.ts`); switch it to `zh-Hans` before any lesson goes to a parent.**

**6. Demo lessons (made with the editor)**
- One app lesson: Chase login (confirmed Oct 2: Chase can be screen-recorded), pixelated.
- One or two iPhone basics (e.g., Wi-Fi from Control Center; switching to the Chinese keyboard).
- Each tagged with the iOS version it was recorded on.

**7. Share text**
- After publish, a copy button for a bilingual message + link, e.g. "妈，我给你做了一个小练习：怎么登录 Chase。有空的时候点开试试。[link]"

### Nice to have (in this order)
1. Fuller attempt detail in the report-back message (hints used, press durations per step).
2. AI translation via the Anthropic API (server-only route): Chinese glosses for element labels (`点一下 "Sign in"（登录）`) and free-text notes. The author reviews before publishing.
3. "我的屏幕不一样" (my screen looks different) button.
4. Concept cards linked from steps, pointing to Apple's official Chinese support pages. (e.g., "what is Control Center?")
4b. Just-in-time gesture intro: the first time a lesson asks for a swipe (or tap/hold), a short "this is a swipe: press, slide, lift" demo with a quick try, attached to that step. Not a course up front (principle 6); not a standalone sandbox (non-goal). Raised by Shuxin after testing, Oct 2.
5. "Jump to next screen change" (ffmpeg scene detection script → JSON the editor reads).

### Explicit non-goals for the MVP
- Standalone gesture sandbox (Apple Tips and Be Connected cover basics; our gesture feedback lives inside practice mode).
- Judgment lessons (scams, permission prompts). Roadmap only.
- Database, accounts, tokenized per-parent links, expiry/revoke.
- Checking drag, scroll, type, or pinch gestures (typing is covered by "do it yourself" steps).
- AI step suggestion. Reminders, collections, dashboards.
- Spaced repetition. The MVP is: child sends a link → parent does the lesson → parent reports back. Don't claim spaced repetition as built in the application; it's roadmap.
- Live screen share / remote control. A native iOS app.

## Architecture (MVP)

```
Author laptop                                          Demo deployment (Vercel, static)
─────────────                                          ────────────────────────────────
Editor (Next.js page, run locally)                     /l/[id]   parent player (Watch / Practice)
  load local video → annotate → export lesson.json       reads public/lessons/<id>/manifest.json
                     │
publish script (Node + native ffmpeg)
  blur, stills, clips, captions, manifest ──► public/lessons/<id>/ ──► git push ──► deploy
```

- Raw recordings stay on the laptop. Only redacted stills and clips are committed.
- Only commit lessons that are safe to be public. Keep others in gitignored `private-lessons/`.

### Stack
- Next.js (App Router) + TypeScript (strict) + Tailwind.
- Native ffmpeg (`brew install ffmpeg`) called from a Node script.
- Vercel (static pages + public assets).
- Anthropic API only for nice-to-have translation (label glosses, notes); server-side; key never on the client.

## Reuse before building

Prefer proven open-source tools over writing from scratch. Before building any major piece, research options in **plan mode** and recommend one (see "Working process"). Candidates to evaluate, not decisions:

| Need | Candidates to evaluate | Notes |
|---|---|---|
| Video processing (blur, stills, clips, scene detection) | Native ffmpeg called via `execa` or `child_process`; `ffmpeg.wasm` (in-browser); PySceneDetect (scene detection) | `fluent-ffmpeg` is a common wrapper; check whether it's still maintained before choosing it |
| Video playback / scrubbing in the editor | Native `<video>`; Vidstack; Video.js; Plyr | Native may be enough for an MVP |
| Drawing markers and blur boxes on frames | Konva / react-konva; Fabric.js; plain canvas | Check licenses: some popular whiteboard libraries use custom licenses |
| Timeline / editor scaffolding | Look for open-source browser video editors or annotation tools to borrow patterns from | Remotion is powerful but has its own license; check compatibility with AGPL before using |
| Gesture input in the editor | `@use-gesture/react`; plain Pointer Events | The learner-side classifier stays custom (thresholds + feedback are the product) |
| Feedback animation (ghost finger, rings) | Motion (formerly Framer Motion); CSS animations; Lottie | Keep it light for older iPhones |
| Simplified ↔ Traditional Chinese | `opencc-js` (OpenCC) | Avoids hand-maintaining two caption sets |
| i18n | `next-intl` or plain JSON + a small helper | |
| Testing | Vitest (unit); Playwright with WebKit (closest desktop proxy for iOS Safari) | Real-iPhone checks still required |

**License rule:** this project is AGPL-3.0. MIT, Apache-2.0, BSD, and GPL-family licenses are fine. Flag anything with a custom, source-available, or commercial license before adopting it.

## Lesson format

All coordinates are **normalized 0–1** relative to the video frame.

`lesson.json` (exported by the editor):
```json
{
  "id": "chase-login",
  "title_en": "Log in to Chase",
  "ios_version": "26.0",
  "video": { "width": 1170, "height": 2532, "duration_ms": 94000 },
  "steps": [
    {
      "index": 0,
      "t_ms": 3200,
      "gesture": "tap",
      "x": 0.51, "y": 0.62,
      "swipe_direction": null,
      "system_gesture": false,
      "target_radius": 0.06,
      "element_label": "Sign in",
      "note_en": "",
      "blur": [{ "x": 0.1, "y": 0.2, "w": 0.8, "h": 0.05 }]
    }
  ]
}
```

- `gesture`: `"tap" | "hold" | "swipe" | "self"`. `self` = "do it yourself" step; `x`, `y`, `target_radius`, and `swipe_direction` are `null`.
- `target_radius`: fraction of the frame **width**.
- `blur`: redaction boxes. The key keeps the name `blur`, but the publish script pixelates.

`manifest.json` (written by the publish script) adds per-step `still`, `clip`, `caption_en`, `caption_zh_hans`, `caption_zh_hant`.

## Gesture spec (starting thresholds; tune with real users)

| Gesture | Detection | Label | Visual |
|---|---|---|---|
| Tap | press < 500 ms, movement < 15 px | 点一下 | single pulse |
| Hold | press ≥ 600 ms, movement < 15 px | 长按 | ring filling around the finger |
| Swipe | movement ≥ 40 px, direction by angle | 滑动 | arrow with motion trail |

- 500–600 ms is an ambiguous band: accept as a tap but log it (the accidental-hold signal). The "pressed too long" error fires only at ≥ 600 ms.
- 15–40 px of movement: a "moved a little" error when a tap was intended; a "too short" error when a swipe was intended.
- One shared classifier module (`lib/gesture/`), pure functions, fully unit-tested.

## Mobile Safari rules for any practice surface

- `-webkit-touch-callout: none` (otherwise a hold opens "Save Image")
- `user-select: none; -webkit-user-select: none`
- `touch-action: none` (no scroll, no double-tap zoom)
- Pointer Events; `preventDefault` on `pointerdown` inside the surface
- Viewport meta with `viewport-fit=cover`; respect safe-area insets
- Stills always sit inside the drawn phone frame with side margins (`touch-action: none` does not stop Safari's left-edge swipe-back)
- Video: `playsinline muted`, H.264

**Browsers:** on US iPhones every browser uses WebKit, so behavior matches Safari. **Test inside WeChat's in-app browser** early. If something fails there, show: "点右上角 ⋯，用 Safari 打开".

**Testing:** develop on desktop (Pointer Events work with a mouse), but check practice mode on a real iPhone via the Vercel preview at least every other day; finger timing and drift differ from a mouse.

## Learner UI rules

- Base font ≥ 20 px; captions ≥ 24 px; buttons ≥ 60 px tall, full width.
- One step per screen; progress as "第3步，共7步".
- High contrast; no hover-dependent UI.
- Learner strings in `/locales/zh-Hans.json` and `/locales/zh-Hant.json`; author strings in `/locales/en.json`.
- Never show error codes to the learner; show a calm message and the help button.

## Build plan

Sequencing only, no day counts. Build the essence first (practice + feedback + the family loop), then the tools that make lessons cheap to produce. Each stage should leave something demoable.

### 1. Setup
- `LICENSE` (AGPL-3.0), Next.js + TypeScript + Tailwind, ESLint/Prettier, `brew install ffmpeg`, Vercel project linked to the repo.
- Safari Web Inspector (iPhone → Settings → Safari → Advanced → Web Inspector; Mac Safari → Develop).
- Fixtures: a few real iPhone screen recordings, kept outside the repo; gitignore `fixtures/` and `private-lessons/`.
- Tooling choices are made just in time: before each piece, one short comparison and a recommendation, logged in `docs/decisions.md`.

### 2. Gesture classifier + practice surface (prove the hero)
- `lib/gesture/` classifier + unit tests (thresholds, ambiguous band, swipe direction, hit testing).
- A **hand-made test lesson**: a few stills pulled from a fixture with a one-off ffmpeg command, plus a hand-written `manifest.json` (one tap, one hold, one swipe).
- Practice surface inside the phone frame: gesture capture, touch replay, error feedback, ghost finger.
- Deploy preview; test on a real iPhone.
- **Exit criteria:** tap / hold / swipe classified correctly with a real finger; no Safari menus, zoom, or swipe-back; feedback reads clearly.

### 3. Full player + family loop (the end-to-end story)
- `/l/[id]`: Practice and Watch modes, hint ladder, clips between steps, "do it yourself" steps, Chinese caption templates + Simplified/Traditional toggle.
- End screen: "我会了" opens a text to the child; "我需要帮助" starts a FaceTime call to the child.
- Share text + link for the child.
- At this point the whole loop works on a hand-made lesson: send link → practice → report back.

### 4. Publish script
- `publish-lesson`: pixelate, stills, clips (H.264, phone-sized), captions, manifest.
- Works from a hand-written `lesson.json`, so real lessons (Chase login) can be published before the editor exists.

### 5. Annotation editor
- Load local video, scrub, pause; annotate by doing; system-gesture checkbox; "do it yourself" steps; labels and captions; redaction boxes; delete; export `lesson.json`.

### 6. Demo lessons + testing
- Chase login and 1–2 iPhone basics, made with the editor; tag iOS version.
- Test with yourself, your parents if available, and friends. Send via iMessage and WeChat.
- Note: completed without a call? which step and which error? how long did it take to make the lesson? did they then do it in the real app?

### 7. Application
- Short video: you make a lesson → your parent practices and gets specific feedback → reports back → does it in the real app. Show what's working; describe the rest as in progress.
- Written answers; the demo deployment is the prototype link.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run build
npm run lint
npm run test         # Vitest, once
npm run test:watch
npm run format       # Prettier
npm run publish-lesson -- --video <path> --lesson <lesson.json> --out public/lessons/<id>
```

- **Next.js 16** has breaking changes from older versions. Before writing Next.js code, check the bundled docs in `node_modules/next/dist/docs/` (see `AGENTS.md`).
- `npx tsc --noEmit` needs a `next build` (or `next dev`) first, which generates route types like `LayoutProps`.
- npm 10.9 hits an installer bug (`reading 'edgesOut'`) when adding some packages; `npx npm@11 install …` works around it.

## Code map

- `app/l/[id]/page.tsx`: the learner's lesson page; statically built for every folder in `public/lessons/`.
- `app/share/[id]/page.tsx` + `components/share/ShareForm.tsx`: the author's "Send a lesson" page. Builds the parent's link and the message to paste into iMessage/WeChat; remembers the form in this browser's localStorage only.
- `lib/report.ts`: the end-screen text the parent sends ("我练完了… 第2步试了3次（放手太早）" + English), plus `sms:` / `facetime:` links.
- `lib/share.ts`: link fragment (`#lang=…&to=…&me=…`), contact checks, message templates (zh-Hans, zh-Hant, plus English for the author).
- `app/page.tsx`: lesson list with Try / Send.
- `components/practice/`: `PracticePlayer` (step flow, hint ladder, feedback text), `PracticeStage` (phone frame, pointer capture, iOS touch blocking), `overlays` (touch replay, ghost finger, hints, hold ring).
- `lib/lesson/`: manifest types and server-side loading.
- `locales/`: learner strings (zh-Hans, zh-Hant).
- `scripts/publish-lesson.ts` + `scripts/publish/plan.ts`: the publish script (runs ffmpeg via `child_process`; `plan.ts` holds the tested time ranges and filter graph). Pixelates everything in one pass to a temp video outside the repo, then cuts stills and clips from it.
- `lib/captions.ts`: caption templates (EN, zh-Hans, zh-Hant) from gesture + label.
- `public/lessons/control-center-wifi/`: test lesson (swipe / hold / tap), now produced by the publish script. Its `lesson.json` lives in `fixtures/` (gitignored) next to the recording.
- `lib/gesture/`: the shared classifier. `classifyGesture` (tap / hold / swipe / wobble), `evaluateAttempt` (step + attempt → ok or one error code), hit testing and coordinate mapping. Thresholds live in `thresholds.ts`.

## Testing priorities

- Unit tests: gesture classifier, caption templates (EN, zh-Hans, zh-Hant), normalized coordinate mapping, hit testing with tolerance.
- Real iPhone: practice mode in Safari and WeChat.
- Never commit fixtures, unredacted video, or unredacted stills.

## Post-MVP roadmap (do not build yet)

- **Family loop:** tokenized per-parent links with expiry/revoke; attempt events stored server-side; author view of progress; reminders to the author (the child sends; the app never messages the parent); spaced check-ins driven by performance; practice without hints.
- **Library:** open library of iPhone basics (getting unstuck, Control Center, Settings, keyboards, screen recording), tagged by iOS version; assignable by the child; ordered path on the author side only.
- **Reverse direction:** native iOS broadcast extension for one-tap "record and send to my child"; author annotates the parent's own recording.
- **Judgment lessons:** scam texts, permission prompts, pop-ups, using the same player with choice buttons.
- **Concept cards and an icon glossary** in Chinese.
- **Class mode** for libraries and senior centers: a volunteer runs a session where each senior practices the same lessons on their own phone and the volunteer sees who's stuck.
- **Read-aloud** of captions and feedback (Mandarin, Cantonese) for parents who don't read comfortably.
- More gestures; storage via Supabase or in-browser processing via ffmpeg.wasm.

## How to work with Shuxin

**Who I am as a builder.** I'm familiar with some technical concepts and have built things before, but my strength is product thinking: understanding user problems and deciding what matters. I'm actively learning to be a better builder. Work with me accordingly.

**Explain as you go, at the right depth.**
- Before and after meaningful changes, explain in plain language what you're doing and why, so I build a mental model of how the system works.
- When there's a technical choice, lay out the main options (2–3), what each is good and bad at, and **your recommendation**. Then let me decide.
- Stay at the level of concepts and trade-offs. Don't go deep into the weeds unless I ask; offer to go deeper instead.
- Define unfamiliar terms briefly the first time they come up.

**Be a thought partner, not just an executor.**
- Take my direction, but tell me if you see a sharper idea, a simpler path, a risk I'm missing, or a place where the product could be better.
- Tell me what's possible that I might not know about (a library, a browser capability, a cheaper approach).
- If something I ask for conflicts with the principles or scope in this file, say so plainly before building.
- Be direct and concise. No filler, no excessive hedging.

## Working process

- **Plan mode first** for anything larger than one file: propose the approach, the files you'll touch, and open questions. Expect several plan iterations before coding.
- **Research before building:** for each major piece, check "Reuse before building," compare options, and recommend. Don't silently pick a library.
- **Small, reviewable steps.** One feature at a time; summarize what changed and how to test it.
- **Decision log:** record every meaningful decision in `docs/decisions.md` (date, decision, options considered, why).
- **Keep this file current:** update scope, lesson format, and the build plan here whenever they change, and tell me what you changed.

## Rules for Claude (working in this repo)

- Stay inside MVP scope. If a task pulls toward a non-goal or nice-to-have, say so and ask before building it.
- Do not put AI in any core path.
- Ask before adding a dependency, and state its license.
- Never commit or log raw recordings, unredacted stills, or personal lesson content.
- Mobile Safari (and WeChat's in-app browser) is the learner's environment. Check learner-facing changes against the Safari rules.
- `docs/market-research.md` explains why the product is shaped this way; read it before proposing product changes.

## Open questions

- Working name.
- Final Chinese caption templates, feedback copy, and report-back message (native reader review).
- Which demo lessons are safe to publish after redaction.
- Are stills big enough on a real phone once they're inside the phone frame? Check during stage 2.
