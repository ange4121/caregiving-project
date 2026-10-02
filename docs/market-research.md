# Market research and rationale

*Compiled Oct 2026 while scoping the Assembly Code Cohort 02 (caregiving) application. A reminder of what we looked into and why this solution makes sense. Claims marked **[verify]** should be re-checked before citing them in the application.*

---

## 1. The problem in one paragraph

Essential life for older adults now runs through phones, portals, and paperwork: bank apps, patient portals, Medicare, password managers, verification codes. For immigrant parents this happens in a second language. The person they trust to teach them is their adult child, but the child has no tools: only FaceTime calls, screenshots, and voice messages. Lessons don't stick, help only happens live, and the child can't see whether anything was learned.

**Thesis:** Immigrant parents are losing independence because essential life now runs through phones, portals, and paperwork in a second language. The trusted helper is their adult child, who has no tools.

## 2. What we observed firsthand

- **Classes don't transfer.** Workplace digital-literacy classes use a computer and a phone in a classroom; at home everything happens on her own phone. Logging in on a laptop in class is not equivalent to logging in on her phone at home.
- **Once or twice isn't learning.** Without repetition, skills fade. There's no spaced repetition in a class or a FaceTime call.
- **Who teaches matters.** Health records, bank accounts, and passwords are sensitive. For an immigrant family it is meaningful that the child is the teacher, not a stranger or a vendor.
- **Every app is its own lesson.** Even a password manager has to be retaught app by app.
- **Live help has its own learning curve.** FaceTime screen sharing works, but the parent has to understand "Ask to Share," screen sharing, and drawing before help can even begin. And if the child just takes over via remote control, the parent learns nothing.
- **Adding a new tool defeats the purpose.** Parents struggle to master one thing; asking them to learn another app first is a barrier.

## 3. Landscape: what exists and why it isn't sufficient

| Tool | What it does | Why it isn't sufficient |
|---|---|---|
| **Apple FaceTime (iOS 18+)** | Screen sharing, "Ask to Share," drawing on the shared screen, remote control | Live only; nothing saved, practiced, or repeated. The controls themselves are hard for parents to learn. Remote control means the child does it, not the parent. |
| **Apple Tips app** | Built-in tips, including a small "Practice Key Gestures" section | Only a handful of gestures. No library of everyday iPhone skills (Control Center, Wi-Fi, keyboards, getting unstuck). No feedback on the specific mistake. |
| **Be Connected** (Australian government, eSafety Commissioner) | Free national program: large topic library, interactive practice area, games, lesson plans, glossary, community partners | Built like a course catalog (runs on Totara, an LMS; enrolment; completion criteria). Generic device, not the learner's apps. Practice is separate from real tasks. Australia only, English-first. It recognizes helpers ("Help others," "Young mentors") but gives them content, not tools. |
| **UrMorning** | iPhone app: photo-and-ask explanations of letters/bills; "Guide My Screen" watches the screen during a session and speaks steps | AI replaces the family helper; deliberately no dashboard for family. English-first. Confirms that on-request screen watching on iPhone is technically possible. |
| **Chinese Android phones** (Huawei, Honor, Xiaomi, OPPO) | Family remote help built into the OS: child links to parent's phone, views/controls the screen; some add location and anti-fraud features | Live only. Android only. Not available for iPhones; Chinese-language guides note iPhone users can only use FaceTime. |
| **Scribe / Tango** | Browser extensions that turn a recorded workflow into a step-by-step guide; Tango's "Guide Me" overlays steps on the live web app | SOP and onboarding tools for employees on desktop. Not built for older learners, phones, or families. Useful only as proof the "recording → step guide" format works. |
| **Generic content** (AARP/Senior Planet, library classes, YouTube, Apple Support) | Courses, how-to articles, videos | English-first, generic, not the learner's screen, no practice or follow-up. Useful as a source for concept explanations (Apple Support has official Simplified and Traditional Chinese pages). |
| **Self-directed learning apps** (Duolingo model) | Short lessons, instant feedback, spaced repetition, streaks | Good learning engine, but motivation depends on the learner. Research on older adults and language apps found low persistence and that engaged users were mostly already confident with tech. |

**The gap:** nothing combines family-made, async, practice-based lessons with feedback, in the parent's language, on iPhone.

## 4. Why China solved part of it

1. **A forcing function.** During COVID, health codes and cashless payment made phones mandatory for daily life; older people without them were shut out. The State Council's November 2020 plan on helping older people use smart technology addressed this directly, including letting people without phones enter public places with ID.
2. **Policy directed the platforms.** The Ministry of Industry and Information Technology ran a campaign (late 2020) requiring major apps (WeChat, Didi, Ctrip, and others) to build senior-friendly versions. Alibaba, Baidu, and Tencent released them.
3. **Phone makers control the OS.** Huawei, Xiaomi, and OPPO run their own versions of Android, so they can build family remote help into the phone itself.
4. **Super-apps concentrate life.** Fix WeChat, Alipay, and a few others, and you've covered most of a parent's digital life.
5. **Cultural fit.** The adult child as the helper (often from another city) is a recognized product category ("for your parents"). The family-helper model is established, not invented.

## 5. Why the US hasn't

1. **No forcing function.** Cash, phone calls, and paper still mostly work. The pain is chronic, not an emergency.
2. **Fragmentation.** Every bank, health system, insurer, pharmacy, and agency has its own app or portal. There is no WeChat to fix. That's a lot to learn, and it's why **mental models** matter: understanding what a verification code is, what a password manager does, and how accounts and logins work in general carries across every app, while button-level instructions don't. It's also why only the child knows which five apps matter for their parent.
3. **Apple controls the iPhone.** Third-party apps can't capture taps or overlay guidance on other apps. Apple's answer is FaceTime, which is live only.
4. **No buyer for learning.** Senior-tech money goes to safety and monitoring (falls, medications), paid via insurance or home-care budgets, or to simplified "senior phones" that replace the phone instead of teaching it. Step-guide tools sell to businesses. Parents won't pay to learn; children pay for peace of mind, not curriculum.
5. **Public funding was cut.** Digital-skills training for older adults ran largely through libraries and nonprofits. On May 9, 2025, the Commerce Department terminated Digital Equity Act grants (older adults were a named beneficiary group). A federal judge later ruled the program can't be unilaterally ended but also ruled race-based award criteria unconstitutional, which halted programs for racial and ethnic minorities. Immigrant families fall into that gap twice. **[verify current status]**
6. **Looks niche to investors.** Immigrant, non-English-speaking older adults are an underserved segment for venture-backed products.

**Implication:** this is a market failure, not a missing idea. It's the kind of gap a public-interest, open-source incubator exists to fill.

## 6. Why this approach (learning rationale)

- **Practice, not watching.** Learners act on real screens rather than watch a video.
- **Specific feedback.** "You held too long" beats "try again." Common older-adult errors are gesture errors (taps held too long become holds; shaky taps become drags).
- **Spaced repetition.** Revisit soon after learning, then less often as the skill holds.
- **Learn on your own phone.** Lessons are recorded on the real apps the parent uses; when her screen differs, her own recording becomes the next lesson.
- **The relationship is the motivation engine.** Self-directed apps rely on the learner's own drive; this relies on the child, who assigns, notices, and follows up. "Duolingo's practice engine, with your own kid in place of the owl."
- **Explanation only when needed.** Short concept help attached to the step that needs it, never a course up front.

## 7. What's enduring vs. what will date

- **Enduring:** the trusted family channel; practice with feedback; mental models in the parent's language.
- **Will date:** button-level lessons (iOS redesigns move things; AI assistants will guide or act live). Mitigation: tag lessons by iOS version; family-made lessons cover the long tail.
- **Roadmap ideas kept in reserve:** judgment lessons (scam texts, permission prompts) using the same practice engine; Medicare/benefits content (Oct 15–Dec 7 open enrollment overlaps the cohort); letter/mail triage; account continuity.

## 8. Positioning lines

- "Nothing combines these" (not "nothing exists").
- "In China, phone makers built the adult child into the phone as the trusted helper. In the US, Apple offers live help only, senior-tech companies sell monitoring or simplified phones, and public funding for digital-skills training was cut in 2025. Immigrant families fall through every gap."
- "Even Australia's national program recognizes the helper role, then hands helpers a course catalog."
- "Live help asks parents to learn three new controls before help begins, and remote control means the child did it, not the parent."

## 9. Before submitting

- [ ] 20-minute App Store check for family-made, practice-based lesson apps.
- [ ] Re-check Digital Equity Act status.
- [ ] Confirm whether Apple Tips' gesture practice gives error-specific feedback.
- [ ] Confirm Tips app is available in Chinese on parents' phones.

## Sources

- Assembly Code incubator: https://www.assemblycode.org/incubator/ · Cohort 1 projects: https://www.assemblycode.org/projects/
- Be Connected topic library: https://beconnected.esafety.gov.au/topic-library · Tapping and swiping practice: https://beconnected.esafety.gov.au/topic-library/practice-area/tapping-and-swiping
- Apple Tips gesture practice (secondary): https://thehelperbears.com/the-iphones-tips-app-with-gesture-practice/
- UrMorning overview: https://urmorning.com/guides/apps-to-help-elderly-parents-with-technology
- Chinese phone family remote help: https://k.sina.cn/article_7879923925_1d5ae18d506801imlm.html · https://weibo.com/2/detail/comos:nismzux1595512
- State Council 2020 plan: http://english.scio.gov.cn/chinavoices/2020-11/25/content_76946510.htm
- MIIT app campaign: https://tnmt.com/newsletter-snippets/bringing-the-elderly-online-in-a-digital-society/
- China senior-friendly apps: https://www.emarketer.com/content/how-china-closing-digital-divide-seniors
- Digital Equity Act cancellation: https://www.ala.org/advocacy/federal-resources/broadband-policy/digital-equity-resources/DEA-FAQ · https://broadbandbreakfast.com/trump-administration-cancels-digital-equity-grants/ · https://kffhealthnews.org/race-and-health/digital-equity-act-trump-cuts-internet-broadband-rural-grants-ohio-pennsylvania/
- Older adults and language-learning apps: https://www.cambridge.org/core/journals/recall/article/mobileassisted-language-learning-in-older-adults-chances-and-challenges/B1125FB682D760FAD71E560C63766846
- Duolingo method (spaced repetition): https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf
