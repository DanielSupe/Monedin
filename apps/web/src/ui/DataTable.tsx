import type { ReactNode } from "react";
import { cx } from "./cx.js";

/** Una columna: su encabezado y cómo se alinea lo que cae debajo. */
export interface DataColumn {
  /** Estable y único. Es la clave de React y la de cada celda de su fila. */
  key: string;
  header: ReactNode;
  /**
   * A la derecha para las cantidades, que es donde una columna de cifras se
   * lee comparando. Por defecto a la izquierda, como el texto.
   */
  align?: "start" | "end";
}

export interface DataRow {
  /** Estable y único: es la clave de la fila. */
  key: string;
  /** Una entrada por columna, indexada por su `key`. */
  cells: Record<string, ReactNode>;
}

export interface DataTableProps {
  /** Qué es esta tabla. Se anuncia, y NO es opcional: una tabla sin nombre
   *  obliga a quien la escucha a deducirlo de la primera celda. */
  caption: string;
  columns: DataColumn[];
  rows: DataRow[];
  className?: string;
}

/**
 * Datos tabulares: encabezados de columna y filas cuyos valores caen en las
 * mismas posiciones.
 *
 * Es la primera pieza del sistema desde `add-design-system` y entra por lo que
 * ya justificó a `Pagination`: un bloque copiado en dos pantallas son dos
 * bloques que se separan. Aquí pesa más, porque una tabla accesible tiene
 * partes fáciles de olvidar —el nombre de la tabla, el ámbito de cada
 * encabezado— y olvidarlas no rompe nada visible.
 *
 * NO sabe de dominio. Recibe encabezados y celdas ya compuestos, igual que
 * `Pagination` recibe sus enlaces: por eso se monta en el catálogo vivo sin
 * aplicación y en un test sin proveedores. Que un canje rechazado vaya en
 * advertencia lo decide quien la usa, poniendo su `Badge` en la celda.
 *
 * SIN filas no dibuja nada. Una tabla con encabezados y el hueco debajo dice
 * «esto está roto» donde el estado vacío del sistema dice «todavía no hay
 * nada», y son cosas distintas. Quien la usa pone el segundo.
 *
 * Ver la decisión 3 del design de `redesign-child-surfaces`.
 */
export function DataTable({
  caption,
  columns,
  rows,
  className,
}: DataTableProps): React.ReactElement | null {
  if (rows.length === 0) {
    return null;
  }

  return (
    /*
      El desplazamiento vive AQUÍ y no en la página: una tabla ancha se recorre
      dentro de su propia caja, y el resto de la pantalla no se mueve. Que las
      columnas quepan sin llegar a esto NO lo cubre ningún test —jsdom no aplica
      CSS—, así que es un respaldo y no el plan.
    */
    <div className={cx("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left">
        {/*
          El nombre de la tabla se anuncia y no se ve: el título de la pantalla
          ya lo dice justo encima, y repetirlo sería decirlo dos veces a quien
          mira. A quien escucha no le llega el título de la pantalla al entrar
          en la tabla, y por eso aquí sí hace falta.
        */}
        <caption className="sr-only">{caption}</caption>

        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  "text-small px-2 py-2 font-semibold text-ink-muted",
                  column.align === "end" && "text-right",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border last:border-b-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "text-body px-2 py-3 align-middle",
                    column.align === "end" && "text-right",
                  )}
                >
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
