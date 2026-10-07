import { describe, expect, it } from "vitest";
import { qrTarget } from "./LessonFrame";

const SITE = "https://caregiving-project.vercel.app";

describe("qrTarget", () => {
  it("points a laptop's localhost page at the live site", () => {
    expect(qrTarget("http://localhost:61626/l/join-wifi?demo=1", SITE)).toBe(
      "https://caregiving-project.vercel.app/l/join-wifi?demo=1",
    );
  });

  it("leaves reachable addresses alone", () => {
    expect(qrTarget(`${SITE}/l/join-wifi?demo=1`, SITE)).toBe(
      `${SITE}/l/join-wifi?demo=1`,
    );
    expect(qrTarget("http://10.0.0.42:61626/l/join-wifi", SITE)).toBe(
      "http://10.0.0.42:61626/l/join-wifi",
    );
  });
});
