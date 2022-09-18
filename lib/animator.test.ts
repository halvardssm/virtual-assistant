import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Animator } from "./animator";
import { VirtualAssistantType } from "./utils";
import { Queue } from "./queue";
import { Message } from "./message";

const mockVirtualAssistant: VirtualAssistantType = {
  overlayCount: 0,
  framesize: [0, 0],
  animations: {
    "1": {
      frames: [],
    },
  },
  audio: [
    {
      mime: "audio/qwerty",
      sounds: {
        "1": "https://www.example.com/audio1.qwerty",
        "2": "https://www.example.com/audio2.qwerty",
        "3": "https://www.example.com/audio3.qwerty",
        "4": "https://www.example.com/audio4.qwerty",
      },
    },
    {
      mime: "audio/mpeg",
      sounds: {
        "1": "https://www.example.com/audio1.mp3",
        "2": "https://www.example.com/audio2.mp3",
        "3": "https://www.example.com/audio3.mp3",
        "4": "https://www.example.com/audio4.mp3",
      },
    },
  ],
  name: "TestAssistant",
  map: new URL("https://www.example.com"),
};

describe("Animator test", () => {
  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  test("constructor", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);

    expect(c).toBeInstanceOf(Animator);
    expect(c).toHaveProperty("currentAnimationName", undefined);
    expect(c).toHaveProperty("isMuted", false);
    expect(c).toHaveProperty("_rootElement");
    // @ts-ignore
    expect(c._rootElement).toBeInstanceOf(HTMLDivElement);
    expect(c).toHaveProperty("_data", mockVirtualAssistant);
    expect(c).toHaveProperty("_overlays", [targetEl]);
    expect(c).toHaveProperty("_currentFrameIndex", 0);
    expect(c).toHaveProperty("_exiting", false);
    expect(c).toHaveProperty("_started", false);
    expect(c).toHaveProperty("_currentFrame", null);
    expect(c).toHaveProperty("_loop", undefined);
    expect(c).toHaveProperty("_currentAnimation", undefined);
    expect(c).toHaveProperty("_endCallback", undefined);
    expect(c).toHaveProperty("_sounds", {});
  });

  test("_setPreferredAudio", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);

    expect(c).toHaveProperty("_sounds", {});

    const mockAudioElement = {
      canPlayType: (mime: string): CanPlayTypeResult =>
        mime === "audio/mpeg" ? "probably" : "",
    } as unknown as HTMLElement;

    jest.spyOn(document, "createElement").mockReturnValueOnce(mockAudioElement);

    c._setPreferredAudio(mockVirtualAssistant.audio);
    // @ts-ignore
    expect(Object.keys(c._sounds)).toHaveLength(4);
    // @ts-ignore
    expect(c._sounds["1"]).toBeInstanceOf(Audio);
    // @ts-ignore
    expect(c._sounds["1"].src).toBe("https://www.example.com/audio1.mp3");
    // @ts-ignore
    expect(c._sounds["2"]).toBeInstanceOf(Audio);
    // @ts-ignore
    expect(c._sounds["2"].src).toBe("https://www.example.com/audio2.mp3");
    // @ts-ignore
    expect(c._sounds["3"]).toBeInstanceOf(Audio);
    // @ts-ignore
    expect(c._sounds["3"].src).toBe("https://www.example.com/audio3.mp3");
    // @ts-ignore
    expect(c._sounds["4"]).toBeInstanceOf(Audio);
    // @ts-ignore
    expect(c._sounds["4"].src).toBe("https://www.example.com/audio4.mp3");
  });

  test("animations", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);
    expect(c.animations()).toEqual(["1"]);
  });

  test("hasAnimation", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);
    expect(c.hasAnimation("1")).toBeTruthy();
  });

  test("exitAnimation", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);
    expect(c).toHaveProperty("_exiting", false);
    c.exitAnimation();
    expect(c).toHaveProperty("_exiting", true);
  });

  test("showAnimation", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);
    expect(c).toHaveProperty("_exiting", false);
    expect(c).toHaveProperty("_started", false);
    expect(c.showAnimation("1", () => {})).toBeTruthy();
    expect(c).toHaveProperty("_currentAnimation", {
      frames: [],
    });
    expect(c).toHaveProperty("currentAnimationName", "1");
    expect(c).toHaveProperty("_currentFrameIndex", 0);
    expect(c).toHaveProperty("_currentFrame", null);
    expect(c).toHaveProperty("_endCallback");
    expect(c).toHaveProperty("_started", true);
  });

  test("_setupElement", () => {
    const targetEl = document.createElement("div");
    const testEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);
    // @ts-ignore
    c._setupElement(testEl, new URL("https://www.example.com"));
    expect(testEl).toHaveProperty("style.display", "none");
    expect(testEl).toHaveProperty("style.width", "0px");
    expect(testEl).toHaveProperty("style.height", "0px");
    expect(testEl).toHaveProperty(
      "style.background",
      "url(https://www.example.com/) no-repeat"
    );
  });

  test("_draw", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);
    // @ts-ignore
    c._draw();
    expect(c).toHaveProperty("_overlays[0].style.display", "none");

    // @ts-ignore
    c._currentFrame = { images: [[1, 2]] };
    // @ts-ignore
    c._draw();
    expect(c).toHaveProperty("_overlays[0].style.display", "block");
    expect(c).toHaveProperty(
      "_overlays[0].style.backgroundPosition",
      "-1px -2px"
    );
  });

  test("_atLastFrame", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);

    // @ts-ignore
    expect(c._atLastFrame()).toBeTruthy();
    // @ts-ignore
    expect(c._currentFrameIndex).toBe(0);

    // @ts-ignore
    c._currentAnimation = { frames: [1, 2, 3] };

    // @ts-ignore
    expect(c._atLastFrame()).toBeFalsy();
    // @ts-ignore
    expect(c._currentFrameIndex).toBe(0);
  });

  // TODO Improve test
  test("_step", () => {
    const targetEl = document.createElement("div");
    const c = new Animator(targetEl, mockVirtualAssistant);

    expect(c).toHaveProperty("_currentAnimation", undefined);
    expect(c).toHaveProperty("currentAnimationName", undefined);

    // @ts-ignore
    c._currentAnimation = { frames: [{}], useExitBranching: false };
    // @ts-ignore
    c.currentAnimationName = "1";
    // @ts-ignore
    c._step();
    expect(c).toHaveProperty("_currentFrame", {});
    expect(c).toHaveProperty("_overlays[0].style.display", "none");
  });
});
