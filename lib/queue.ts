import { Logger } from "./logger";
import type { VoidCbFn, VoidFn } from "./utils";

export type QueueOptions = {
  logger?: Logger;
  onEmptyCallback: VoidFn;
};

export class Queue {
  private readonly _logger: Logger;
  private readonly _onEmptyCallback: VoidFn;

  private _active = false;
  private _queue: Array<VoidCbFn> = [];

  constructor(options: QueueOptions) {
    this._logger = options.logger
      ? options.logger.clone({
          prefix: options.logger.prefix + " Queue:",
        })
      : new Logger({ prefix: "Queue:" });

    this._onEmptyCallback = options.onEmptyCallback;
  }

  add(func: VoidCbFn) {
    this._queue.push(func);

    if (this._queue.length === 1 && !this._active) {
      this._progressQueue();
    }
  }

  clear() {
    this._queue = [];
  }

  next() {
    this._active = false;
    this._progressQueue();
  }

  private _progressQueue() {
    // stop if nothing left in queue
    if (!this._queue.length) {
      this._onEmptyCallback();
      return;
    }

    const f = this._queue.shift();
    if (f) {
      this._active = true;

      // execute function
      const completeFunction = this.next.bind(this);
      f(completeFunction);
    }
  }
}
