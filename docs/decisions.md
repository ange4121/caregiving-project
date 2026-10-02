# Decision log

Newest first. Each entry: date, decision, options considered, why.

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
