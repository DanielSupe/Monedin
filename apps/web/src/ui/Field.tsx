import { type ReactNode, createContext, useContext, useId } from "react";
import { cx } from "./cx.js";

interface FieldContextValue {
  controlId: string;
  describedBy: string | undefined;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Lo que un control consume de su `Field`.
 *
 * Devuelve `null` fuera de un `Field`, porque una entrada suelta es legítima
 * —un buscador sin etiqueta visible, por ejemplo—. Lo que no es legítimo es que
 * cada pantalla tenga que acordarse de cablear `id` y `aria-describedby` a mano:
 * eso es lo que esta pieza hace por ellas.
 */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface FieldProps {
  label: string;
  /** Texto de ayuda permanente. Se anuncia junto al control. */
  help?: string;
  /** Mensaje de error. Si viene, el control queda marcado como inválido. */
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

        {/*
          LA AYUDA BAJA UN PASO RESPECTO A LA ETIQUETA, y no es simetría rota: en
          las maquetas la etiqueta son 15 y la ayuda 13. Son dos papeles, y el
          primero que se lee es el nombre del campo.

          El ERROR se queda al tamaño de la etiqueta a propósito: hay que leerlo,
          y dejarlo como el texto más pequeño de la pantalla es lo contrario.
        */}
        {help !== undefined && (
          <p id={helpId} className="text-micro text-ink-muted">
            {help}
          </p>
        )}

        {/*
          `role="alert"` y no solo el color: un error que solo se ve en rojo no
          existe para quien usa un lector de pantalla.
        */}
        {error !== undefined && (
          <p id={errorId} role="alert" className="text-small font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
