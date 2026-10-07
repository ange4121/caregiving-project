import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ParentPhonePreview from "./ParentPhonePreview";

describe("ParentPhonePreview", () => {
  const html = renderToStaticMarkup(
    <ParentPhonePreview
      from="小雨"
      body="妈，我给你做了一个小练习：连上 Wi-Fi。"
      link="https://caregiving-project.vercel.app/l/wifi#lang=zh-Hans"
      cardTitle="小练习 · 连上 Wi-Fi"
      cardImage="/lessons/wifi/step-0.jpg"
    />,
  );

  it("shows the message, the link, and who it's from", () => {
    expect(html).toContain("妈，我给你做了一个小练习：连上 Wi-Fi。");
    expect(html).toContain("caregiving-project.vercel.app/l/wifi…");
    expect(html).toContain("小雨");
  });

  it("shows the link card with the lesson's title, first screen, and site", () => {
    expect(html).toContain("小练习 · 连上 Wi-Fi");
    expect(html).toContain('src="/lessons/wifi/step-0.jpg"');
    expect(html).toContain("caregiving-project.vercel.app");
  });
});
