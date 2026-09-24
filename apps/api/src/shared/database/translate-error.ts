import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/domain-errors.js";

const POSTGRES_CHECK_VIOLATION = "23514";

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

function isBlockedByDependentRows(originalMessage: string | undefined): boolean {
  return originalMessage?.startsWith("update or delete on table") ?? false;
}

export function translateDatabaseError(error: unknown): unknown {
  const known = asPrismaKnownError(error);
  if (known === undefined) return error;

  const cause = driverCause(known);

  switch (known.code) {
    case "P2002":
      return new ConflictError();

    case "P2003":
      return isBlockedByDependentRows(cause.message) ? new ConflictError() : new NotFoundError();

    case "P2025":
      return new NotFoundError();

    case "P2000":
      return new ValidationError([]);

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

export async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw translateDatabaseError(error);
  }
}
