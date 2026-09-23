import type { ReactNode } from "react";
import { cx } from "./cx.js";

export interface SplitLayoutProps {
  /** El contenido principal: lo que se viene a hacer. */
  children: ReactNode;
  /**
   * El panel que lo apoya: explica, resume o remata.
   *
   * Va DESPUÉS en el documento, en los dos anchos. Quien recorre la pantalla con
   * teclado o con un lector llega primero a lo que hay que hacer y después a lo
   * que lo explica, igual que quien la mira. Colocarlo antes y moverlo con
   * `order` separaría lo que se ve de lo que se recorre.
   */
  aside: ReactNode;
  className?: string;
}

/**
 * Contenido principal y panel de apoyo, lado a lado cuando hay ancho.
 *
 * EXISTE PORQUE SON CINCO PANTALLAS Y NO UNA. El inicio del niño, sus tareas, sus
 * canjes y las dos altas del padre reparten igual, y sus maquetas lo dibujan igual.
 * Que cada una escribiera su propia rejilla es la forma por defecto en que estas
 * cinco dejarían de parecerse — la regla 3 del proyecto, una sola fuente de verdad.
 *
 * LA PROPORCIÓN ES 3/2 Y NO LA DE LA MAQUETA, a conciencia. Las maquetas usan
 * `1.5fr` en tres pantallas y `1.55fr` en dos: dos números para la misma intención,
 * y escribirlos pide un valor arbitrario de Tailwind que un test prohíbe. Cinco
 * columnas con tres y dos dan exactamente 1,5 y salen de la escala. La diferencia
 * con 1,55 es de seis píxeles en un monitor de 1600.
 *
 * APILADO POR DEBAJO DE `lg`. Una tablet en vertical no tiene ancho para dos
 * columnas, y es el dispositivo más probable de este producto.
 *
 * `items-start` PARA QUE EL PANEL NO SE ESTIRE. Sin eso, un panel de tres líneas al
 * lado de una lista de diez tareas se estira hasta abajo y deja un bloque de color
 * vacío que no dice nada.
 *
 * No sabe de negocio: recibe dos huecos y los coloca. Es la misma frontera por la
 * que `Pagination` recibe sus enlaces en vez de construirlos.
 */
export function SplitLayout({ children, aside, className }: SplitLayoutProps): React.ReactElement {
  return (
    <div className={cx("grid items-start gap-5 lg:grid-cols-5", className)}>
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-3">{children}</div>
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">{aside}</div>
    </div>
  );
}
