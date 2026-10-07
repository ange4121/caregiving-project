# Decision log

Newest first. Each entry: date, decision, options considered, why.

## 2026-10-07 — Back to a short, plain hero

- The visual hero (phone mock with floating feedback and report cards, coloured wash) read as too much of a sales pitch. Returned to the short hero (headline, one paragraph, three buttons) followed directly by the four steps. Kept the wider layout, top nav, green accents, and card styling.

## 2026-10-06 — Home page design pass

- Wider layout (max ~1280 px) so wide screens don't show big empty margins.
- Hero shows the product before any reading: the real Wi-Fi lesson in a phone, with floating cards for the specific-mistake feedback and the parent's "I've got it" text (built by the same code as the real ones).
- One accent colour (green, echoing the report-back bubble) for step numbers, labels, and links; a soft green-to-warm wash behind the hero; everything else black on white.
- A simple top nav (How it works, Lessons, Editor, GitHub); cards share one style with a light hover shadow. Wording and links unchanged.

## 2026-10-06 — Home page: walk the loop, not just read it

- The loop strip is now four steps (record → **send** → practice → report back); "send" was missing, and it's where the family channel shows. Each step links to where a visitor can see it: the Loom, the share page, the lesson demo.
- Step 4 shows the actual report-back text a parent sends, built by the same code as the lesson's end screen, so visitors see the payoff without finishing a lesson.
- Top buttons say what happens: "Try it as the parent →", "Watch a helper make one (1½ min)", and "Browse the sample lessons ↓".

## 2026-10-06 — Say plainly that making lessons needs a developer setup

- "Runs on the helper's laptop" implied any helper could do it. Today it needs Node.js, ffmpeg, this repo, and `npm run dev`, and publishing only writes into that copy. The site now says "runs on the author's computer for now (a developer setup with Node.js and ffmpeg)" in the banner, home page, and editor, linking to the README's "Make a lesson" section. Any helper can still send public lessons with no setup.

## 2026-10-06 — Share page defaults; shorter message

- First-time visitors to a share page see example details filled in, labelled "Example number, not a real one". The example uses +1 415 555 0123: US 555-0100–0199 numbers are reserved as fictional, unlike an arbitrary number in a real area code (e.g. 341), which could belong to someone a demo link would FaceTime.
- Removed "做错了也没关系 / It's fine to make mistakes" from the share message at Shuxin's request.
- Home page: the "Try a lesson" card no longer stretches to the height of the video card beside it.

## 2026-10-06 — Text size lesson, timed pixelation boxes, Loom on the home page

- **Text size** was made live in the editor on the Loom recording (6 steps, trimmed end). Before publishing publicly it was re-published with pixelation for the city on the home screen and, for ~2 s, the account name and home network shown at the top of Settings.
- **Pixelation boxes can carry a time window** (`from_ms` / `to_ms`). Covering a whole step would have blocked the home-screen picture to hide a name that appears only as Settings opens. No editor UI for windows yet; set in `lesson.json`.
- **Loom walkthrough** embedded on the home page (`HELPER_VIDEO_EMBED`).
- **Editor "Start over"** clears the editor for a fresh lesson (one confirmation; no backup).

## 2026-10-06 — Trim and cut in the editor

- **Cuts are stored, not applied to the recording:** `lesson.cuts = [{start_ms, end_ms}]` in original time. Considered re-encoding a trimmed copy of the recording first, but that would shift every step already marked and needs the laptop helper just to edit. Stored cuts keep marked steps where they are and work on the live site too.
- **Publishing:** pixelation runs in original time, then ffmpeg `select` drops cut frames and `setpts` renumbers them; step times are mapped to the cut video for stills and clips (`toOutputTime`). Verified on the keyboard recording: 25.2 s → 20.0 s with identical stills.
- **Editor:** trim start, trim end, and cut a section (start, then end); red stripes on the timeline; playback jumps over cuts; a label when scrubbing inside one; suggested moments inside a cut count as skipped; a step inside a cut blocks Publish.

## 2026-10-06 — Vault framing, no scam content, iPhone model labels

- **Helper side is a vault, not a gradebook:** the parent's report is a signal for what to resend, not a score. Roadmap reworded (removed "author view of progress" and "check-ins driven by performance").
- **No scam or judgment content of any kind.** The general lessons are everyday tasks (joining Wi-Fi, text size, keyboards).
- **Public library vs private vault:** anything generalizable the author makes is public, like a password manager's learning articles for its users; a helper's own lessons (account-specific, or specific to how their parent's phone works) stay in their private vault.
- **Lessons record the iPhone model** (`iphone_model`, optional) alongside the iOS version; library cards and the share page say "recorded on iPhone … · iOS …", because screens and gestures differ by model. The editor has an iPhone field next to iOS.

## 2026-10-06 — Demo lessons drafted; editor can open a draft

- **Text size** (22.7 s, the shortest recording) is kept for the live editor walkthrough in the Loom. **Get onto Wi-Fi** (7 steps) and **Switch to the Chinese keyboard** (4 steps) were drafted from the recordings (auto-found moments + frame-by-frame checks) and published locally for review. Drafts live in `fixtures/<id>.lesson.json` (git-ignored).
- **Privacy in the Wi-Fi recording:** the Apple account name flashes for ~0.3 s as Settings opens; network names appear in lists, the selected row, and the "Join" sheet title as it slides in and out. Boxes cover the whole range of the affected steps (boxes can't yet be limited to part of a step), checked frame by frame at 15–30 fps. The keyboard recording's private Notes titles appear before step 1, so no still or clip includes them.
- **Editor "Open draft":** loads a `lesson.json` into the editor (after loading the matching recording) so a drafted lesson can be reviewed, adjusted, and re-published. `parseLessonJson` in `lib/editor/draft.ts`, tested.

## 2026-10-06 — Make the live site self-explanatory

Goal: a stranger understands the whole loop in two minutes without installing anything. Built in this order:

1. **"Live prototype" label** on the home, share, and (live-site) editor pages: lessons are real; making a lesson runs on the helper's laptop. The editor asks the server once whether the local helper exists (`GET /api/local/recording`; 404 on Vercel) and, if not, explains what works on the live site and what needs the laptop.
2. **Demo mode** (`?demo=1`, used by every home-page link): the family loop was invisible to visitors because the end-screen buttons need the helper's number from a share link. In demo mode the buttons stay and open an explanation instead; "I've got it" shows the exact report text the helper would receive. A real share link (with a contact) is never a demo.
3. **Lesson page on a laptop:** phone-width column plus a visitor side panel ("You're seeing what the parent sees", how to practice with a mouse, Chinese via 简/繁, a QR code to open it on a phone). Hidden on phones and on real share links. Chosen over embedding the lesson in the home page (an iframe): same clarity, no nested scrolling or flaky touch inside an embedded page.
4. **Home page:** who it's for, the three-step loop, two entry points ("Try a lesson as the parent" in demo mode / "See how a helper makes one"), and the lesson library folded in as cards with Practice and Share. A separate library page waits until there are more than ~6 lessons. The walkthrough video slot (`HELPER_VIDEO_EMBED` in `lib/site.ts`) stays empty until the Loom exists, so nothing unbuilt is shown as working.
5. **Share page:** a phone-shaped preview of the message as the parent receives it (chat bubble + link card), and "Just looking? Use example details" (fictional 555 number, not saved over the helper's own details).
6. **Link previews** (Open Graph): lessons advertise their Chinese title and first screen, so the card in iMessage/WeChat looks right for real parents too. `metadataBase` comes from `NEXT_PUBLIC_SITE_URL`, else Vercel's production URL, else caregiving-project.vercel.app.

- **New dependency:** `qrcode` (MIT) + `@types/qrcode` (MIT). Generates the QR as SVG in the browser.
- **Tests:** `lib/lesson/url.test.ts` (demo flag, share links), `lib/lesson/meta.test.ts` (link previews), `lib/home.test.ts` (library cards), `components/site/HomeView.test.tsx` and `components/share/ParentPhonePreview.test.tsx` (rendered pages). Vitest now also runs `components/**/*.test.tsx`.

## 2026-10-06 — Thesis update: a toolkit for the helper; live site must explain itself

- **Thesis:** this is a toolkit for the helper (an adult child helping an aging immigrant parent), not a digital-literacy curriculum. Core loop: record → editor finds steps → publish → parent practices with feedback → reports back or calls. Lessons are made just in time for the exact task a parent is stuck on, and resent when needed.
- **Two kinds of lessons:** private (account-specific, e.g. a bank; stays in the family, never on the live site) and open library (general tasks; public). The library is the helper's catalog of "here's how to explain this thing", holding both just-in-time lessons and general basics. The parent still only ever gets one link per task.
- **Demo lessons for the live site:** getting onto Wi-Fi, making text bigger, switching to the Chinese keyboard. All open-library, nothing private on screen. Replaces "Chase login + basics": Chase would be a private lesson.
- **Current priority:** make the live site self-explanatory for a first-time visitor in two minutes (home page with "try as the parent" / "see how a helper makes one", a "live prototype" label, a library page, a share preview). Shown honestly: authoring runs on the author's laptop.
- **Default language stays English** on the site so reviewers can follow the demo; links sent from the share page open in Chinese (`#lang=`). Replaces the earlier "switch the default to Chinese before parents use it".
- **Off-thesis:** scam/judgment lessons, WeChat video export, and (for now) accounts and in-browser publishing. Removed from the roadmap.
- **Concept cards:** moved to "on-thesis, later" at low priority. Worth doing if they're easy to attach to a step; not a focus now.

## 2026-10-04 — Pixelation boxes, clips, Watch mode

- **Editor pixelate mode:** a "Mark steps / Pixelate" switch. Drag a box over private info; it belongs to the step whose range you're in (that step → the next step). The editor previews with a blur (`backdrop-filter`); publishing pixelates. "Copy to step N+1" for info that stays on screen. Boxes before the first step aren't needed (no still or clip covers that time).
- **Clips in Practice:** after a correct step, a short green check (0.7 s), then the step's clip plays over the still, then the next step. "Do it yourself" steps play their clip after "我做好了".
- **Hint level 3:** after 3 misses, "▶ 看一遍" plays the clip and returns to the same step.
- **Start screen + Watch mode:** the learner chooses watch first or practice. Watch mode demonstrates each step with the ghost finger, then plays the clip and keeps its last frame; the learner taps Next (principle 8: nothing advances on its own).
- If a clip can't play (autoplay blocked, missing file) or stalls, the player moves on instead of getting stuck.
- **Last clip capped at 2.5 s** (was 4 s) so it ends on the result rather than on the author closing things.

## 2026-10-04 — Suggested moments + local helper + Publish button

- **Moment finding uses ffmpeg `freezedetect`** (screen still ≥ 0.4 s, then changes), not scene detection: scene scores missed small local changes like the Wi-Fi menu. Each freeze end is a suggested moment; the editor jumps to ~100 ms before the change.
- On the Control Center recording: 8 moments in ~5 s, including all 3 real steps; the rest are skips (loading finished, closing things).
- **Touch guess:** diff a small grayscale frame before the change against one ~130 ms after; a small changed area (iOS button highlight) gives a guessed point; a large change (swipe, new screen) gives none. Top 7% ignored (clock, recording pill). On the test recording the guesses landed on the hold and tap targets.
- **Review flow:** Enter = accept the guess as a tap; do the real gesture to override; S = not a step; Enter in the label field moves to the next pending moment.
- **Local helper:** the editor uploads the recording to the dev server on the same laptop (system temp folder), which runs ffmpeg for analysis and Publish. Guarded to dev + `localhost` only. The public deployment shows "works on your laptop" instead.
- **Publish button** writes `public/lessons/<id>/` and links to Try / Send; the author still reviews media and commits/pushes.
- Moved publish code from `scripts/` into `lib/publish/` so the CLI and the editor share it.

## 2026-10-02 — Editor, first pass

- **No libraries:** native `<video>` + an SVG overlay with Pointer Events. Konva/Fabric would be extra weight for dots, arrows, and rectangles.
- **Annotate by doing** uses the learner's classifier on the author's mouse: click = tap, press ≥ 600 ms = hold, drag ≥ 40 px = swipe. A 15–40 px wobble is rejected with a hint rather than guessed.
- A swipe starting within 6% of the frame edge is pre-ticked as "from the screen edge" (system gesture); the author can untick it.
- **Re-marking at the same moment (±50 ms) redoes that step's gesture** and keeps its label, note, and boxes. That's the "undo" for a bad mark.
- Clicking a playing video only pauses it (never marks).
- The draft (not the video) autosaves to localStorage; after a refresh the author reloads the same file to continue.
- Video loads by object URL; nothing is uploaded. Chrome and Safari on Mac play iPhone HEVC recordings; Firefox doesn't.

## 2026-10-02 — Publish script

- **Tools:** native ffmpeg called with Node's `child_process` (no wrapper library); `tsx` (MIT) runs the TypeScript script so it can share code with the app.
- **One redaction pass:** all pixelation boxes are applied to a temporary 720 px, 30 fps H.264 copy in the system temp folder; stills and clips are cut from that copy, so nothing unredacted reaches `public/`. The temp copy is deleted afterwards.
- **Boxes apply from their step until the next step** (last step: to the end). Block size ≈ width / 45.
- **Clips:** step N → step N+1, H.264, no audio, `faststart`; the last clip is capped at 4 s.
- **Captions:** fixed templates (`lib/captions.ts`); system-gesture swipes name the edge or corner (from x, y). Chinese pending native review. The player shows the English caption under the Chinese.
- Re-publishing clears old `step-*`, `clip-*`, and `manifest.json` first.
- Test lesson: about 6 s to publish; 3 stills ≈ 250 KB, 3 clips ≈ 620 KB total.

## 2026-10-02 — End screen and help button

- **"✓ 我会了，告诉{name}"** opens Messages to the child with a summary: lesson title ✓, then each step that took more than one try with the try count and her most common mistake, then the same in English. Clean run: "每一步都一次做对了".
- **"📹 我需要帮助，用 FaceTime 打给{name}"** opens FaceTime to the child.
- **Added a "📹 求助" (Help) button in the top bar during the lesson** (only when the link carries the child's contact): a parent stuck mid-lesson shouldn't have to finish to reach the child.
- Without a contact in the link (e.g., opened from the home page), only "再练一次" shows.
- In WeChat, a line under the buttons says to open in Safari if nothing happens; `sms:` / `facetime:` may be blocked there. Untested on a real device yet.

## 2026-10-02 — Share page

- `/share/<id>`: the child picks what they call the parent (妈 / 爸 / other), what the parent calls them, their phone or Apple ID, and Simplified or Traditional. Out comes the Chinese message + link, an English version for the child, and Copy / Share buttons.
- **The link carries the parent's language** (`#lang=zh-Hans`), so links the child sends open in Chinese even while the site default is English for testing.
- Contact and name live only in the link fragment and in the child's own browser (localStorage). Nothing is stored server-side.
- The message adds "做错了也没关系" ("it's fine to make mistakes") to lower the stakes. Needs native-reader review with the rest of the copy.
- Lesson manifests may carry optional `title_zh_hans` / `title_zh_hant` for the message; without them the message leaves the title out.

## 2026-10-02 — English default while testing

- The author can't read the Chinese yet, so the lesson page defaults to English for now, with an EN / 简 / 繁 switch at the top (also `?lang=`).
- Must flip `DEFAULT_LANG` to `zh-Hans` before sending lessons to parents.

## 2026-10-02 — Practice screen (stage 2)

- **No new dependencies.** Animations use the browser's built-in Web Animations API and CSS; no Motion/Lottie needed yet.
- **Feedback sequence on a miss:** her touch replays first (orange dot, trail, ring that fills for as long as she held; full ring = 600 ms), then the white ghost finger starts from where she touched, glides to the target, and does the right gesture.
- **Hint ladder:** 1st miss = feedback only; 2nd = dashed region spotlight; 3rd+ = yellow pulse on the exact target; a "wrong place" miss shows the region spotlight right away. Level 3 (replay the clip) waits for clips in stage 3/4.
- **Live hold ring:** on hold steps only, a white ring fills around her finger while she presses, so she can see when she's held long enough.
- **A new try interrupts feedback.** She never has to wait for an animation to finish (pace belongs to the learner).
- **Correct:** green check at the target, "做对了！", then the next step after about 1 second.
- Test lesson pixelates the Wi-Fi network name and the weather widget's city by hand.

## 2026-10-02 — Setup and gesture classifier

**Stack installed:** Next.js 16 + React 19, TypeScript (strict), Tailwind 4, ESLint 9 + Prettier, Vitest. All MIT / Apache-2.0.
- Vitest pinned to 4.1.11: 3.x has a moderate security advisory (fixed in 4.1.11); 5.x doesn't support Node 23, which this laptop runs.

**Classifier behavior (`lib/gesture/`).**
- Added a fourth internal kind, **wobble** (moved 15–40 px), so "moved a little" and "swipe too short" are distinct from a real swipe.
- "Moved" for tap/hold uses the farthest the finger got from where it started, not just where it lifted, so a finger that wanders and comes back still counts as moving.
- Swipe direction: the dominant axis wins (4 directions).
- **One error at a time, gesture first:** if both the gesture and the position are wrong, the learner hears about the gesture. Gesture errors are the specific, teachable ones.
- Position is judged where the finger first touched down (for swipes, where the swipe started).
- System-gesture swipes: a touch on the drawn bezel counts as touching the nearest edge of the still.

## 2026-10-02 — End-screen buttons go straight to the child; editor preview

- "我会了" opens Messages to the child's number with the report pre-filled (replaces the share-sheet idea: one less choice for the parent).
- "我需要帮助" starts a FaceTime call directly. The child can decline; the parent never has to find FaceTime.
- Editor shows the author's English view next to the parent's Chinese view for each step.

## 2026-10-02 — Scope review before building

**Application goal: promising and in progress, not finished.**
- Build the essence first (practice with specific feedback + the family loop), then the lesson-making tools.
- Build plan is a sequence, not a day-by-day schedule. Testing is with myself, my parents, and friends for now; no outside families yet.

**"我会了" reports back to the child (now a must-have).**
- Options: attempt log the author views (needs storage); server-side progress (needs a backend, out of scope); a share-sheet message the parent sends to the child.
- Chose the share-sheet message: it closes the "child sees how it went" loop with no server, and the app still never messages anyone by itself.

**"Do it yourself" step type (`gesture: "self"`).**
- Login lessons need typing and Face ID, which we don't check. These steps show the still, caption, and clip, and the learner taps "我做好了" to continue.

**English first for labels; no Chinese gloss in the MVP.**
- Captions: fixed Chinese verb + English label verbatim (`点一下 "Sign in"`). The author (English-first) isn't asked to write Chinese.
- AI-generated glosses and note translation come later as a nice-to-have, reviewed by the author.

**Pixelate instead of blur for redaction.**
- Blurred text can sometimes be read back; pixelation is safer. The `blur` key in `lesson.json` keeps its name.

**Every practice still sits inside a drawn phone frame.**
- Like Apple Tips' "Practice Key Gestures". Keeps fingers off real screen edges (Safari's swipe-back, the iOS home gesture). System-gesture steps let the swipe start on the drawn bezel.

**Spec fixes.**
- "Pressed too long" fires at ≥ 600 ms; 500–600 ms is accepted as a tap and logged.
- A swipe of 15–40 px gets a "too short" message.
- Hit test: distance ≤ `max(60 CSS px, target_radius × displayed still width)`; `target_radius` is a fraction of frame width.
- Clip N runs from step N to step N+1.
- Publish script re-encodes to H.264 at about 720 px wide; the player uses `playsinline muted`.
- The help contact travels in the link's `#fragment`, never on the server or in the repo.

**Verified:** Chase on iOS can be screen-recorded.

**Not building now:** spaced repetition. Don't claim it as built in the application.
