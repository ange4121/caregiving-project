import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LessonCard } from "@/lib/home";
import HomeView from "./HomeView";

const card = (id: string, titleEn: string): LessonCard => ({
  id,
  titleEn,
  titleZh: null,
  steps: 3,
  iosVersion: "26",
  recordedOn: "iPhone 16 Pro · iOS 26",
  thumb: `/lessons/${id}/step-0.jpg`,
  gestures: ["tap", "hold", "tap"],
  practiceHref: `/l/${id}?demo=1`,
  shareHref: `/share/${id}`,
});

const render = (cards: LessonCard[], video: string | null = null) =>
  renderToStaticMarkup(<HomeView cards={cards} helperVideoEmbed={video} />);

describe("HomeView", () => {
  const html = render([
    card("wifi", "Get onto Wi-Fi"),
    card("kb", "Chinese keyboard"),
  ]);

  it("labels the site as a live prototype and says what runs locally", () => {
    expect(html).toContain("Live prototype.");
    expect(html).toContain("runs on the author");
    expect(html).toContain(
      "github.com/ange4121/caregiving-project#make-a-lesson",
    );
  });

  it("offers both ways in", () => {
    expect(html).toContain("Try a lesson as the parent");
    expect(html).toContain("See how a helper makes one");
    expect(html).toContain('href="/editor"');
  });

  it("the main button opens the featured lesson in demo mode", () => {
    expect(html).toContain("Try it →");
    expect(html).toContain("Try it as the parent →");
    expect(html).toContain("Watch a helper make one (1½ min)");
    expect(html).toContain('href="#lessons"');
    expect(html.indexOf('href="/l/wifi?demo=1"')).toBeLessThan(
      html.indexOf('href="/l/kb?demo=1"'),
    );
  });

  it("labels each lesson with the phone it was recorded on", () => {
    expect(html).toContain("recorded on iPhone 16 Pro · iOS 26");
  });

  it("lists every lesson with Practice and Share", () => {
    for (const id of ["wifi", "kb"]) {
      expect(html).toContain(`href="/l/${id}?demo=1"`);
      expect(html).toContain(`href="/share/${id}"`);
    }
  });

  it("shows the walkthrough video only once there is one", () => {
    expect(html).not.toContain("<iframe");
    const withVideo = render(
      [card("wifi", "Wi-Fi")],
      "https://www.loom.com/embed/abc",
    );
    expect(withVideo).toContain('src="https://www.loom.com/embed/abc"');
  });

  it("still renders with no lessons", () => {
    expect(render([])).toContain("See how a helper makes one");
  });
});

describe("HomeView loop", () => {
  const html = render([
    { ...card("wifi", "Get onto Wi-Fi"), titleZh: "连上 Wi-Fi" },
  ]);

  it("shows all four steps in order", () => {
    const order = [
      "You record it",
      "You send it",
      "Your parent practices",
      "They report back",
    ].map((t) => html.indexOf(t));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("links each step to where you can see it", () => {
    expect(html).toContain('href="#make"');
    expect(html).toContain("See the message →");
    expect(html).toContain('href="/share/wifi"');
  });

  it("shows the real report-back text a parent sends", () => {
    expect(html).toContain("我练完了：连上 Wi-Fi ✓");
    expect(html).toContain("第2步试了2次（放手太早）");
    expect(html).toContain("Step 2: 2 tries (let go too early)");
  });
});
