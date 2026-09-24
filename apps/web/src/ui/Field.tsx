import { type ReactNode, createContext, useContext, useId } from "react";
import { cx } from "./cx.js";

interface FieldContextValue {
  controlId: string;
  describedBy: string | undefined;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface FieldProps {
  label: string;

  help?: string;

  error?: string;
  children: ReactNode;
}

export function Field({ label, help, error, children }: FieldProps): React.ReactElement {
  const base = useId();
  const controlId = `${base}-control`;
  const helpId = `${base}-help`;
  const errorId = `${base}-error`;

  const describedBy =
    cx(help !== undefined && helpId, error !== undefined && errorId) || undefined;

  return (
    <FieldContext.Provider value={{ controlId, describedBy, invalid: error !== undefined }}>
      <div className="flex flex-col gap-1">
        <label htmlFor={controlId} className="text-small font-semibold text-ink">
          {label}
        </label>

        {children}

        {help !== undefined && (
          <p id={helpId} className="text-micro text-ink-muted">
            {help}
          </p>
        )}

        {error !== undefined && (
          <p id={errorId} role="alert" className="text-small font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
