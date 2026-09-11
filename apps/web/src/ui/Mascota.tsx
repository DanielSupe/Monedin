import type { ReactNode } from "react";
import { cx } from "./cx.js";
import { POSES, type Pose } from "./mascot-poses.js";

export type MascotaSize = "small" | "medium" | "large";

/** Las tres medidas del sistema. Ninguna pantalla pide píxeles. */
const SIZES: Record<MascotaSize, string> = {
  small: "w-12",
  medium: "w-20",
  large: "w-32",
};

export interface MascotaProps {
  pose: Pose;
  size?: MascotaSize;
  /** Lo que dice, en un globo a su lado. Sin esto, solo se dibuja. */
  children?: ReactNode;
  className?: string;
}

/**
 * Monedín, y lo que dice.
 *
 * La ilustración es DECORATIVA y no se anuncia: lo que cuenta lo que pasa es el
 * texto del globo, o el de la pantalla si no hay globo. Anunciarla diría la
 * misma cosa dos veces, que es la razón por la que los iconos de la navegación
 * también son decorativos.
 *
 * La pose se pide por su nombre y NO por una ruta de archivo: el catálogo es
 * `mascot-poses.ts`, y pedir una que no existe no compila. Cuatro archivos del
 * proyecto importaban los PNG por su ruta antes de esto.
 *
 * El globo es un HUECO y no una cadena. Algunas frases llevan una parte en
 * negrita, otras dos párrafos, y una prop de texto obligaría a inventar una
 * sintaxis para eso. Es la misma razón por la que `ChildForm` recibe su enlace
 * de cancelar en vez de un callback.
 */
export function Mascota({
  pose,
  size = "medium",
  children,
  className,
}: MascotaProps): React.ReactElement {
  const ilustracion = (
    <img src={POSES[pose]} alt="" aria-hidden="true" className={cx("h-auto", SIZES[size])} />
  );

  if (children === undefined) {
    return <span className={cx("inline-flex shrink-0", className)}>{ilustracion}</span>;
  }

  return (
    <span className={cx("flex items-end gap-3", className)}>
      {ilustracion}

      {/*
        La esquina de abajo a la izquierda se queda sin radio: es lo que hace que
        el globo apunte a quien habla en vez de flotar al lado. Un bocadillo
        redondo por los cuatro lados no dice de quién es.
      */}
      <span className="rounded-panel rounded-bl-none bg-surface-raised px-4 py-3 text-ink shadow-card">
        {children}
      </span>
    </span>
  );
}
