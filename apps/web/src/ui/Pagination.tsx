import type { ReactNode } from "react";
import { messages } from "../lib/messages.js";
import { cx } from "./cx.js";

export interface PaginationProps {
  page: number;
  totalPages: number;
  /**
   * Los pasos, como CONTENIDO y no construidos aquí.
   *
   * Una pieza no puede importar el router: se monta en el catálogo vivo sin
   * proveedores y en los tests sin aplicación, y hay un test que le prohíbe
   * importar de `features/` o de `api/`. Una paginación que construyera sus
   * propios enlaces necesitaría saber a qué ruta pertenece y con qué parámetros
   * de búsqueda, que es justo lo que no puede saber.
   *
   * Se omite el que no existe: no hay anterior en la primera página ni
   * siguiente en la última. Quien la usa lo expresa no pasando el hueco.
   */
  previous?: ReactNode;
  next?: ReactNode;
  className?: string;
}

/**
 * La posición dentro de un listado paginado, y los pasos a los lados.
 *
 * Existe porque el mismo bloque estaba copiado en CUATRO pantallas, con los
 * mismos textos declarados cuatro veces en el catálogo de mensajes. El design
 * de `add-design-system` ya dijo que saldría de aquí.
 *
 * Con una sola página no se dibuja: enseñar «1 / 1» y dos pasos apagados es
 * ocupar sitio para no decir nada.
 */
export function Pagination({
  page,
  totalPages,
  previous,
  next,
  className,
}: PaginationProps): React.ReactElement | null {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label={messages.ui.paginationLabel}
      className={cx("flex flex-wrap items-center justify-center gap-3", className)}
    >
      {previous}

      <span className="text-small text-ink-muted">
        {page} / {totalPages}
      </span>

      {next}
    </nav>
  );
}
