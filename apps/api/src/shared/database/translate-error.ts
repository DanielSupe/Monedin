import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/domain-errors.js";

/**
 * Traduce un fallo del motor a un error de dominio.
 *
 * Se aplica en la capa de repositorio, que es la única que habla con la base de
 * datos. Los fallos previsibles salen como errores de dominio con su estado HTTP
 * correcto; el resto se relanza tal cual y acaba como un 500 con identificador
 * de incidente.
 *
 * NADA del texto del motor llega al cliente. Los mensajes de PostgreSQL llevan
 * nombres de tablas, de restricciones y, en el caso de una violación de CHECK,
 * la fila completa que falló: `Failing row contains (...)`. Eso es exactamente
 * lo que la spec `api-error-contract` prohíbe filtrar.
 *
 * Los códigos y formas están tomados de errores reales de Prisma 7 sobre
 * PostgreSQL 16, no de la documentación.
 */

/** Códigos de error de PostgreSQL que sabemos interpretar. */
const POSTGRES_CHECK_VIOLATION = "23514";
/** Lo levanta el disparador que hace inmutable el historial de monedas. */
const POSTGRES_RESTRICT_VIOLATION = "23001";

interface PrismaKnownError {
  code: string;
  meta?: {
    driverAdapterError?: {
      cause?: {
        originalCode?: string;
        originalMessage?: string;
      };
    };
  };
}

function asPrismaKnownError(error: unknown): PrismaKnownError | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { code?: unknown; name?: unknown };
  if (typeof candidate.code !== "string") return undefined;
  if (candidate.name !== "PrismaClientKnownRequestError") return undefined;
  return error as PrismaKnownError;
}

function driverCause(error: PrismaKnownError): {
  code: string | undefined;
  message: string | undefined;
} {
  const cause = error.meta?.driverAdapterError?.cause;
  return { code: cause?.originalCode, message: cause?.originalMessage };
}

/**
 * Una violación de clave ajena significa dos cosas distintas según la dirección.
 *
 * Al insertar, la entidad referida no existe: eso es un 404. Al borrar, hay
 * filas que dependen de la que se intenta borrar: eso es un conflicto de estado,
 * un 409. PostgreSQL las distingue por el verbo con el que empieza el mensaje.
 */
function isBlockedByDependentRows(originalMessage: string | undefined): boolean {
  return originalMessage?.startsWith("update or delete on table") ?? false;
}

/**
 * Convierte el error si lo reconoce; si no, lo devuelve tal cual para que suba
 * como fallo inesperado.
 */
export function translateDatabaseError(error: unknown): unknown {
  const known = asPrismaKnownError(error);
  if (known === undefined) return error;

  const cause = driverCause(known);

  switch (known.code) {
    // Choque con un valor único ya existente.
    case "P2002":
      return new ConflictError();

    // Clave ajena. El sentido depende de la operación.
    case "P2003":
      return isBlockedByDependentRows(cause.message) ? new ConflictError() : new NotFoundError();

    // La fila sobre la que se iba a operar no existe.
    case "P2025":
      return new NotFoundError();

    // Un valor no cabe en su columna: entrada inválida.
    case "P2000":
      return new ValidationError([]);

    // Error del motor que Prisma no clasifica. Aquí llegan las restricciones
    // CHECK y el disparador del historial.
    case "P2039":
      if (cause.code === POSTGRES_CHECK_VIOLATION) {
        return new ValidationError([]);
      }
      if (cause.code === POSTGRES_RESTRICT_VIOLATION) {
        return new ConflictError();
      }
      return error;

    default:
      return error;
  }
}

/**
 * Ejecuta una operación contra la base de datos traduciendo sus fallos.
 *
 * Es la forma en que un repositorio envuelve sus consultas:
 *
 * ```ts
 * return withTranslatedErrors(() => getPrisma().task.create({ data }));
 * ```
 *
 * Un módulo que necesite un mensaje más concreto —"ese correo ya está
 * registrado" en vez del genérico— captura el error de dominio y lo relanza con
 * el texto de su catálogo. La traducción de aquí no adivina de qué campo se
 * trata, porque a este nivel no se puede saber sin leer nombres de columnas.
 */
export async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw translateDatabaseError(error);
  }
}
