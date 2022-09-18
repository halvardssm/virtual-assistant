export type VoidFn = () => void;
export type VoidCbFn = (cb: VoidFn) => void;

export type VirtualAssistantBranchingType = {
  /**
   * The index of the frame to play (within the current animation)
   */
  frameIndex: number;
  /**
   * Weight of this branch (0-100)
   */
  weight: number;
};

export type VirtualAssistantAnimationFramesType = {
  /**
   * The frame duration in milliseconds.
   */
  duration: number;
  /**
   * The frame images. Used together with overlayCount from the VirtualAssistantType.
   * @see VirtualAssistantType.overlayCount
   */
  images?: Array<[number, number]>;
  /**
   * The sound for the frame. Will continue until the sound is over,
   * even when switching frames.
   * @see VirtualAssistantAudioType.sounds
   */
  sound?: string;
  /**
   * The frame index which can be used for a graceful exit of the animation.
   * Used when you need to cancel a long animation mid sequence.
   */
  exitBranch?: number;
  /**
   * Possible branches for the animation.
   */
  branching?: VirtualAssistantBranchingType[];
};

export type VirtualAssistantAnimationType = {
  /**
   * The animation frames
   * @see VirtualAssistantAnimationFramesType
   */
  frames: VirtualAssistantAnimationFramesType[];
  /**
   * Indicates that this animation contains exitBranching
   * @see VirtualAssistantAnimationFramesType.exitBranch
   */
  useExitBranching?: boolean;
};

/**
 * Web audio mime types
 */
export type MimeTypeAudio =
  | "audio/3gpp"
  | "audio/aac"
  | "audio/flac"
  | "audio/mpeg"
  | "audio/mp3"
  | "audio/mp4"
  | "audio/ogg"
  | "audio/wav"
  | "audio/webm"
  | string;

export type VirtualAssistantAudioType = {
  /**
   * Web audio mime types
   */
  mime: MimeTypeAudio;
  /**
   * The audio files in key value pairs.
   * Value can be base64 encoded or a URL.
   */
  sounds: Record<string, URL | string>;
};

export type VirtualAssistantType = {
  /**
   * The amount of overlays to use for the virtual assistant frames, usually 1
   */
  overlayCount: number;
  /**
   * The size of the virtual frame in the map (in pixels).
   * This is the size of one frame, not the whole animation.
   * @see VirtualAssistantType.map
   */
  framesize: [number, number];
  /**
   * The animation sequences
   */
  animations: Record<string, VirtualAssistantAnimationType>;
  /**
   * The audio files
   */
  audio: VirtualAssistantAudioType[];
  /**
   * The name of the virtual assistant (used for logging)
   */
  name: string;
  /**
   * The animation map. Each frame has to be the same size as the framesize.
   * Can be base64 encoded or a URL.
   * @see VirtualAssistantType.framesize
   */
  map: URL | string;
};

export const getRandomFromArray = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const setStylesForElement = (
  el: HTMLElement,
  styles: Partial<CSSStyleDeclaration> = {}
): void => {
  for (const [key, style] of Object.entries(styles)) {
    if (style != null) {
      el.style[key as any] = style.toString();
    }
  }
};
