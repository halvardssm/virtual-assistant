import { Queue } from "./queue";
import { Animator, AnimatorStates } from "./animator";
import { Message, MessageContentStyles } from "./message";
import { Logger, LoggerOptions } from "./logger";
import {
  getRandomFromArray,
  setStylesForElement,
  VirtualAssistantType,
  VoidCbFn,
  VoidFn,
} from "./utils";

export enum Direction {
  Right = "Right",
  Up = "Up",
  Left = "Left",
  Down = "Down",
  Top = "Top",
}

export type VirtualAssistantOptions = {
  loggerOptions?: LoggerOptions;
  classKey?: string;
  messageOptions?: MessageContentStyles;
};

export class VirtualAssistant {
  readonly classKey: string;

  private readonly _logger: Logger;
  private readonly _el: HTMLDivElement;

  private _queue: Queue;
  private _animator: Animator;
  private _message: Message;

  private _hidden: boolean = true;
  private _idleIsPending: boolean = false;
  private _idleComplete: VoidFn | null = null;
  private _offsetTop: number | undefined = undefined;
  private _offsetLeft: number | undefined = undefined;
  private _dragUpdateLoop: number | undefined = undefined;
  private _targetY: number | undefined = undefined;
  private _targetX: number | undefined = undefined;

  constructor(
    virtualAssistant: VirtualAssistantType,
    options: VirtualAssistantOptions = {}
  ) {
    this._logger = new Logger({
      prefix: `Virtual Assistant '${virtualAssistant.name}':`,
      ...options.loggerOptions,
    });

    this.classKey = `virtual-assistant${
      options.classKey ? `-${options.classKey}` : ""
    }`;

    this._el = document.createElement("div");
    setStylesForElement(this._el, {
      position: "fixed",
      zIndex: "1000",
      cursor: "pointer",
      display: "none",
    });
    this._el.classList.add(this.classKey);

    this.addToDom();

    this._queue = new Queue({
      onEmptyCallback: this._onQueueEmpty.bind(this),
      logger: this._logger,
    });
    this._animator = new Animator({
      rootElement: this._el,
      virtualAssistant,
      logger: this._logger,
    });
    this._message = new Message({
      rootElement: this._el,
      logger: this._logger,
      ...options.messageOptions,
    });

    this._setupEvents();
  }

  /**************************** API ************************************/

  /**
   * Checks if the virtual assistant exists in the DOM
   */
  existsInDom(): boolean {
    return !!document.querySelector(this.classKey);
  }

  /**
   * Adds the virtual assistant to the DOM, if not already present
   */
  addToDom(): void {
    this._logger.debug("Adding virtual assistant to DOM");

    if (!this.existsInDom()) {
      document.body.append(this._el);
    } else {
      this._logger.warn(
        `Virtuall Assistant with classKey '${this.classKey}' already exists in DOM`
      );
    }
  }

  /**
   * Removes the virtual assistant from the DOM, if present
   */
  removeFromDom(): void {
    this._logger.debug("Removing virtual assistant from DOM");

    if (this.existsInDom()) {
      document.body.removeChild(this._el);
    } else {
      this._logger.warn(
        `Virtuall Assistant with classKey '${this.classKey}' does not exist in DOM`
      );
    }
  }

  /**
   * Gestures at a given position, if gesture animation exists.
   * Falls back to look animation if gesture animation does not exist.
   */
  gestureAt(x: number, y: number): boolean {
    const direction = this._getDirection(x, y);
    const gestureAnimation = "Gesture" + direction;
    const LookAnimation = "Look" + direction;

    const animation = this.hasAnimation(gestureAnimation)
      ? gestureAnimation
      : LookAnimation;
    return this.play(animation);
  }

  /**
   * Hide the virtual assistant
   */
  hide(fast: boolean, callback: VoidFn): void {
    this._hidden = true;
    this.stop();
    if (fast) {
      this._el.style.display = "none";
      this.stop();
      this.pause();
      if (callback) callback();
      return;
    }

    return this._playInternal("Hide", () => {
      this._el.style.display = "none";
      this.pause();
      if (callback) callback();
    });
  }

  /**
   * Move the virtual assistant to a given position
   */
  moveTo(x: number, y: number, duration: number = 1000): void {
    const direction = this._getDirection(x, y);
    const moveAnimation = "Move" + direction;

    this._addToQueue((complete) => {
      // the simple case
      if (duration === 0) {
        this._el.style.top = `${y}px`;
        this._el.style.left = `${x}px`;
        this.reposition();
        complete();
        return;
      }

      // no animations
      if (!this.hasAnimation(moveAnimation)) {
        this._el.animate({ top: y, left: x }, duration).finished.then(complete);
        return;
      }

      const callback = (name: string, state: AnimatorStates) => {
        // when exited, complete
        if (state === AnimatorStates.EXITED) {
          complete();
        }
        // if waiting,
        if (state === AnimatorStates.WAITING) {
          this._el.animate({ top: y, left: x }, duration).finished.then(() => {
            // after we're done with the movement, do the exit animation
            this._animator.exitAnimation();
          });
        }
      };

      this._playInternal(moveAnimation, callback.bind(this));
    }, this);
  }

  private _playInternal(
    animation: string,
    callback: (currentAnimationName: string, state: number) => void
  ) {
    // if we're inside an idle animation,
    if (this._isIdleAnimation() && this._idleIsPending) {
      this._idleComplete = () => {
        this._playInternal(animation, callback);
      };
    }

    this._animator.showAnimation(animation, callback);
  }

  /**
   * Plays an animation
   */
  play(animation: string, timeout = 5000, cb?: VoidFn): boolean {
    if (!this.hasAnimation(animation)) return false;

    this._addToQueue((complete) => {
      let completed = false;
      // handle callback
      const callback = (name: string, state: AnimatorStates) => {
        if (state === AnimatorStates.EXITED) {
          completed = true;
          if (cb) cb();
          complete();
        }
      };

      // If has timeout, register a timeout function
      window.setTimeout(() => {
        if (completed) return;
        // exit after timeout
        this._animator.exitAnimation();
      }, timeout);

      this._playInternal(animation, callback);
    }, this);

    return true;
  }

  /**
   * Shows the virtual assistant
   */
  show(fast: boolean = false): boolean {
    this._hidden = false;

    if (fast) {
      this._el.style.display = "";
      this.resume();
      this._onQueueEmpty();
      return true;
    }

    if (this._el.style.top === "auto" || this._el.style.left !== "auto") {
      const left = window.innerWidth * 0.8;
      const top = (window.innerHeight + document.body.scrollTop) * 0.8;
      this._el.style.top = `${top}px`;
      this._el.style.left = `${left}px`;
    }

    this.resume();
    return this.play("Show");
  }

  /**
   * Toggles the message box with the given text
   */
  speak(text: string, hold?: Message["_hold"]): void {
    this._logger.info("AddingSpeak", text);
    this._addToQueue((complete) => {
      this._message.speak(complete, text, hold);
    }, this);
  }

  /**
   * Close the current message
   */
  closeMessage(): void {
    this._message.hide();
  }

  /**
   * Adds a delay to the queue
   */
  delay(time?: number): void {
    time = time || 250;

    this._addToQueue((complete) => {
      this._onQueueEmpty();
      setTimeout(complete, time);
    });
  }

  /**
   * Stops the current animation
   */
  stopCurrent(): void {
    this._animator.exitAnimation();
    this._message.close();
  }

  /**
   * Stops the current animation and clears the queue
   */
  stop(): void {
    // clear the queue
    this._queue.clear();
    this._animator.exitAnimation();
    this._message.hide();
  }

  /**
   * Checks if an animation with the given name exists
   */
  hasAnimation(name: string): boolean {
    return this._animator.hasAnimation(name);
  }

  /**
   * Gets a list of animation names
   */
  animations(): string[] {
    return this._animator.animations();
  }

  /**
   * Plays a random animation
   */
  animate(): boolean {
    const animations = this.animations();
    const anim = getRandomFromArray(animations);
    // skip idle animations
    if (anim.indexOf("Idle") === 0) {
      return this.animate();
    }
    return this.play(anim);
  }

  /**************************** Utils ************************************/

  private _getDirection(x: number, y: number): Direction {
    const targetBoundingRect = this._el.getBoundingClientRect();
    const targetHeight = parseFloat(
      getComputedStyle(this._el, null).height.replace("px", "")
    );
    const targetWidth = parseFloat(
      getComputedStyle(this._el, null).width.replace("px", "")
    );

    const offsetTop = targetBoundingRect.top + document.body.scrollTop;
    const offsetLeft = targetBoundingRect.left + document.body.scrollLeft;

    if (
      [offsetTop, offsetLeft, targetHeight, targetWidth].some(
        (it) => it == null || isNaN(it)
      )
    ) {
      throw new Error(
        `Direction values missing: '${offsetTop}', '${offsetLeft}', '${targetHeight}', '${targetWidth}'`
      );
    }

    const centerX = offsetLeft + targetWidth / 2;
    const centerY = offsetTop + targetHeight / 2;

    const lookCoordinateX = centerX - x;
    const lookCoordinateY = centerY - y;

    const degree = Math.round(
      (180 * Math.atan2(lookCoordinateY, lookCoordinateX)) / Math.PI
    );

    // Left and Right are for the character, not the screen
    if (-45 <= degree && degree < 45) return Direction.Right;
    if (45 <= degree && degree < 135) return Direction.Up;
    if ((135 <= degree && degree <= 180) || (-180 <= degree && degree < -135)) {
      return Direction.Left;
    }
    if (-135 <= degree && degree < -45) return Direction.Down;

    // sanity check
    return Direction.Top;
  }

  /**************************** Queue and Idle handling ************************************/

  /**
   * Handle empty queue.
   * We need to transition the animation to an idle state
   */
  private _onQueueEmpty(): void {
    if (this._hidden || this._isIdleAnimation()) return;
    const idleAnim = this._getRandomIdleAnimation();
    this._idleIsPending = true;

    this._animator.showAnimation(idleAnim, this._onIdleComplete.bind(this));
  }

  private _onIdleComplete(_: string, state: AnimatorStates): void {
    if (state === AnimatorStates.EXITED && !this._idleIsPending) {
      this._idleComplete?.();
      this._idleIsPending = false;
    }
  }

  /** If the current animation is Idle */
  private _isIdleAnimation(): boolean {
    return this._animator.currentAnimationName?.startsWith("Idle") || false;
  }

  /** Gets Idle animations */
  private _getIdleAnimations(): string[] {
    const animations = this.animations();

    return animations.filter((a) => a.startsWith("Idle"));
  }

  /** Gets a random Idle animation */
  private _getRandomIdleAnimation(): string {
    const idleAnimations = this._getIdleAnimations();

    return getRandomFromArray(idleAnimations);
  }

  /**************************** Events ************************************/

  private _setupEvents(): void {
    this._logger.log("Setting up event listeners");

    window.addEventListener("resize", this.reposition.bind(this));
    this._el.addEventListener("mousedown", this._onMouseDown.bind(this));
    this._el.addEventListener("dblclick", this._onDoubleClick.bind(this));
  }

  private _onDoubleClick(): void {
    if (!this.play("ClickedOn")) {
      this.animate();
    }
  }

  /**
   * Repositions the assistant withing the window, if out of bounds
   */
  reposition(): void {
    const margin = 5;
    const targetBoundingRect = this._el.getBoundingClientRect();
    const targetOffsetHeight = this._el.offsetHeight;
    const targetOffsetWidth = this._el.offsetWidth;
    const windowInnerWidth = window.innerWidth;
    const windowInnerHeight = window.innerHeight;

    this._logger.debug("Reposition", {
      targetBoundingRect,
      targetOffsetHeight,
      targetOffsetWidth,
      windowInnerHeight,
      windowInnerWidth,
    });

    let top = targetBoundingRect.top;
    let left = targetBoundingRect.left;

    if (top - margin < 0) {
      top = margin;
    } else if (top + targetOffsetHeight + margin > windowInnerHeight) {
      top = windowInnerHeight - targetOffsetHeight - margin;
    }

    if (left - margin < 0) {
      left = margin;
    } else if (left + targetOffsetWidth + margin > windowInnerWidth) {
      left = windowInnerWidth - targetOffsetWidth - margin;
    }

    this._el.style.top = `${top}px`;
    this._el.style.left = `${left}px`;
    // reposition message
    this._message.reposition();
  }

  private _onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this._logger.debug("MouseDown Event", this);
    this._startDrag(e);
  }

  /**************************** Drag ************************************/

  private _startDrag(e: MouseEvent): void {
    this._logger.debug("MouseDrag Event", this);
    // pause animations
    this.pause();
    this._message.hide(true);
    const { top, left } = this._calculateClickOffset(e);
    this._offsetTop = top;
    this._offsetLeft = left;
    this._dragMove(e);

    const mouseMoveListener = this._dragMove.bind(this);
    const mouseUpListener = () => {
      this._finishDrag(mouseMoveListener, mouseUpListener);
    };

    window.addEventListener("mousemove", mouseMoveListener);
    window.addEventListener("mouseup", mouseUpListener);

    this._dragUpdateLoop = window.setTimeout(
      this._updateLocation.bind(this),
      10
    );
  }

  private _calculateClickOffset(e: MouseEvent): { top: number; left: number } {
    const mouseX = e.pageX;
    const mouseY = e.pageY;
    const targetBoundingRect = this._el.getBoundingClientRect();
    return {
      top: mouseY - targetBoundingRect.top + document.body.scrollTop,
      left: mouseX - targetBoundingRect.left + document.body.scrollLeft,
    };
  }

  private _updateLocation(): void {
    if (this._targetX && this._targetY) {
      this._el.style.top = `${this._targetY}px`;
      this._el.style.left = `${this._targetX}px`;
      this._dragUpdateLoop = window.setTimeout(
        this._updateLocation.bind(this),
        10
      );
    }
  }

  private _dragMove(e: MouseEvent): void {
    e.preventDefault();
    const x = e.clientX - (this._offsetLeft || 0);
    const y = e.clientY - (this._offsetTop || 0);
    this._targetX = x;
    this._targetY = y;
  }

  private _finishDrag(mouseMoveListener?: any, mouseUpListener?: any): void {
    this._logger.debug("FinishDrag Event", this);
    window.clearTimeout(this._dragUpdateLoop);
    // remove handles
    window.removeEventListener("mousemove", mouseMoveListener);
    window.removeEventListener("mouseup", mouseUpListener);
    // resume animations
    this._message.show();
    this.reposition();
    this.resume();
  }

  private _addToQueue(func: VoidCbFn, scope?: this): void {
    if (scope) func = func.bind(scope);
    this._queue.add(func);
  }

  /**************************** Pause and Resume ************************************/

  /**
   * Pauses the assistant
   */
  pause(): void {
    this._animator.pause();
    this._message.pause();
  }

  /**
   * Resumes the assistant
   */
  resume(): void {
    this._animator.resume();
    this._message.resume();
  }
}
