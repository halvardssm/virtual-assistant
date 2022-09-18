export type LogLevel = "debug" | "log" | "info" | "warn" | "error" | "silent";

const LOG_LEVEL_HIERARCHY: Record<LogLevel, number> = {
  debug: 0,
  log: 1,
  info: 2,
  warn: 3,
  error: 4,
  silent: 5,
};

export type LoggerOptions = {
  logLevel?: LogLevel;
  prefix?: string;
};

export class Logger {
  logLevel: LogLevel;
  prefix: string;
  constructor(options: LoggerOptions = {}) {
    this.logLevel = options.logLevel || "debug";
    this.prefix = options.prefix || "";
  }

  _getLogHierarchy = (level: LogLevel = "debug"): number =>
    LOG_LEVEL_HIERARCHY[level] || 0;

  _getCurrentLogHierarchy = (): number => this._getLogHierarchy(this.logLevel);

  debug: Console["debug"] = (...args: any[]) => {
    if (this._getCurrentLogHierarchy() <= this._getLogHierarchy("debug")) {
      console.debug(`DEBUG - ${this.prefix}`, ...args);
    }
  };

  log: Console["log"] = (...args: any[]) => {
    if (this._getCurrentLogHierarchy() <= this._getLogHierarchy("log")) {
      console.log(`LOG - ${this.prefix}`, ...args);
    }
  };

  info: Console["info"] = (...args: any[]) => {
    if (this._getCurrentLogHierarchy() <= this._getLogHierarchy("info")) {
      console.info(`INFO - ${this.prefix}`, ...args);
    }
  };

  warn: Console["warn"] = (...args: any[]) => {
    if (this._getCurrentLogHierarchy() <= this._getLogHierarchy("warn")) {
      console.warn(`WARN - ${this.prefix}`, ...args);
    }
  };

  error: Console["error"] = (...args: any[]) => {
    if (this._getCurrentLogHierarchy() <= this._getLogHierarchy("error")) {
      console.error(`ERROR - ${this.prefix}`, ...args);
    }
  };

  clone = (options: LoggerOptions = {}): Logger => {
    return new Logger({
      logLevel: options.logLevel || this.logLevel,
      prefix: options.prefix || this.prefix,
    });
  };
}
