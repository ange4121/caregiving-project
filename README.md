# Phone lessons (working name)

An adult child turns an iPhone screen recording into a short lesson their aging parent can **practice** on their own phone, with feedback on their specific mistake, in Chinese, shared as a link. When they're done, the parent texts the helper back, or FaceTimes them if they're stuck.

**Live prototype:** https://caregiving-project.vercel.app

Built for the Assembly Code Incubator, Cohort 02 (caregiving). See [`CLAUDE.md`](CLAUDE.md) for the product spec and [`docs/`](docs) for research and decisions.

## What runs where

|                                                                      | Live site | Your laptop (`npm run dev`) |
| -------------------------------------------------------------------- | --------- | --------------------------- |
| Lessons: watch, practice with feedback, report back / FaceTime       | ✅        | ✅                          |
| Share page (link + message for the parent)                           | ✅        | ✅                          |
| Editor: mark steps by hand, pixelation boxes, download `lesson.json` | ✅        | ✅                          |
| Editor: find steps automatically, **Publish**                        | —         | ✅ (needs ffmpeg)           |

The live site only shows lessons committed to this repo. A new lesson goes online when you commit and push `public/lessons/<id>/`.

## Develop

Requires Node 20+ (tested on 23) and, for finding steps and publishing, ffmpeg (`brew install ffmpeg`).

```bash
npm install
npm run dev      # http://localhost:3000 (or the next free port)
npm run test     # unit tests
npm run lint
npm run build
```

- npm 10 sometimes fails to install packages (`reading 'edgesOut'`); `npx npm@11 install` works around it.
- `npx tsc --noEmit` needs a `npm run build` (or `npm run dev`) first.

## Make a lesson

For now this needs the developer setup under [Develop](#develop): Node.js, ffmpeg, and this repo running with `npm run dev`. (On the live site you can try marking steps by hand, but finding steps and publishing need this setup.)

1. Screen-record the task on your iPhone and copy the video to your laptop (keep recordings in `fixtures/`, which git ignores).
2. Run `npm run dev` and open the editor at **`http://localhost:<port>/editor`** in Chrome or Safari. It must be `localhost`: the editor's local helper refuses requests from other addresses.
3. Load the recording. Use **✂ Trim start / Trim end / Cut a section** to leave out waiting, loading, or mistakes (the recording itself isn't changed). Review the suggested moments (Enter = accept the suggested tap, S = not a step, or do the real gesture on the video), name each step, and switch to **Pixelate** to cover anything private.
4. Click **Publish**. Files land in `public/lessons/<id>/`.
5. **Check every picture and clip for anything private.** Everything in `public/lessons/` becomes public when you push. Keep family-only lessons out of the repo (`private-lessons/` is git-ignored).
6. Commit and push; Vercel redeploys. Send it from `/share/<id>`.

Command-line alternative: `npm run publish-lesson -- --video <path> --lesson <lesson.json> --out public/lessons/<id>` (the `lesson.json` format is in `CLAUDE.md`).

**Try a lesson on your iPhone during development:** with your phone on the same Wi-Fi, open `http://<your-mac's-ip>:<port>/l/<id>` (`ipconfig getifaddr en0` prints the IP). Local addresses starting `10.` or `192.168.` are allowed.

## Links

- `/l/<id>`: the lesson. `?lang=en|zh-Hans|zh-Hant` picks a language; `?demo=1` (used by the home page) shows what the end-screen buttons would do instead of doing it.
- Share links carry the parent's language and the helper's contact after `#` (`#lang=…&to=…&me=…`), which browsers never send to the server.

## Deploy your own copy

Import the repo into Vercel; no environment variables are required. Optional: `NEXT_PUBLIC_SITE_URL` sets the address used in link previews (defaults to Vercel's production URL). To show a walkthrough video on the home page, set `HELPER_VIDEO_EMBED` in `lib/site.ts`.

## License

[AGPL-3.0](LICENSE)
