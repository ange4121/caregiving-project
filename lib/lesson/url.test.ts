import { describe, expect, it } from "vitest";
import { demoLessonHref, readLessonUrl } from "./url";

describe("readLessonUrl", () => {
  it("plain link: nothing set", () => {
    expect(readLessonUrl("", "")).toEqual({
      lang: null,
      contact: null,
      childName: null,
      demo: false,
    });
  });

  it("home page demo link", () => {
    expect(readLessonUrl(demoLessonHref("x").split("x")[1], "")).toMatchObject({
      demo: true,
    });
  });

  it("a real share link is never a demo, even with ?demo=1", () => {
    expect(
      readLessonUrl(
        "?demo=1",
        "#lang=zh-Hans&to=%2B14155550123&me=%E5%B0%8F%E9%9B%A8",
      ),
    ).toEqual({
      lang: "zh-Hans",
      contact: "+14155550123",
      childName: "小雨",
      demo: false,
    });
  });

  it("?lang= beats the share link's language; bad values are ignored", () => {
    expect(readLessonUrl("?lang=en", "#lang=zh-Hant").lang).toBe("en");
    expect(readLessonUrl("?lang=fr", "#lang=zh-Hant").lang).toBe("zh-Hant");
  });
});
