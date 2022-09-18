import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { VirtualAssistant } from "./virtual_assistant";
import { VirtualAssistantType } from "./utils";
import { Queue } from "./queue";
import { Message } from "./message";
import { Animator } from "./animator";

const mockVirtualAssistant: VirtualAssistantType = {
  overlayCount: 0,
  framesize: [0, 0],
  animations: {
    "1": {
      frames: [],
    },
    TestIdle: {
      frames: [],
    },
    IdleTest: {
      frames: [],
    },
  },
  audio: [],
  name: "TestAssistant",
  map: new URL("https://www.example.com"),
};

describe("VirtualAssistant test", () => {
  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  test("constructor", () => {
    const c = new VirtualAssistant(mockVirtualAssistant);

    expect(c).toBeInstanceOf(VirtualAssistant);
    expect(c).toHaveProperty("_el");
    // @ts-ignore
    expect(c._el).toBeInstanceOf(HTMLDivElement);
    // @ts-ignore
    expect(c._el.classList).toContain("virtual-assistant");
    expect(c).toHaveProperty("_debug");
    expect(c).toHaveProperty("_queue");
    // @ts-ignore
    expect(c._queue).toBeInstanceOf(Queue);
    expect(c).toHaveProperty("_animator");
    // @ts-ignore
    expect(c._animator).toBeInstanceOf(Animator);
    expect(c).toHaveProperty("_message");
    // @ts-ignore
    expect(c._message).toBeInstanceOf(Message);
    expect(c).toHaveProperty("_hidden", true);
    expect(c).toHaveProperty("_idleIsPending", false);
    expect(c).toHaveProperty("_idleComplete", null);
    expect(c).toHaveProperty("_offsetTop", undefined);
    expect(c).toHaveProperty("_offsetLeft", undefined);
    expect(c).toHaveProperty("_dragUpdateLoop", undefined);
    expect(c).toHaveProperty("_targetY", undefined);
    expect(c).toHaveProperty("_targetX", undefined);
  });

  test("hasAnimation", () => {
    const c = new VirtualAssistant(mockVirtualAssistant);

    expect(c.hasAnimation("1")).toBeTruthy();
  });

  test("animations", () => {
    const c = new VirtualAssistant(mockVirtualAssistant);

    expect(c.animations()).toEqual(["1", "TestIdle", "IdleTest"]);
  });

  // TODO improve test
  test("_getDirection", () => {
    const c = new VirtualAssistant(mockVirtualAssistant);

    // @ts-ignore
    expect(c._getDirection(50, 100)).toBe("Down");
    // @ts-ignore
    expect(c._getDirection(100, 50)).toBe("Left");
  });

  test("_isIdleAnimation", () => {
    const c = new VirtualAssistant(mockVirtualAssistant);

    // @ts-ignore
    expect(c._isIdleAnimation()).toBeFalsy();
    // @ts-ignore
    c._animator.currentAnimationName = "TestIdle";
    // @ts-ignore
    expect(c._isIdleAnimation()).toBeFalsy();
    // @ts-ignore
    c._animator.currentAnimationName = "IdleTest";
    // @ts-ignore
    expect(c._isIdleAnimation()).toBeTruthy();
  });

  test("_getIdleAnimations", () => {
    const c = new VirtualAssistant(mockVirtualAssistant);

    // @ts-ignore
    expect(c._getIdleAnimations()).toEqual(["IdleTest"]);
  });

  // TODO Improve test
  test("_calculateClickOffset", () => {
    const c = new VirtualAssistant(mockVirtualAssistant);

    // @ts-ignore
    expect(c._calculateClickOffset({ pageX: 100, pageY: 100 })).toEqual({
      top: 100,
      left: 100,
    });
  });

  test("_dragMove", () => {
    const c = new VirtualAssistant(mockVirtualAssistant);

    expect(c).toHaveProperty("_offsetLeft", undefined);
    expect(c).toHaveProperty("_offsetTop", undefined);
    expect(c).toHaveProperty("_targetX", undefined);
    expect(c).toHaveProperty("_targetY", undefined);
    // @ts-ignore
    c._offsetLeft = 50;
    // @ts-ignore
    c._offsetTop = 25;
    // @ts-ignore
    c._dragMove({ clientX: 100, clientY: 100, preventDefault: () => {} });
    expect(c).toHaveProperty("_targetX", 50);
    expect(c).toHaveProperty("_targetY", 75);
  });
});
