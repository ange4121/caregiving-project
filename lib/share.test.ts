import { describe, expect, it } from "vitest";
import {
  buildLessonLink,
  buildShareMessage,
  buildShareMessageEnglish,
  isValidContact,
  lacksCountryCode,
  normalizeContact,
  parseShareFragment,
} from "./share";

describe("contact", () => {
  it("normalizes phone numbers and keeps emails", () => {
    expect(normalizeContact(" +1 (415) 555-0123 ")).toBe("+14155550123");
    expect(normalizeContact("me@icloud.com")).toBe("me@icloud.com");
  });

  it("validates phones and emails loosely", () => {
    expect(isValidContact("+1 415 555 0123")).toBe(true);
    expect(isValidContact("me@icloud.com")).toBe(true);
    expect(isValidContact("12345")).toBe(false);
    expect(isValidContact("not an email@")).toBe(false);
  });

  it("flags phone numbers without a country code", () => {
    expect(lacksCountryCode("415-555-0123")).toBe(true);
    expect(lacksCountryCode("+14155550123")).toBe(false);
    expect(lacksCountryCode("me@icloud.com")).toBe(false);
  });
});

describe("lesson link", () => {
  const info = {
    lang: "zh-Hans" as const,
    contact: "+1 415 555 0123",
    childName: "小雨",
  };

  it("puts share info in the fragment, never the path or query", () => {
    const link = buildLessonLink("https://x.app", "control-center-wifi", info);
    const url = new URL(link);
    expect(url.pathname).toBe("/l/control-center-wifi");
    expect(url.search).toBe("");
    expect(url.hash).toContain("to=%2B14155550123");
  });

  it("round-trips through parseShareFragment", () => {
    const link = buildLessonLink("https://x.app", "abc", info);
    expect(parseShareFragment(new URL(link).hash)).toEqual({
      lang: "zh-Hans",
      contact: "+14155550123",
      childName: "小雨",
    });
  });

  it("leaves out empty fields and ignores unknown languages", () => {
    const link = buildLessonLink("https://x.app", "abc", {
      lang: "zh-Hant",
      contact: "",
      childName: " ",
    });
    expect(new URL(link).hash).toBe("#lang=zh-Hant");
    expect(parseShareFragment("#lang=fr").lang).toBeNull();
    expect(parseShareFragment("")).toEqual({
      lang: null,
      contact: null,
      childName: null,
    });
  });
});

describe("share message", () => {
  it("builds the Chinese message with the link on its own line", () => {
    const msg = buildShareMessage({
      script: "zh-Hans",
      parentName: "妈",
      title: "从控制中心打开 Wi-Fi 列表",
      link: "https://x.app/l/abc#lang=zh-Hans",
    });
    expect(msg).toBe(
      "妈，我给你做了一个小练习：从控制中心打开 Wi-Fi 列表。有空的时候点开试试，做错了也没关系。\nhttps://x.app/l/abc#lang=zh-Hans",
    );
  });

  it("uses Traditional characters and drops the title when missing", () => {
    const msg = buildShareMessage({
      script: "zh-Hant",
      parentName: "爸",
      title: undefined,
      link: "L",
    });
    expect(msg).toBe(
      "爸，我給你做了一個小練習。有空的時候點開試試，做錯了也沒關係。\nL",
    );
  });

  it("gives the author an English version", () => {
    expect(
      buildShareMessageEnglish({ parentNameEn: "Mom", titleEn: "Open Wi-Fi" }),
    ).toBe(
      "Mom, I made you a little practice: Open Wi-Fi. Try it when you have time. It's fine to make mistakes.",
    );
  });
});
