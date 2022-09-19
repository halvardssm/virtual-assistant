import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Message, MessagePosition } from "./message";

describe("Message test", () => {
  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  test("constructor", () => {
    expect(Message).toHaveProperty("WORD_SPEAK_TIME", 200);
    expect(Message).toHaveProperty("CLOSE_MESSAGE_DELAY", 2000);
    expect(Message).toHaveProperty("MESSAGE_MARGIN", 15);

    const targetEl = document.createElement("div");
    const c = new Message({ rootElement: targetEl });

    expect(c).toBeInstanceOf(Message);
    expect(c).toHaveProperty("_rootElement", targetEl);
    expect(c).toHaveProperty("_contentElement");
    expect(c).toHaveProperty("_messageContainerElement");
    expect(c).toHaveProperty("_hidden", true);
    expect(c).toHaveProperty("_complete", undefined);
    expect(c).toHaveProperty("_hiding", null);
    expect(c).toHaveProperty("_loop", undefined);
    expect(c).toHaveProperty("_active", false);
    expect(c).toHaveProperty("_hold", false);
    expect(c).toHaveProperty("_addWord", null);
  });

  test("show & hide", () => {
    const targetEl = document.createElement("div");
    const c = new Message({ rootElement: targetEl });
    expect(c).toHaveProperty("_messageContainerElement.style.display", "none");
    // @ts-ignore
    c._hidden = false;
    c.show();
    expect(c).toHaveProperty("_messageContainerElement.style.display", "");
    c.hide(true);
    expect(c).toHaveProperty("_messageContainerElement.style.display", "none");
  });

  test("_position & _isOutOfBounds", () => {
    const getBoundingClientRectMock = jest.fn(
      () =>
        <DOMRect>{
          right: 200,
          top: 200,
          left: 200,
          bottom: 200,
        }
    );
    const targetEl = document.createElement("div");

    const c = new Message({ rootElement: targetEl });
    jest
      .spyOn(targetEl, "getBoundingClientRect")
      .mockImplementation(getBoundingClientRectMock);
    // @ts-ignore
    c._messageContainerElement = {
      getBoundingClientRect: getBoundingClientRectMock,
      offsetHeight: 100,
      offsetWidth: 100,
      style: {},
    };

    // @ts-ignore
    c._position(MessagePosition.TopLeft);
    expect(c).toHaveProperty("_messageContainerElement.style.top", "85px");
    expect(c).toHaveProperty("_messageContainerElement.style.left", "100px");
    // @ts-ignore
    expect(c._isOutOfBounds()).toBe(false);

    // @ts-ignore
    c._position(MessagePosition.TopRight);
    expect(c).toHaveProperty("_messageContainerElement.style.top", "85px");
    expect(c).toHaveProperty("_messageContainerElement.style.left", "200px");
    // @ts-ignore
    expect(c._isOutOfBounds()).toBe(false);

    // @ts-ignore
    c._position(MessagePosition.BottomLeft);
    expect(c).toHaveProperty("_messageContainerElement.style.top", "215px");
    expect(c).toHaveProperty("_messageContainerElement.style.left", "100px");
    // @ts-ignore
    expect(c._isOutOfBounds()).toBe(false);

    // @ts-ignore
    c._position(MessagePosition.BottomRight);
    expect(c).toHaveProperty("_messageContainerElement.style.top", "215px");
    expect(c).toHaveProperty("_messageContainerElement.style.left", "200px");
    // @ts-ignore
    expect(c._isOutOfBounds()).toBe(false);
  });
});
