/**
 * Logger mínimo.
 *
 * El formato definitivo (texto legible o JSON estructurado) está deliberadamente
 * sin decidir hasta que exista un destino de logs real en el servidor; ver las
 * preguntas abiertas del design. Lo que sí está decidido es que el identificador
 * de incidente viaja en el log, y eso funciona con cualquier formato.
 */

/**
 * Niveles de log, de mas a menos grave.
 *
 * UNICA definicion: el esquema de entorno valida `LOG_LEVEL` contra esta lista
 * en vez de repetirla.
 */
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

/** Fija el nivel de log. Lo llama el arranque con el valor de la configuración. */
export function configureLogger(level: LogLevel): void {
  currentLevel = level;
}

function enabled(level: LogLevel): boolean {
  return SEVERITY[level] <= SEVERITY[currentLevel];
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!enabled(level)) return;

  const line = `[${level}] ${message}`;
  // Los fallos van a stderr; el resto a stdout, que es donde los recoge un
  // agregador de logs sin tratarlos como incidencias.
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
