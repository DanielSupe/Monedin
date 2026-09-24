export const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const SEVERITY: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

let currentLevel: LogLevel = "info";

export function configureLogger(level: LogLevel): void {
  currentLevel = level;
}

function enabled(level: LogLevel): boolean {
  return SEVERITY[level] <= SEVERITY[currentLevel];
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!enabled(level)) return;

  const line = `[${level}] ${message}`;

  // eslint-disable-next-line no-console
  const target = SEVERITY[level] <= SEVERITY.error ? console.error : console.log;

  if (context === undefined) {
    target(line);
  } else {
    target(line, context);
  }
}

export const logger = {
  fatal: (message: string, context?: Record<string, unknown>) => emit("fatal", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context),
  trace: (message: string, context?: Record<string, unknown>) => emit("trace", message, context),
};
