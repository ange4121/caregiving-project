import { describe, expect, it } from "vitest";
import {
  buildReportMessage,
  faceTimeLink,
  smsLink,
  summarizeAttempts,
  type AttemptLog,
} from "./report";

const ok = (step: number): AttemptLog => ({
  step,
  ok: true,
  error: null,
  durationMs: 100,
  ambiguousPress: false,
});
const miss = (step: number, error: AttemptLog["error"]): AttemptLog => ({
  step,
  ok: false,
  error,
  durationMs: 300,
  ambiguousPress: false,
});

describe("summarizeAttempts", () => {
  it("skips steps done on the first try", () => {
    expect(summarizeAttempts([ok(0), ok(1)])).toEqual([]);
  });

  it("counts tries and picks the most common mistake", () => {
    const log = [
      ok(0),
      miss(1, "wrong_place"),
      miss(1, "hold_too_short"),
      miss(1, "hold_too_short"),
      ok(1),
    ];
    expect(summarizeAttempts(log)).toEqual([
      { stepNumber: 2, tries: 4, mainError: "hold_too_short" },
    ]);
  });

  it("breaks ties with the first mistake", () => {
    const log = [miss(0, "tap_moved"), miss(0, "wrong_place"), ok(0)];
    expect(summarizeAttempts(log)[0].mainError).toBe("tap_moved");
  });
});

describe("buildReportMessage", () => {
  it("reports a clean run", () => {
    expect(
      buildReportMessage({
        script: "zh-Hans",
        titleZh: "打开 Wi-Fi",
        titleEn: "Open Wi-Fi",
        log: [ok(0), ok(1)],
      }),
    ).toBe(
      "我练完了：打开 Wi-Fi ✓\n每一步都一次做对了\n—\nI finished: Open Wi-Fi ✓\nEvery step right on the first try",
    );
  });

  it("lists the steps that took several tries, in Traditional", () => {
    expect(
      buildReportMessage({
        script: "zh-Hant",
        titleZh: "打開 Wi-Fi",
        titleEn: "Open Wi-Fi",
        log: [ok(0), miss(1, "wrong_place"), ok(1)],
      }),
    ).toBe(
      "我練完了：打開 Wi-Fi ✓\n第2步試了2次（位置不對）\n—\nI finished: Open Wi-Fi ✓\nStep 2: 2 tries (wrong spot)",
    );
  });

  it("falls back to the English title", () => {
    const msg = buildReportMessage({
      script: "zh-Hans",
      titleZh: undefined,
      titleEn: "Open Wi-Fi",
      log: [ok(0)],
    });
    expect(msg.startsWith("我练完了：Open Wi-Fi ✓")).toBe(true);
  });
});

describe("links", () => {
  it("builds sms and facetime links", () => {
    expect(smsLink("+14155550123", "我练完了 ✓\nok")).toBe(
      "sms:+14155550123&body=%E6%88%91%E7%BB%83%E5%AE%8C%E4%BA%86%20%E2%9C%93%0Aok",
    );
    expect(faceTimeLink("me@icloud.com")).toBe("facetime:me@icloud.com");
  });
});
