# Virtual Assistant

Your very own virtual assistant. Perfect for when you need to create a helper for your website, or simply want to create an interactive companion.

Taken from [Clippy.JS](https://github.com/smore-inc/clippy.js) and completely refactored, you can bring your favorite Microsoft helpers to the web, or create your own!

## Usage

This module is framework agnostic, but includes a hook for use with React.

### JS

```js
const va = new VirtualAssistant(virtualAssistant, options);
va.show()
```

### React

```tsx
export function App() {
  const va = useVirtualAssistant(Clippy)

  return <div>
    Hello World
    <button onClick={() => va.current?.speak('Hello World', true)}>Say Hello</button>
  </div>
}
```

## Methods

```ts
    /**
     * Checks if the virtual assistant exists in the DOM
     */
    existsInDom(): boolean;
    /**
     * Adds the virtual assistant to the DOM, if not already present
     */
    addToDom(): void;
    /**
     * Removes the virtual assistant from the DOM, if present
     */
    removeFromDom(): void;
    /**
     * Gestures at a given position, if gesture animation exists.
     * Falls back to look animation if gesture animation does not exist.
     */
    gestureAt(x: number, y: number): boolean;
    /**
     * Hide the virtual assistant
     */
    hide(fast: boolean, callback: VoidFn): void;
    /**
     * Move the virtual assistant to a given position
     */
    moveTo(x: number, y: number, duration?: number): void;
    /**
     * Plays an animation
     */
    play(animation: string, timeout?: number, cb?: VoidFn): boolean;
    /**
     * Shows the virtual assistant
     */
    show(fast?: boolean): boolean;
    /**
     * Toggles the message box with the given text
     */
    speak(text: string, hold?: Message["_hold"]): void;
    /**
     * Close the current message
     */
    closeMessage(): void;
    /**
     * Adds a delay to the queue
     */
    delay(time?: number): void;
    /**
     * Stops the current animation
     */
    stopCurrent(): void;
    /**
     * Stops the current animation and clears the queue
     */
    stop(): void;
    /**
     * Checks if an animation with the given name exists
     */
    hasAnimation(name: string): boolean;
    /**
     * Gets a list of animation names
     */
    animations(): string[];
    /**
     * Plays a random animation
     */
    animate(): boolean;
    /**
     * Repositions the assistant withing the window, if out of bounds
     */
    reposition(): void;
    /**
     * Pauses the assistant
     */
    pause(): void;
    /**
     * Resumes the assistant
     */
    resume(): void;
```

## Types

```ts
export declare type VirtualAssistantBranchingType = {
    /**
     * The index of the frame to play (within the current animation)
     */
    frameIndex: number;
    /**
     * Weight of this branch (0-100)
     */
    weight: number;
};

export declare type VirtualAssistantAnimationFramesType = {
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

export declare type VirtualAssistantAnimationType = {
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
export declare type MimeTypeAudio = "audio/3gpp" | "audio/aac" | "audio/flac" | "audio/mpeg" | "audio/mp3" | "audio/mp4" | "audio/ogg" | "audio/wav" | "audio/webm" | string;

export declare type VirtualAssistantAudioType = {
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

export declare type VirtualAssistantType = {
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
```

## Creating your own

See [Clippy](./agents/Clippy) in the [agents](./agents) folder for an example of how to create your own. Start from the `VirtualAssistantType`, and add fields as you go.
