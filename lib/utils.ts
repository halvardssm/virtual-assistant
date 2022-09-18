export type VoidFn = () => void;
export type VoidCbFn = (cb: VoidFn) => void;

export type VirtualAssistantAnimationFramesType = {
  duration: number;
  images?: Array<[number, number]>;
  sound?: string;
  exitBranch?: number;
  branching?: {
    branches: { frameIndex: number; weight: number }[];
  };
};
export type VirtualAssistantAnimationType = {
  frames: VirtualAssistantAnimationFramesType[];
  useExitBranching?: boolean;
};
export type VirtualAssistantType = {
  overlayCount: number;
  framesize: [number, number];
  animations: Record<string, VirtualAssistantAnimationType>;
  audio: VirtualAssistantAudioType[];
  name: string;
  map: URL;
};

export type VirtualAssistantAudioType = {
  mime: MimeTypeAudio;
  sounds: Record<string, string>;
};

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

export type Debugger = (text: string, context?: any) => void;
export const getDebugger = (debug: boolean = false): Debugger => {
  const prefix = "VA EVENT";
  if (!debug) {
    return () => {};
  }
  return (text, context) => {
    console.debug(`${prefix};${text}:`, context);
  };
};

export const getRandomFromArray = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};
