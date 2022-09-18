import { Logger } from "./logger";
import { setStylesForElement, VoidFn } from "./utils";

export enum MessagePosition {
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
}

export type MessageContentStyles = {
  contentWrapperStyle?: Partial<CSSStyleDeclaration>;
  contentMessageStyle?: Partial<CSSStyleDeclaration>;
};

export type MessageOptions = MessageContentStyles & {
  logger?: Logger;
  rootElement: HTMLDivElement;
};

export class Message {
  private static readonly WORD_SPEAK_TIME = 200;
  private static readonly CLOSE_MESSAGE_DELAY = 2000;
  private static readonly MESSAGE_MARGIN = 15;

  private readonly _logger: Logger;
  private readonly _rootElement: HTMLDivElement;
  private readonly _contentElement: HTMLDivElement;
  private readonly _messageContainerElement: HTMLDivElement;

  private _hidden = true;
  private _active: boolean = false;
  private _hold: boolean = false;
  private _complete: VoidFn | undefined = undefined;
  private _loop: number | undefined = undefined;
  private _hiding: number | null = null;
  private _addWord: VoidFn | null = null;

  constructor(options: MessageOptions) {
    this._logger = options.logger
      ? options.logger.clone({
          prefix: options.logger.prefix + " Message:",
        })
      : new Logger({ prefix: "Message:" });

    this._rootElement = options.rootElement;

    this._contentElement = document.createElement("div");
    setStylesForElement(this._contentElement, {
      position: "fixed",
      zIndex: "1000",
      cursor: "pointer",
      background: "#FFFFFF",
      color: "black",
      padding: "8px",
      border: "1px solid black",
      borderRadius: "2px",
      ...options?.contentMessageStyle,
    });

    this._messageContainerElement = document.createElement("div");
    setStylesForElement(this._messageContainerElement, {
      maxWidth: "200px",
      minWidth: "120px",
      fontSize: "10pt",
      display: "none",
      ...options?.contentWrapperStyle,
    });

    this._messageContainerElement.append(this._contentElement);
    document.body.append(this._messageContainerElement);
  }

  reposition() {
    const sides = Object.values(MessagePosition)
      .map(Number)
      .filter((v) => !isNaN(v));
    for (const side of sides) {
      this._position(side);
      if (!this._isOutOfBounds()) break;
    }
  }

  speak(complete: VoidFn, text: string, hold?: Message["_hold"]) {
    this._logger.info("Speak", text);

    this._hidden = false;
    this.show();
    // set height to auto
    this._contentElement.style.height = "auto";
    this._contentElement.style.width = "auto";
    // add the text
    this._contentElement.replaceChildren(document.createTextNode(text));
    // set height
    this._contentElement.style.height = getComputedStyle(
      this._contentElement
    ).height;
    this._contentElement.style.width = getComputedStyle(
      this._contentElement
    ).width;
    this._contentElement.replaceChildren();

    this.reposition();

    this._complete = complete;
    this._sayWords(text, !!hold, complete);
    this._logger.info("SpeakDone", text);
  }

  show() {
    if (this._hidden) return;
    this._messageContainerElement.style.display = "";
  }

  hide(fast: boolean = false) {
    if (fast) {
      this._messageContainerElement.style.display = "none";
      return;
    }

    this._hiding = window.setTimeout(
      this._finishHideMessage.bind(this),
      Message.CLOSE_MESSAGE_DELAY
    );
  }

  close() {
    if (this._active) {
      this._hold = false;
    } else if (this._hold && this._complete) {
      this._complete();
    }
  }

  pause() {
    window.clearTimeout(this._loop);
    this._loop = undefined;
    if (this._hiding) {
      window.clearTimeout(this._hiding);
      this._hiding = null;
    }
  }

  resume() {
    if (this._addWord) {
      this._addWord();
    } else if (!this._hold && !this._hidden) {
      this._hiding = window.setTimeout(
        this._finishHideMessage.bind(this),
        Message.CLOSE_MESSAGE_DELAY
      );
    }
  }

  private _position(position: MessagePosition) {
    const targetBoundingRect = this._rootElement.getBoundingClientRect();

    const messageOffsetHeight = this._messageContainerElement.offsetHeight;
    const messageOffsetWidth = this._messageContainerElement.offsetWidth;

    const messageStyle: Partial<CSSStyleDeclaration> = {
      position: "absolute",
      top: "",
      marginTop: "",
      left: "",
      marginLeft: "",
      backgroundPosition: "",
    };

    switch (position) {
      case MessagePosition.TopLeft: {
        // right side of the message next to the right side of the virtual assistant
        const top =
          targetBoundingRect.top - messageOffsetHeight - Message.MESSAGE_MARGIN;
        const left = targetBoundingRect.right - messageOffsetWidth;
        messageStyle.top = `${top}px`;
        messageStyle.left = `${left}px`;
        messageStyle.marginTop = "0px";
        messageStyle.marginLeft = "-50px";
        break;
      }
      case MessagePosition.TopRight: {
        // left side of the message next to the left side of the virtual assistant
        const top =
          targetBoundingRect.top - messageOffsetHeight - Message.MESSAGE_MARGIN;
        const left = targetBoundingRect.left;
        messageStyle.top = `${top}px`;
        messageStyle.left = `${left}px`;
        messageStyle.marginTop = "0px";
        messageStyle.marginLeft = "50px";
        messageStyle.backgroundPosition = "-10px 0";
        break;
      }
      case MessagePosition.BottomRight:
        {
          // right side of the message next to the right side of the virtual assistant
          const top = targetBoundingRect.bottom + Message.MESSAGE_MARGIN;
          const left = targetBoundingRect.left;
          messageStyle.top = `${top}px`;
          messageStyle.left = `${left}px`;
          messageStyle.marginTop = "-16px";
          messageStyle.marginLeft = "50px";
          messageStyle.backgroundPosition = "-10px -16px";
          break;
        }
        break;
      case MessagePosition.BottomLeft: {
        // left side of the message next to the left side of the virtual assistant
        const top = targetBoundingRect.bottom + Message.MESSAGE_MARGIN;
        const left = targetBoundingRect.right - messageOffsetWidth;
        messageStyle.top = `${top}px`;
        messageStyle.left = `${left}px`;
        messageStyle.marginTop = "-16px";
        messageStyle.marginLeft = "-50px";
        messageStyle.backgroundPosition = "0px -16px";
        break;
      }
    }

    this._logger.debug(messageStyle);

    setStylesForElement(this._messageContainerElement, messageStyle);
  }

  private _isOutOfBounds(): boolean {
    const messageBoundingRect =
      this._messageContainerElement.getBoundingClientRect();
    const windowInnerHeight = window.innerHeight;
    const windowInnerWidth = window.innerWidth;
    const margin = 5;

    const isOutOfBoundsTop = messageBoundingRect.top - margin < 0;
    const isOutOfBoundsLeft = messageBoundingRect.left - margin < 0;
    const isOutOfBoundsBottom =
      messageBoundingRect.bottom + margin > windowInnerHeight;
    const isOutOfBoundsRight =
      messageBoundingRect.right + margin > windowInnerWidth;

    const isOutOfBounds =
      isOutOfBoundsRight ||
      isOutOfBoundsLeft ||
      isOutOfBoundsTop ||
      isOutOfBoundsBottom;

    if (isOutOfBounds) return true;

    return false;
  }

  private _finishHideMessage() {
    if (this._active) return;
    this._messageContainerElement.style.display = "none";
    this._hidden = true;
    this._hiding = null;
  }

  private _sayWords(text: string, hold: Message["_hold"], complete: VoidFn) {
    this._active = true;
    this._hold = hold;
    const words = text.split(/[^\S-]/);
    const time = Message.WORD_SPEAK_TIME;
    let idx = 1;

    const addWord = () => {
      if (!this._active) return;
      if (idx > words.length) {
        this._addWord = null;
        this._active = false;
        if (!this._hold) {
          complete();
          this.hide();
        }
      } else {
        this._contentElement.replaceChildren(
          document.createTextNode(words.slice(0, idx).join(" "))
        );
        idx++;
        this._loop = window.setTimeout(addWord.bind(this), time);
      }
    };

    this._addWord = addWord;
    this._addWord();
  }
}
