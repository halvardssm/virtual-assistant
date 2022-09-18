import { Logger } from "./logger";
import {
  setStylesForElement,
  VirtualAssistantAnimationFramesType,
  VirtualAssistantAnimationType,
  VirtualAssistantAudioType,
  VirtualAssistantType,
} from "./utils";

export type OnEndCallback = (
  currentAnimationName: string,
  state: number
) => void;

export enum AnimatorStates {
  EXITED,
  WAITING,
}

export type AnimatorOptions = {
  logger?: Logger;
  rootElement: HTMLDivElement;
  virtualAssistant: VirtualAssistantType;
};

export class Animator {
  // TODO Change this to current animation (change to object with more info)
  currentAnimationName: string | undefined = undefined;
  isMuted = false;

  private readonly _logger: Logger;
  private readonly _rootElement: HTMLDivElement;
  private readonly _data: VirtualAssistantType;
  private readonly _overlays: HTMLDivElement[];

  private _currentFrameIndex: number = 0;
  private _exiting = false;
  private _started = false;
  private _currentFrame: VirtualAssistantAnimationFramesType | null = null;
  private _loop: number | undefined = undefined;
  private _currentAnimation: VirtualAssistantAnimationType | undefined =
    undefined;
  private _endCallback: OnEndCallback | undefined = undefined;
  private _sounds: Record<string, HTMLAudioElement> = {};

  constructor(options: AnimatorOptions) {
    this._logger = options.logger
      ? options.logger.clone({
          prefix: options.logger.prefix + " Animator:",
        })
      : new Logger({ prefix: "Animator:" });

    this._rootElement = options.rootElement;
    this._data = options.virtualAssistant;
    this._overlays = [this._rootElement];

    this._setPreferredAudio(this._data.audio);
    this._setupElement(this._rootElement, this._data.map);

    let curr = this._rootElement;
    for (let i = 1; i < this._data.overlayCount; i++) {
      const nodeInnerDiv = document.createElement("div");
      const inner = this._setupElement(nodeInnerDiv, this._data.map);

      curr.append(inner);
      this._overlays.push(inner);
      curr = inner;
    }
  }

  _setPreferredAudio(
    virtualAssistantAudio: VirtualAssistantType["audio"]
  ): void {
    const addSounds = (sounds: VirtualAssistantAudioType["sounds"]) => {
      for (const [key, sound] of Object.entries(sounds)) {
        this._sounds[key] = new Audio(sound);
      }
    };

    const audioElement = document.createElement("audio");

    let maybeSupported: VirtualAssistantAudioType | undefined = undefined;

    for (const audio of virtualAssistantAudio) {
      if (audioElement.canPlayType(audio.mime) === "") continue;
      if (
        audioElement.canPlayType(audio.mime) === "maybe" &&
        maybeSupported === undefined
      ) {
        maybeSupported = audio;
      }

      addSounds(audio.sounds);
      return;
    }

    if (maybeSupported !== undefined) {
      const { sounds, mime } = maybeSupported as VirtualAssistantAudioType;
      addSounds(sounds);
      this._logger.warn(`Audio format '${mime}'maybe supported`);
    }

    this._logger.warn("No compatible audio format found");
  }

  animations() {
    const res: string[] = [];
    for (const key in this._data.animations) {
      res.push(key);
    }
    return res;
  }

  hasAnimation(name: string) {
    return !!this._data.animations[name];
  }

  exitAnimation() {
    this._exiting = true;
  }

  showAnimation(
    animationName: string,
    stateChangeCallback: Animator["_endCallback"]
  ) {
    this._exiting = false;

    if (!this.hasAnimation(animationName)) {
      return false;
    }

    this._currentAnimation = this._data.animations[animationName];
    this.currentAnimationName = animationName;

    if (!this._started) {
      this._step();
      this._started = true;
    }

    this._currentFrameIndex = 0;
    this._currentFrame = null;
    this._endCallback = stateChangeCallback;

    return true;
  }

  /** Pause animation execution */
  pause() {
    window.clearTimeout(this._loop);
  }

  /** Resume animation */
  resume() {
    this._step();
  }

  private _setupElement(el: HTMLDivElement, mapUrl: URL) {
    const [width, height] = this._data.framesize;

    setStylesForElement(el, {
      display: "none",
      width: `${width}px`,
      height: `${height}px`,
      background: `url('${mapUrl.toString()}') no-repeat`,
    });

    return el;
  }

  private _draw() {
    let images: VirtualAssistantAnimationFramesType["images"] = [];
    if (this._currentFrame) images = this._currentFrame.images || [];

    for (let i = 0; i < this._overlays.length; i++) {
      if (i < images.length) {
        const [xCoordinate, yCoordinate] = images[i];
        const backgroundPosition = `${-xCoordinate}px ${-yCoordinate}px`;
        this._overlays[i].style.display = "block";
        this._overlays[i].style.backgroundPosition = backgroundPosition;
      } else {
        this._overlays[i].style.display = "none";
      }
    }
  }

  private _getNextAnimationFrame() {
    if (!this._currentAnimation) return Number.MAX_VALUE;
    // No current frame. start animation.
    if (!this._currentFrame) return 0;
    const currentFrame = this._currentFrame;
    const branching = currentFrame.branching;

    if (this._exiting && currentFrame.exitBranch !== undefined) {
      return currentFrame.exitBranch;
    } else if (branching) {
      let randomNumber = Math.random() * 100;
      for (const branch of branching.branches) {
        if (randomNumber <= branch.weight) {
          return branch.frameIndex;
        }

        randomNumber -= branch.weight;
      }
    }

    return this._currentFrameIndex + 1;
  }

  private _playSound() {
    const s = this._currentFrame?.sound;
    if (!s) return;
    const audio = this._sounds[s];
    if (audio && !this.isMuted) audio.play();
  }

  private _atLastFrame() {
    if (this._currentAnimation) {
      return (
        this._currentFrameIndex >= this._currentAnimation.frames.length - 1
      );
    }
    return true;
  }

  private _step() {
    if (!this._currentAnimation || !this.currentAnimationName) return;
    const newFrameIndex = Math.min(
      this._getNextAnimationFrame(),
      this._currentAnimation.frames.length - 1
    );
    const frameChanged =
      !this._currentFrame || this._currentFrameIndex !== newFrameIndex;
    this._currentFrameIndex = newFrameIndex;

    // always switch frame data, unless we're at the last frame of an animation with a useExitBranching flag.
    if (!(this._atLastFrame() && this._currentAnimation.useExitBranching)) {
      this._currentFrame =
        this._currentAnimation.frames[this._currentFrameIndex];
    }

    this._draw();
    this._playSound();

    this._loop = window.setTimeout(
      this._step.bind(this),
      this._currentFrame?.duration
    );

    // fire events if the frames changed, and we reached an end
    if (this._endCallback && frameChanged && this._atLastFrame()) {
      if (this._currentAnimation.useExitBranching && !this._exiting) {
        this._endCallback(this.currentAnimationName, AnimatorStates.WAITING);
      } else {
        this._endCallback(this.currentAnimationName, AnimatorStates.EXITED);
      }
    }
  }
}
