import { describe, expect, it } from "vitest";
import { classifyGesture, type DisplayRect } from "@/lib/gesture";
import {
  addBox,
  addCut,
  removeCut,
  addSelfStep,
  boxFromDrag,
  copyBoxesToNext,
  removeBox,
  deleteStep,
  draftProblems,
  emptyLesson,
  gestureFromClassification,
  markStep,
  parseLessonJson,
  slugify,
  stepAtTime,
  updateStep,
  type GestureFields,
} from "./draft";

const rect: DisplayRect = { left: 0, top: 0, width: 400, height: 800 };
const tap: GestureFields = {
  gesture: "tap",
  x: 0.5,
  y: 0.5,
  swipe_direction: null,
  system_gesture: false,
};

describe("slugify", () => {
  it("makes a URL-safe id", () => {
    expect(slugify("Log in to Chase!")).toBe("log-in-to-chase");
    expect(slugify("  Wi-Fi  from Control Center ")).toBe(
      "wi-fi-from-control-center",
    );
  });
});

describe("gestureFromClassification", () => {
  it("click → tap at the normalized point", () => {
    const c = classifyGesture([
      { x: 100, y: 200, t: 0 },
      { x: 100, y: 200, t: 80 },
    ]);
    expect(gestureFromClassification(c, rect)).toEqual({
      gesture: "tap",
      x: 0.25,
      y: 0.25,
      swipe_direction: null,
      system_gesture: false,
    });
  });

  it("long press → hold", () => {
    const c = classifyGesture([
      { x: 100, y: 200, t: 0 },
      { x: 100, y: 200, t: 900 },
    ]);
    expect(gestureFromClassification(c, rect)?.gesture).toBe("hold");
  });

  it("drag → swipe with direction; near an edge suggests a system gesture", () => {
    const fromTop = classifyGesture([
      { x: 380, y: 5, t: 0 },
      { x: 380, y: 200, t: 200 },
    ]);
    expect(gestureFromClassification(fromTop, rect)).toMatchObject({
      gesture: "swipe",
      swipe_direction: "down",
      system_gesture: true,
    });
    const middle = classifyGesture([
      { x: 200, y: 400, t: 0 },
      { x: 50, y: 400, t: 200 },
    ]);
    expect(gestureFromClassification(middle, rect)).toMatchObject({
      swipe_direction: "left",
      system_gesture: false,
    });
  });

  it("a small wobble is rejected", () => {
    const c = classifyGesture([
      { x: 100, y: 100, t: 0 },
      { x: 120, y: 100, t: 100 },
    ]);
    expect(gestureFromClassification(c, rect)).toBeNull();
  });
});

describe("markStep", () => {
  it("adds steps in time order and returns the new index", () => {
    let l = emptyLesson();
    l = markStep(l, 5000, tap).lesson;
    const r = markStep(l, 2000, { ...tap, gesture: "hold" });
    expect(r.index).toBe(0);
    expect(r.lesson.steps.map((s) => [s.index, s.t_ms, s.gesture])).toEqual([
      [0, 2000, "hold"],
      [1, 5000, "tap"],
    ]);
  });

  it("re-marking the same moment redoes the gesture but keeps the label", () => {
    let l = markStep(emptyLesson(), 3000, tap).lesson;
    l = updateStep(l, 0, { element_label: "Sign in" });
    const r = markStep(l, 3020, { ...tap, gesture: "hold", x: 0.1 });
    expect(r.lesson.steps).toHaveLength(1);
    expect(r.lesson.steps[0]).toMatchObject({
      t_ms: 3000,
      gesture: "hold",
      x: 0.1,
      element_label: "Sign in",
    });
  });
});

describe("updateStep", () => {
  it("clears swipe fields when switching away from swipe", () => {
    let l = markStep(emptyLesson(), 0, {
      gesture: "swipe",
      x: 0.9,
      y: 0,
      swipe_direction: "down",
      system_gesture: true,
    }).lesson;
    l = updateStep(l, 0, { gesture: "tap" });
    expect(l.steps[0]).toMatchObject({
      swipe_direction: null,
      system_gesture: false,
    });
  });

  it("switching to swipe picks a default direction", () => {
    const l = updateStep(markStep(emptyLesson(), 0, tap).lesson, 0, {
      gesture: "swipe",
    });
    expect(l.steps[0].swipe_direction).toBe("up");
  });
});

describe("self steps, delete, stepAtTime", () => {
  it("self steps have no target", () => {
    const { lesson } = addSelfStep(emptyLesson(), 1000);
    expect(lesson.steps[0]).toMatchObject({
      gesture: "self",
      x: null,
      y: null,
    });
  });

  it("adding a self step on an existing step's moment leaves it alone", () => {
    const l = markStep(emptyLesson(), 3000, tap).lesson;
    const r = addSelfStep(l, 3020);
    expect(r.existed).toBe(true);
    expect(r.lesson.steps[0]).toMatchObject({ gesture: "tap", x: 0.5 });
  });

  it("switching to self and back keeps the position", () => {
    let l = markStep(emptyLesson(), 0, tap).lesson;
    l = updateStep(l, 0, { gesture: "self" });
    l = updateStep(l, 0, { gesture: "tap" });
    expect(l.steps[0]).toMatchObject({ gesture: "tap", x: 0.5, y: 0.5 });
  });

  it("flags a gesture step with no position", () => {
    let l = addSelfStep(emptyLesson(), 0).lesson;
    l = updateStep(l, 0, { gesture: "swipe", element_label: "X" });
    expect(draftProblems(l)).toContain(
      "Step 1: show where. Go to this step and do the gesture on the video.",
    );
  });

  it("delete reindexes", () => {
    let l = markStep(emptyLesson(), 1000, tap).lesson;
    l = markStep(l, 2000, tap).lesson;
    l = deleteStep(l, 0);
    expect(l.steps.map((s) => [s.index, s.t_ms])).toEqual([[0, 2000]]);
  });

  it("finds the step whose range contains a time", () => {
    let l = markStep(emptyLesson(), 1000, tap).lesson;
    l = markStep(l, 4000, tap).lesson;
    expect(stepAtTime(l, 500)).toBeNull();
    expect(stepAtTime(l, 1000)).toBe(0);
    expect(stepAtTime(l, 3900)).toBe(0);
    expect(stepAtTime(l, 9000)).toBe(1);
  });
});

describe("draftProblems", () => {
  it("lists what's missing", () => {
    const l = markStep(emptyLesson(), 0, tap).lesson;
    expect(draftProblems(l)).toEqual([
      "Give the lesson a title.",
      "Lesson needs an id.",
      'Step 1: name the thing on screen (e.g. "Sign in").',
    ]);
  });
});

describe("redaction boxes", () => {
  it("normalizes a drag in any direction and drops tiny ones", () => {
    expect(boxFromDrag({ x: 0.6, y: 0.5 }, { x: 0.2, y: 0.3 })).toEqual({
      x: 0.2,
      y: 0.3,
      w: 0.39999999999999997,
      h: 0.2,
    });
    expect(boxFromDrag({ x: 0.5, y: 0.5 }, { x: 0.505, y: 0.6 })).toBeNull();
    expect(boxFromDrag({ x: -1, y: 0.5 }, { x: 0.1, y: 2 })).toEqual({
      x: 0,
      y: 0.5,
      w: 0.1,
      h: 0.5,
    });
  });

  it("adds, removes, and copies boxes to the next step", () => {
    let l = markStep(emptyLesson(), 1000, tap).lesson;
    l = markStep(l, 2000, tap).lesson;
    const box = { x: 0.1, y: 0.1, w: 0.2, h: 0.05 };
    l = addBox(l, 0, box);
    l = copyBoxesToNext(l, 0);
    l = copyBoxesToNext(l, 0); // no duplicates
    expect(l.steps[1].blur).toEqual([box]);
    l = removeBox(l, 0, 0);
    expect(l.steps[0].blur).toEqual([]);
    expect(copyBoxesToNext(l, 1)).toBe(l); // last step: nothing to copy to
  });
});

describe("parseLessonJson", () => {
  it("reads a draft back, sorting steps and filling missing fields", () => {
    const l = parseLessonJson(
      JSON.stringify({
        id: "join-wifi",
        title_en: "Get onto Wi-Fi",
        steps: [
          {
            t_ms: 5000,
            gesture: "tap",
            x: 0.5,
            y: 0.5,
            element_label: "Wi-Fi",
          },
          { t_ms: 1000, gesture: "self", note_en: "Type your password" },
        ],
      }),
    );
    expect(l?.id).toBe("join-wifi");
    expect(l?.steps.map((s) => [s.index, s.gesture])).toEqual([
      [0, "self"],
      [1, "tap"],
    ]);
    expect(l?.steps[1].blur).toEqual([]);
  });

  it("rejects things that aren't lessons", () => {
    expect(parseLessonJson("not json")).toBeNull();
    expect(parseLessonJson('{"steps": "nope"}')).toBeNull();
    expect(
      parseLessonJson('{"steps": [{"t_ms": 1, "gesture": "pinch"}]}'),
    ).toBeNull();
  });
});

describe("cuts in the editor", () => {
  const withVideo = () => ({
    ...emptyLesson(),
    video: { width: 1, height: 2, duration_ms: 20000 },
  });

  it("adds cuts in either order and merges overlaps", () => {
    let l = addCut(withVideo(), 9000, 6000);
    l = addCut(l, 8000, 12000);
    expect(l.cuts).toEqual([{ start_ms: 6000, end_ms: 12000 }]);
    expect(removeCut(l, 0).cuts).toEqual([]);
  });

  it("trimming the end runs to the end of the video", () => {
    expect(addCut(withVideo(), 15000, 99999).cuts).toEqual([
      { start_ms: 15000, end_ms: 20000 },
    ]);
  });

  it("flags a step inside a cut", () => {
    let l = markStep(withVideo(), 7000, tap).lesson;
    l = addCut(l, 6000, 8000);
    expect(draftProblems(l)).toContain(
      "Step 1: falls inside a cut section. Move the step or the cut.",
    );
  });
});
